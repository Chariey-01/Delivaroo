import { color } from '../../theme';

/** The waiting state guards and forms share, so "checking" never looks like "empty". */
export default function Spinner({ label = 'Loading…', size = 22 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px', color: color.muted }}
    >
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          flex: 'none',
          borderRadius: '999px',
          border: `3px solid rgba(17,17,17,.15)`,
          borderTopColor: color.orange,
          animation: 'delivaroo-spin .8s linear infinite',
        }}
      />
      <span style={{ fontSize: '14px' }}>{label}</span>
    </div>
  );
}
