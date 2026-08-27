import { Link } from 'react-router-dom';
import { color, font, radius } from '../../theme';

/** The frame both auth screens sit in, so they cannot drift apart visually. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: color.paper,
        fontFamily: font.body,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(24px,4vw,40px)',
          borderRadius: radius.card,
          background: color.white,
          boxShadow: '0 28px 60px -34px rgba(17,17,17,.35)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginBottom: '18px',
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '.02em',
            color: color.ink,
            textDecoration: 'none',
          }}
        >
          DELIVAROO
        </Link>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(24px,3.4vw,30px)', color: color.ink }}>{title}</h1>
        <p style={{ margin: '0 0 26px', fontSize: '14.5px', lineHeight: 1.55, color: color.body }}>
          {subtitle}
        </p>
        {children}
        {footer && (
          <p style={{ margin: '22px 0 0', fontSize: '14px', textAlign: 'center', color: color.body }}>
            {footer}
          </p>
        )}
      </div>
    </main>
  );
}
