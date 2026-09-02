import { color, ease, radius } from '../../theme';
import Icon from '../Icon';

/**
 * Whatever the server said, said once, above the form.
 *
 * role="alert" so it is announced the moment it appears — a failed sign-in is the one
 * thing on this page the user is waiting to hear about. The message itself is the
 * backend's, verbatim: it is written for a person, and by design it does not say
 * which half of the pair was wrong.
 */
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '11px',
        marginBottom: '20px',
        padding: '14px 16px',
        borderRadius: radius.field,
        border: `1px solid rgba(173,84,21,.45)`,
        background: 'rgba(173,84,21,.09)',
        fontSize: '14px',
        lineHeight: 1.55,
        color: color.orangeDeep,
        animation: `riseIn .28s ${ease.out} both`
      }}
    >
      <Icon name="error" size={19} color="currentColor" style={{ marginTop: '1px', flex: 'none' }} />
      <span>{message}</span>
    </div>
  );
}
