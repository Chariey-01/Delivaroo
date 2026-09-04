import { color, radius } from '../../theme';

/** Whatever the server said, said once, above the form. */
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        marginBottom: '18px',
        padding: '12px 15px',
        borderRadius: radius.field,
        border: `1.5px solid ${color.orangeDeep}`,
        background: 'rgba(179,38,30,.08)',
        fontSize: '14px',
        lineHeight: 1.5,
        color: color.orangeDeep,
      }}
    >
      {message}
    </div>
  );
}
