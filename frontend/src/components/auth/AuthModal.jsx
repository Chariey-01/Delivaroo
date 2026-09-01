import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, selectAuthError, selectAuthSubmitting } from '../../store/authSlice';
import { closeAuthModal, selectAuthModal, showToast } from '../../store/uiSlice';
import { color, font } from '../../theme';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Icon from '../Icon';

export default function AuthModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { open, returnTo } = useSelector(selectAuthModal);
  const submitting = useSelector(selectAuthSubmitting);
  const error = useSelector(selectAuthError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const close = () => dispatch(closeAuthModal());
  const submit = async () => {
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      dispatch(closeAuthModal());
      dispatch(showToast({ message: `Signed in as ${result.payload.fullName || result.payload.email}.`, tone: 'success' }));
      if (returnTo) navigate(returnTo);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Sign in">
      <h2 style={{ margin: '0 0 10px', fontFamily: font.display, fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', lineHeight: 0.95, textTransform: 'uppercase', color: color.ink }}>
        Sign in to send
      </h2>
      <p style={{ margin: '0 0 26px', fontSize: '14.5px', lineHeight: 1.55, color: color.body }}>
        Sign in securely to book, track, and manage your deliveries.
      </p>
      <Field label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} error={error} onChange={setEmail} />
      <div style={{ marginTop: '14px' }}>
        <Field label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={setPassword} onKeyDown={(event) => event.key === 'Enter' && email && password && submit()} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <Button full size="lg" onClick={submit} disabled={!email.trim() || !password || submitting} icon="arrow_forward">
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '22px 0 0', fontSize: '12.5px', lineHeight: 1.5, color: color.muted }}>
        <Icon name="lock" size={15} color={color.muted} /> Your session is protected with secure access tokens.
      </p>
    </Modal>
  );
}
