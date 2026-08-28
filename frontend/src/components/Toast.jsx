import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast, selectToast } from '../store/uiSlice';
import { color, font, radius } from '../theme';

const TONE = {
  info: color.ink,
  success: color.success,
  error: color.danger,
};

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch(dismissToast()), 4500);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '28px',
        transform: 'translateX(-50%)',
        zIndex: 100,
        maxWidth: 'min(92vw,460px)',
        padding: '13px 20px',
        borderRadius: radius.pill,
        background: TONE[toast.tone] ?? TONE.info,
        color: color.white,
        fontFamily: font.body,
        fontSize: '14px',
        boxShadow: '0 20px 40px -18px rgba(17,17,17,.6)',
      }}
    >
      {toast.message}
    </div>
  );
}
