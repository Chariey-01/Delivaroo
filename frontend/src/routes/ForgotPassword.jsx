import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import { validateEmail } from '../lib/validators';
import { friendlyAuthError } from '../lib/authPreferences';
import useAuthForm from '../hooks/useAuthForm';
import AuthCard from '../components/auth/AuthCard';
import AuthNotice from '../components/auth/AuthNotice';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import Icon from '../components/Icon';
import { color } from '../theme';

const VALIDATORS = { email: (value) => validateEmail(value) };
const INITIAL = { email: '' };

const PANEL = {
  photo: '/photos/hero-truck-sunset.jpeg',
  eyebrow: 'Account recovery',
  headline: 'Locked out? This takes one email.',
  points: [
    'A single-use link, sent to the address on the account',
    'It expires after 30 minutes, and a new request cancels the old link',
    'Your deliveries carry on in the meantime',
  ],
};

export default function ForgotPassword() {
  const form = useAuthForm({ initialValues: INITIAL, validators: VALIDATORS });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const request = async (email) => {
    setSubmitting(true);
    setError(null);
    try {
      await authApi.requestPasswordReset({ email });
      setSentTo(email);
    } catch (requestError) {
      setError(
        friendlyAuthError(requestError.message) ||
          'Unable to request a password reset. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.validateAll()) return;
    await request(form.values.email.trim());
  };

  return (
    <AuthCard
      eyebrow="Forgot password"
      title={sentTo ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sentTo
          ? 'Follow the link in the email to choose a new password.'
          : 'Enter the email on your account and we will send a reset link.'
      }
      panel={PANEL}
      footer={
        <>
          {/* Worded differently from the "Back to login" button above it on purpose:
              two controls with the same name is one control too many to a screen
              reader running through the page's links. */}
          Remembered it?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </>
      }
    >
      {sentTo ? (
        <>
          {/*
            Worded from the server's own answer, and for a reason: /auth/forgot-password
            replies identically whether or not the address is registered, so this screen
            must not imply the account exists. Confirming an email is registered to a
            stranger who typed it is exactly the enumeration leak §7 rules out.
          */}
          <AuthNotice role="status" tone="success" title="If the email exists, a reset link is on its way.">
            We sent instructions to <strong>{sentTo}</strong> if an account is registered to it.
            The link works once and expires after 30 minutes, so open it soon.
          </AuthNotice>

          <ul
            style={{
              display: 'grid',
              gap: '10px',
              margin: '0 0 24px',
              padding: 0,
              listStyle: 'none',
              fontSize: '13.5px',
              lineHeight: 1.55,
              color: color.body,
            }}
          >
            {['Nothing after a minute? Check the spam folder.', 'Still nothing? The address may not have an account.'].map(
              (line) => (
                <li key={line} style={{ display: 'flex', gap: '9px' }}>
                  <Icon name="info" size={16} color={color.muted} style={{ marginTop: '2px', flex: 'none' }} />
                  {line}
                </li>
              ),
            )}
          </ul>

          <div style={{ display: 'grid', gap: '10px' }}>
            <Button type="button" full size="lg" onClick={() => request(sentTo)} disabled={submitting}>
              {submitting && <span className="auth-spin" />}
              {submitting ? 'Resending…' : 'Resend the link'}
            </Button>
            <Button as={Link} to="/login" variant="ghost" full icon="arrow_back" iconPosition="left">
              Back to login
            </Button>
          </div>
        </>
      ) : (
        <>
          <FormError message={error} />
          <form onSubmit={submit} noValidate aria-busy={submitting}>
            <Field
              label="Email address"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="you@example.com"
              autoFocus
              required
              disabled={submitting}
              {...form.fieldProps('email')}
              required
            />
            <div style={{ marginTop: '22px', display: 'grid', gap: '10px' }}>
              <Button type="submit" full size="lg" disabled={submitting} icon={submitting ? undefined : 'send'}>
                {submitting && <span className="auth-spin" />}
                {submitting ? 'Sending reset link…' : 'Send reset link'}
              </Button>
              <Button as={Link} to="/login" variant="ghost" full icon="arrow_back" iconPosition="left">
                Back to login
              </Button>
            </div>
          </form>
        </>
      )}
    </AuthCard>
  );
}
