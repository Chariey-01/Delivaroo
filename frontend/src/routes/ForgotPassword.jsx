import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import { collectErrors, validateEmail } from '../lib/validators';
import { color, radius } from '../theme';
import AuthCard from '../components/auth/AuthCard';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const found = collectErrors({ email: validateEmail(email) });
    setFieldError(found.email || null);
    setError(null);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await authApi.requestPasswordReset({ email });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to request a password reset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email address and we will send a link if the account exists."
      footer={<>Remembered it? <Link to="/login">Sign in</Link></>}
    >
      {complete ? (
        <div role="status" style={{ padding: '14px 16px', borderRadius: radius.field, background: 'rgba(31,122,84,.1)', color: color.ink, fontSize: '14px', lineHeight: 1.55 }}>
          If the email exists, a password reset link will be sent. Check your inbox and follow the link to continue.
        </div>
      ) : (
        <>
          <FormError message={error} />
          <form onSubmit={submit} noValidate>
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              error={fieldError}
              onChange={(value) => {
                setEmail(value);
                setFieldError(null);
              }}
              disabled={submitting}
            />
            <Button type="submit" full disabled={submitting}>
              {submitting ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
