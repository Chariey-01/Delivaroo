import { color } from '../theme';

/** Shared page frame so every screen gets the same width, gutter and heading rhythm. */
export default function PageShell({ title, subtitle, children, aside }) {
  return (
    <main style={{ maxWidth: '1120px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,40px)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(26px,4vw,38px)', color: color.ink }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: '0 0 28px', maxWidth: '60ch', fontSize: '15.5px', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </main>
  );
}
