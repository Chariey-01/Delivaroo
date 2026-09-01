import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearAuthError,
  login,
  selectAuthError,
  selectAuthSubmitting,
} from '../store/authSlice';
import { collectErrors, validateEmail } from '../lib/validators';
import AuthCard from '../components/auth/AuthCard';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = useSelector(selectAuthSubmitting);
  const serverError = useSelector(selectAuthError);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  // A stale "invalid credentials" left over from a previous visit is confusing on a
  // freshly opened form.
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();

    // Only the shape is checked here. Whether the password is *right* is the server's
    // answer, and deliberately not distinguished from a wrong email in the message it
    // returns — telling an attacker which half was correct is a gift.
    const found = collectErrors({
      email: validateEmail(form.email),
      password: form.password ? null : 'Password is required.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      // Back to whatever the guard interrupted, or the dashboard.
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to book a delivery and track your parcels."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <FormError message={serverError} />
      <form onSubmit={submit} noValidate>
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
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          error={errors.password}
          onChange={set('password')}
          disabled={submitting}
        />
        <p style={{ margin: '-8px 0 20px', textAlign: 'right', fontSize: '13.5px' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <Button type="submit" full disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
