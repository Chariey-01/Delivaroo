import { color, ease, radius } from '../../theme';
import Icon from '../Icon';

// Three jobs, one shape: explaining why the login screen appeared, confirming that
// something worked, and warning without alarming. Errors keep their own component —
// see FormError — because they carry role="alert" and these deliberately do not.
const TONES = {
  info: { border: 'rgba(36,75,66,.22)', background: 'rgba(36,75,66,.07)', accent: color.green, icon: 'info' },
  success: { border: 'rgba(36,75,66,.3)', background: 'rgba(36,75,66,.1)', accent: color.green, icon: 'check_circle' },
  warn: { border: 'rgba(248,135,53,.4)', background: 'rgba(248,135,53,.12)', accent: color.orangeDeep, icon: 'schedule' }
};

/**
 * A quiet panel above or in place of a form.
 *
 * `role` is the caller's decision on purpose: a confirmation the user is waiting for
 * should be announced as a status, while a note explaining the page they landed on
 * should not interrupt them mid-sentence.
 */
export default function AuthNotice({ tone = 'info', icon, title, role, children }) {
  const style = TONES[tone] ?? TONES.info;

  return (
    <div
      role={role}
      aria-live={role ? undefined : 'polite'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '20px',
        padding: '15px 17px',
        borderRadius: radius.field,
        border: `1px solid ${style.border}`,
        background: style.background,
        color: color.ink,
        animation: `riseIn .3s ${ease.out} both`
      }}
    >
      <Icon name={icon || style.icon} size={19} color={style.accent} style={{ marginTop: '1px', flex: 'none' }} />
      <span style={{ fontSize: '14px', lineHeight: 1.55 }}>
        {title && <strong style={{ display: 'block', marginBottom: '3px', fontWeight: 600 }}>{title}</strong>}
        {children}
      </span>
    </div>
  );
}
