import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, login, selectAuthError, selectAuthSubmitting } from '../../store/authSlice';
import { closeAuthModal, selectAuthModal, showToast } from '../../store/uiSlice';
import { validateEmail } from '../../lib/validators';
import { friendlyAuthError } from '../../lib/authPreferences';
import useAuthForm from '../../hooks/useAuthForm';
import { color, font } from '../../theme';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import FormError from './FormError';
import Icon from '../Icon';
import FormError from './FormError';

// The same two checks the full sign-in screen makes, so a CTA that opens the modal
// and a visit to /login behave identically. Everything else — the request, the token
// handling, the error text — is the one shared thunk.
const VALIDATORS = {
  email: (value) => validateEmail(value),
  password: (value) => (value ? null : 'Password is required.'),
};

const INITIAL = { email: '', password: '' };

/**
 * Sign-in without leaving the page, for the CTAs that interrupt something the user
 * was already doing. It is a shortcut into the same authentication, never a second
 * implementation of it: anyone who wants the full screen — registration, password
 * recovery — is one link away from it.
 */
export default function AuthModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { open, returnTo } = useSelector(selectAuthModal);
  const submitting = useSelector(selectAuthSubmitting);
  const error = useSelector(selectAuthError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const close = () => {
    setPassword('');
    setErrors({});
    dispatch(clearAuthError());
    dispatch(closeAuthModal());
  };
  const submit = async (event) => {
    event?.preventDefault();
    const found = collectErrors({
      email: validateEmail(email),
      password: password ? null : 'Password is required.'
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      setEmail('');
      setPassword('');
      dispatch(closeAuthModal());
      dispatch(
        showToast({
          message: `Signed in as ${result.payload.fullName || result.payload.email}.`,
          tone: 'success',
        }),
      );
      if (returnTo) navigate(returnTo);
    }
  };

  const leaveFor = (path) => (event) => {
    event.preventDefault();
    close();
    navigate(path, { state: returnTo ? { from: { pathname: returnTo } } : undefined });
  };

  return (
    <Modal open={open} onClose={close} title="Sign in">
      <h2
        style={{
          margin: '0 0 10px',
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: 'clamp(28px,4vw,40px)',
          lineHeight: 0.95,
          textTransform: 'uppercase',
          color: color.ink,
        }}
      >
        Sign in to send
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: '14.5px', lineHeight: 1.55, color: color.body }}>
        Sign in securely to book, track, and manage your deliveries.
      </p>
      <FormError message={error} />
      <form onSubmit={submit} noValidate aria-busy={submitting}>
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChange={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: null }));
            if (error) dispatch(clearAuthError());
          }}
          disabled={submitting}
          required
        />
        <div style={{ marginTop: '14px' }}>
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            error={errors.password}
            onChange={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: null }));
              if (error) dispatch(clearAuthError());
            }}
            disabled={submitting}
            required
          />
        </div>
        <div style={{ marginTop: '20px' }}>
          <Button type="submit" full size="lg" disabled={submitting} icon="arrow_forward">
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '22px 0 0', fontSize: '12.5px', lineHeight: 1.5, color: color.muted }}>
        <Icon name="lock" size={15} color={color.muted} /> Your session is protected with secure access tokens.
      </p>
    </Modal>
  );
}
