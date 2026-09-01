import { useState } from 'react';
import { useSelector } from 'react-redux';
import { authApi } from '../api';
import { selectUser } from '../store/authSlice';
import { collectErrors, validateConfirm, validatePassword } from '../lib/validators';
import { color, radius } from '../theme';
import PageShell from './PageShell';
import FormError from '../components/auth/FormError';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function SecuritySettings() {
  const user = useSelector(selectUser);
  const [form, setForm] = useState({ currentPassword: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
    setSuccess(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = collectErrors({
      currentPassword: form.currentPassword ? null : 'Current password is required.',
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    });
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.password,
      });
      setForm({ currentPassword: '', password: '', confirm: '' });
      setSuccess('Password changed successfully.');
    } catch (requestError) {
      setServerError(requestError.message || 'Unable to change your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell eyebrow="Account" title="Security settings">
      <section style={{ maxWidth: '560px', padding: 'clamp(20px,3vw,32px)', borderRadius: radius.card, background: color.white, boxShadow: '0 18px 40px -30px rgba(17,17,17,.35)' }}>
        <p style={{ margin: '0 0 24px', fontSize: '14.5px', lineHeight: 1.6, color: color.body }}>
          Signed in as <strong>{user?.email}</strong>. Confirm your current password before choosing a new one.
        </p>
        <FormError message={serverError} />
        {success && <div role="status" style={{ marginBottom: '18px', padding: '12px 15px', borderRadius: radius.field, background: 'rgba(31,122,84,.1)', color: color.ink, fontSize: '14px' }}>{success}</div>}
        <form onSubmit={submit} noValidate>
          <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} error={errors.currentPassword} onChange={set('currentPassword')} disabled={submitting} />
          <Field label="New password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} error={errors.password} onChange={set('password')} disabled={submitting} />
          <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" placeholder="Repeat your new password" value={form.confirm} error={errors.confirm} onChange={set('confirm')} disabled={submitting} />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      </section>
    </PageShell>
  );
}
