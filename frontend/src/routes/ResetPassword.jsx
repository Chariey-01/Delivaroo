import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { collectErrors, validateConfirm, validatePassword } from '../lib/validators';
import { color, radius } from '../theme';
import AuthCard from '../components/auth/AuthCard';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = collectErrors({
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    });
    setErrors(found);
    setServerError(null);
    if (!token || Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.password });
      setForm({ password: '', confirm: '' });
      setComplete(true);
    } catch (requestError) {
      setServerError(requestError.message || 'Unable to reset your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Use a strong password you have not used elsewhere."
      footer={<>Back to <Link to="/login">sign in</Link></>}
    >
      {complete ? (
        <div role="status" style={{ padding: '14px 16px', borderRadius: radius.field, background: 'rgba(31,122,84,.1)', color: color.ink, fontSize: '14px', lineHeight: 1.55 }}>
          Your password has been reset. You can now sign in with your new password.
        </div>
      ) : (
        <>
          {!token && <FormError message="This reset link is missing its token. Request a new password reset link to continue." />}
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
