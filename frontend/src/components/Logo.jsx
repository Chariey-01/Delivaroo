import { color, font } from '../theme';

// The three feathers of the kite, drawn in a 420x270 box whose only fixed point is
// the sharp convergence at (0,197) — every blade tapers back to it, which is what
// makes the mark read as one wing rather than three stripes. They are separate
// paths with no stroke, so the gaps between them show the page through and the
// mark sits on any background.
const FEATHERS = [
  'M0 197 C 140 152 275 62 405 2 C 401 48 380 82 348 104 C 248 141 118 179 0 197 Z',
  'M0 197 C 122 189 252 154 344 113 C 350 152 340 184 316 203 C 218 215 99 208 0 197 Z',
  'M0 197 C 102 215 198 220 288 206 C 276 238 240 261 194 263 C 118 252 47 226 0 197 Z',
];

/** The kite on its own, sized by height — the wordmark is the caller's business. */
export function LogoMark({ height = 22, fill = color.brand, title }) {
  return (
    <svg
      viewBox="0 0 420 270"
      height={height}
      width={(height * 420) / 270}
      fill={fill}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {FEATHERS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * The full lockup: kite plus wordmark. `size` drives both, so the two never drift
 * out of proportion when a caller wants it bigger.
 */
export default function Logo({ size = 20, name = 'Delivaroo', tone = color.ink }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.38}px`,
        lineHeight: 1,
      }}
    >
      <LogoMark height={size * 1.5} />
      <span
        style={{
          fontFamily: font.body,
          fontSize: `${size}px`,
          fontWeight: 800,
          letterSpacing: '-.015em',
          color: tone,
        }}
      >
        {name}
      </span>
    </span>
  );
}
