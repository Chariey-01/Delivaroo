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

  // Where a guard sent them, if a guard sent them. Worth saying out loud: landing on
  // a login screen you did not ask for is otherwise just confusing.
  const from = location.state?.from?.pathname ?? null;

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
      <FormError message={friendlyAuthError(serverError)} />

      {/* A real <form>, so Enter submits and browsers offer to save the credentials. */}
      <form onSubmit={submit} noValidate>
        <div className="auth-fields">
          <Field
            label="Email address"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            autoFocus={!remembered}
            required
            disabled={submitting}
            {...form.fieldProps('email')}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            autoFocus={Boolean(remembered)}
            required
            disabled={submitting}
            {...form.fieldProps('password')}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            margin: '14px 0 22px',
          }}
        >
          <CheckRow
            name="remember"
            checked={remember}
            onChange={setRemember}
            disabled={submitting}
          >
            Remember me
          </CheckRow>
          <Link to="/forgot-password" className="auth-link" style={{ fontSize: '14px' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" full size="lg" disabled={submitting} icon={submitting ? undefined : 'arrow_forward'}>
          {submitting && <span className="auth-spin" />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
