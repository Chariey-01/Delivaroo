import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { validateConfirm, validatePassword } from '../lib/validators';
import { friendlyAuthError } from '../lib/authPreferences';
import useAuthForm from '../hooks/useAuthForm';
import AuthCard from '../components/auth/AuthCard';
import AuthNotice from '../components/auth/AuthNotice';
import FormError from '../components/auth/FormError';
import PasswordStrength from '../components/auth/PasswordStrength';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

const VALIDATORS = {
  password: (value) => validatePassword(value),
  confirm: (value, values) => (value ? validateConfirm(values.password, value) : 'Confirm your new password.'),
};

const INITIAL = { password: '', confirm: '' };

const PANEL = {
  photo: '/photos/hero-air-freight.jpeg',
  eyebrow: 'New password',
  headline: 'Choose one you have not used anywhere else.',
  points: [
    'A long passphrase beats a short, clever one',
    'A password manager will remember it for you',
    'This link works once, and only for your account',
  ],
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const form = useAuthForm({ initialValues: INITIAL, validators: VALIDATORS });
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setServerError(null);
    if (!token || !form.validateAll()) return;

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.password });
      setForm({ password: '', confirm: '' });
      setComplete(true);
    } catch (requestError) {
      setServerError(
        friendlyAuthError(requestError.message) || 'Unable to reset your password. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      eyebrow="Reset password"
      title={complete ? 'Password updated' : 'Choose a new password'}
      subtitle={
        complete
          ? 'Your new password is active on every device.'
          : 'Use a strong password you have not used elsewhere.'
      }
      panel={PANEL}
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="auth-link">
            sign in
          </Link>
        </>
      }
    >
      {complete ? (
        <>
          <AuthNotice role="status" tone="success" title="Your password has been reset.">
            Sign in with the new password. Any other sessions using the old one have been left
            behind.
          </AuthNotice>
          <Button type="button" full size="lg" onClick={() => navigate('/login', { replace: true })} icon="arrow_forward">
            Continue to sign in
          </Button>
        </>
      ) : (
        <>
          {/* A link with no token cannot be completed, so the form is disabled rather
              than left to fail on submit with a message the user cannot act on. */}
          {!token && (
            <AuthNotice tone="warn" icon="link_off" title="This reset link is incomplete.">
              It is missing its token — links can be truncated by email clients.{' '}
              <Link to="/forgot-password" className="auth-link">Request a new one</Link>.
            </AuthNotice>
          )}
          <FormError message={serverError} />
          <form onSubmit={submit} noValidate aria-busy={submitting}>
            <Field
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              error={errors.password}
              onChange={set('password')}
              disabled={submitting || !token}
              required
              minLength={8}
            />
            <Field
              label="Confirm new password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={form.confirm}
              error={errors.confirm}
              onChange={set('confirm')}
              disabled={submitting || !token}
              required
              minLength={8}
            />
            <Button type="submit" full disabled={submitting || !token}>
              {submitting ? 'Resetting password...' : 'Reset password'}
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
