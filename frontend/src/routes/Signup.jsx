import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearAuthError,
  selectAuthError,
  selectAuthSubmitting,
  signup,
} from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import {
  validateConfirm,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../lib/validators';
import { friendlyAuthError, setRememberedEmail } from '../lib/authPreferences';
import { color } from '../theme';
import useAuthForm from '../hooks/useAuthForm';
import AuthCard from '../components/auth/AuthCard';
import CheckRow from '../components/auth/CheckRow';
import FormError from '../components/auth/FormError';
import PasswordStrength from '../components/auth/PasswordStrength';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';

// The same rules the server applies, checked early so a typo costs a keystroke rather
// than a round trip. The server checks all of them again (§23) — this is courtesy,
// not enforcement.
const VALIDATORS = {
  fullName: (value) => validateFullName(value),
  email: (value) => validateEmail(value),
  phone: (value) => validatePhone(value),
  password: (value) => validatePassword(value),
  confirm: (value, values) => (value ? validateConfirm(values.password, value) : 'Confirm your password.'),
};

const INITIAL = { fullName: '', email: '', phone: '', password: '', confirm: '' };

const PANEL = {
  photo: '/photos/hero-motorbike-city.jpeg',
  eyebrow: 'Create your account',
  headline: 'Send your first parcel in about a minute.',
  points: [
    'Price and route quoted before you commit',
    'Road, motorbike, air or sea — you choose',
    'Live tracking and delivery updates, free',
  ],
};

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const submitting = useSelector(selectAuthSubmitting);
  const serverError = useSelector(selectAuthError);

  const form = useAuthForm({ initialValues: INITIAL, validators: VALIDATORS });
  // Consent is a decision, not a form value: it is not sent anywhere and it is not
  // pre-ticked. Its own error state, because it is not a field with a message slot.
  const [accepted, setAccepted] = useState(false);
  const [consentError, setConsentError] = useState(null);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const submit = async (event) => {
    event.preventDefault();
    const fieldsOk = form.validateAll();
    setConsentError(accepted ? null : 'Please accept the terms to create an account.');
    if (!fieldsOk || !accepted) return;

    // Register signs you in — the backend returns the token pair with the new user
    // (§19), so making someone log in again immediately would be busywork.
    // Only what /auth/register needs: the confirmation copy is a UI concern and has
    // no business travelling through the store or over the wire.
    const { fullName, email, phone, password } = form.values;
    const result = await dispatch(signup({ fullName, email, phone, password, remember: true }));
    if (signup.fulfilled.match(result)) {
      setRememberedEmail(form.values.email.trim());
      dispatch(showToast({ message: 'Account created. Welcome to Delivaroo.', tone: 'success' }));
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      subtitle="One account to send parcels and follow them to the door."
      panel={PANEL}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="auth-link">
            Sign in
          </Link>
        </>
      }
    >
      <FormError message={friendlyAuthError(serverError)} />

      <form onSubmit={submit} noValidate>
        <div className="auth-fields">
          <Field
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="Ada Lovelace"
            autoFocus
            required
            disabled={submitting}
            {...form.fieldProps('fullName')}
          />
          <Field
            label="Email address"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            required
            disabled={submitting}
            {...form.fieldProps('email')}
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+254 700 000 000"
            hint="Used only to reach you about a delivery."
            required={false}
            disabled={submitting}
            {...form.fieldProps('phone')}
          />
          <div>
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              required
              describedBy="signup-password-strength"
              disabled={submitting}
              {...form.fieldProps('password')}
            />
            <PasswordStrength id="signup-password-strength" value={form.values.password} />
          </div>
          <Field
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            required
            disabled={submitting}
            {...form.fieldProps('confirm')}
          />
        </div>

        <div style={{ margin: '18px 0 22px' }}>
          <CheckRow
            name="terms"
            checked={accepted}
            disabled={submitting}
            onChange={(next) => {
              setAccepted(next);
              if (next) setConsentError(null);
            }}
          >
            I agree to the{' '}
            <Link to="/#footer" className="auth-link">Terms &amp; Conditions</Link>{' '}
            and the{' '}
            <Link to="/#footer" className="auth-link">Privacy Policy</Link>.
          </CheckRow>
          {consentError && (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: '13px', color: color.orangeDeep }}>
              {consentError}
            </p>
          )}
        </div>

        <Button type="submit" full size="lg" disabled={submitting} icon={submitting ? undefined : 'arrow_forward'}>
          {submitting && <span className="auth-spin" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
