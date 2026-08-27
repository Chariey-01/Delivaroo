import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearAuthError,
  selectAuthError,
  selectAuthSubmitting,
  signup,
} from '../store/authSlice';
import {
  collectErrors,
  validateConfirm,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../lib/validators';
import AuthCard from '../components/auth/AuthCard';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submitting = useSelector(selectAuthSubmitting);
  const serverError = useSelector(selectAuthError);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = collectErrors({
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    // Register signs you in — the backend returns the token pair with the new user
    // (§19), so making someone log in again immediately would be busywork.
    const result = await dispatch(signup(form));
    if (signup.fulfilled.match(result)) navigate('/dashboard', { replace: true });
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="One account to send parcels and follow them to the door."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <FormError message={serverError} />
      <form onSubmit={submit} noValidate>
        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={form.fullName}
          error={errors.fullName}
          onChange={set('fullName')}
          disabled={submitting}
        />
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={set('email')}
          disabled={submitting}
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+254 700 000 000"
          hint="Optional — used only to reach you about a delivery."
          value={form.phone}
          error={errors.phone}
          onChange={set('phone')}
          disabled={submitting}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          error={errors.password}
          onChange={set('password')}
          disabled={submitting}
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          error={errors.confirm}
          onChange={set('confirm')}
          disabled={submitting}
        />
        <Button type="submit" full disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
