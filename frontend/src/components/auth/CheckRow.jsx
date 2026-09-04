import { color } from '../../theme';

/**
 * A checkbox whose whole row is the label, so the target is a row rather than a 20px
 * square — the difference between usable and infuriating on a phone. The native input
 * is kept (not restyled into a div) so keyboard, form autofill and assistive tech all
 * behave exactly as the platform intends.
 */
export default function CheckRow({ checked, onChange, disabled, name, children, hint }) {
  return (
    <label className="auth-check">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span style={{ fontSize: '14px', lineHeight: 1.5, color: color.ink }}>
        {children}
        {hint && (
          <span style={{ display: 'block', marginTop: '2px', fontSize: '12.5px', color: color.muted }}>{hint}</span>
        )}
      </span>
    </label>
  );
}
