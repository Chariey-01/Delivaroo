import { color, font, radius } from '../../theme';

const VARIANTS = {
  primary: { background: color.ink, color: color.white, border: '1.5px solid transparent' },
  accent: { background: color.orange, color: color.ink, border: '1.5px solid transparent' },
  ghost: { background: 'transparent', color: color.ink, border: '1.5px solid rgba(17,17,17,.2)' },
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  full = false,
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...VARIANTS[variant],
        width: full ? '100%' : undefined,
        height: '52px',
        padding: '0 22px',
        borderRadius: radius.pill,
        fontFamily: font.body,
        fontSize: '15px',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'opacity .18s, transform .18s',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
