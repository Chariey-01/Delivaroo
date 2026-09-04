import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearAuthError,
  login,
  selectAuthError,
  selectAuthSubmitting,
} from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { validateEmail } from '../lib/validators';
import { friendlyAuthError, getRememberedEmail, setRememberedEmail } from '../lib/authPreferences';
import useAuthForm from '../hooks/useAuthForm';
import AuthCard from '../components/auth/AuthCard';
import AuthNotice from '../components/auth/AuthNotice';
import CheckRow from '../components/auth/CheckRow';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

// Only the *shape* is checked here. Whether the password is right is the server's
// answer, and it deliberately does not distinguish a wrong password from an unknown
// email — telling an attacker which half was correct is a gift.
const VALIDATORS = {
  email: (value) => validateEmail(value),
  password: (value) => (value ? null : 'Password is required.'),
};

const PANEL = {
  photo: '/photos/hero-global-network.jpeg',
  eyebrow: 'Welcome back',
  headline: 'Your parcels, exactly where you left them.',
  points: [
    'Book a courier in about a minute',
    'Live tracking on everything still moving',
    'One history for every delivery you have sent',
  ],
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = useSelector(selectAuthSubmitting);
  const serverError = useSelector(selectAuthError);

  // A remembered email is a convenience, never a password: the field beside it always
  // starts empty. The box itself starts ticked, which is what the app did before it
  // was a choice — clearing it is the deliberate act, for a shared machine.
  const [remembered] = useState(getRememberedEmail);
  const [remember, setRemember] = useState(true);
  const form = useAuthForm({
    initialValues: { email: remembered, password: '' },
    validators: VALIDATORS,
  });

  // A stale "invalid credentials" left over from a previous visit is confusing on a
  // freshly opened form.
  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
    if (serverError) dispatch(clearAuthError());
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.validateAll()) return;

    const result = await dispatch(
      login({ email: form.values.email, password: form.values.password, remember }),
    );

    if (login.fulfilled.match(result)) {
      setRememberedEmail(remember ? form.values.email.trim() : '');
      const name = result.payload?.fullName || result.payload?.email || 'you';
      dispatch(showToast({ message: `Signed in as ${name}.`, tone: 'success' }));
      // Back to whatever the guard interrupted, or the dashboard.
      navigate(from ?? '/dashboard', { replace: true });
    }
  };

  return (
    <AuthCard
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Sign in to book a delivery and track your parcels."
      panel={PANEL}
      notice={
        from ? (
          <AuthNotice tone="warn" icon="lock">
            Sign in to continue — that page is only available to account holders.
          </AuthNotice>
        ) : null
      }
      footer={
        <>
          New here?{' '}
          <Link to="/signup" state={location.state} className="auth-link">
            Create an account
          </Link>
        </>
      }
    >
      <FormError message={serverError} />
      <form onSubmit={submit} noValidate aria-busy={submitting}>
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
          required
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
          required
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
