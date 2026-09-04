import { Link } from 'react-router-dom';
import { color, font } from '../../theme';
import Logo from '../Logo';
import Icon from '../Icon';

// The panel beside the form. It is decoration with a job: it says what the account is
// for, in the brand's own voice, using photography the product already ships. On a
// phone the whole column is dropped by the stylesheet rather than merely hidden, so
// the image is never even fetched on the viewport that can least afford it.
const DEFAULT_PANEL = {
  photo: '/photos/hero-global-network.jpeg',
  eyebrow: 'Delivaroo',
  headline: 'One account. Every parcel, all the way to the door.',
  points: [
    'Book a courier in under a minute',
    'Live tracking from pickup to doorstep',
    'Every delivery you have ever sent, in one place'
  ]
};

/**
 * The frame all four authentication screens sit in, so they cannot drift apart.
 *
 * Split screen on the desktop, single column on a phone — the breakpoint lives in
 * global.css because inline styles cannot express one. Everything colour-bearing
 * still comes from theme.js.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
  eyebrow,
  notice,
  panel = DEFAULT_PANEL
}) {
  return (
    <main className="auth-shell" style={{ background: color.paper, fontFamily: font.body }}>
      <aside className="auth-aside" aria-hidden="true">
        <span
          className="auth-aside-photo"
          style={{ backgroundImage: `url(${panel.photo})` }}
        />
        <span className="auth-aside-wash" />
        <div className="auth-aside-body">
          <p
            style={{
              margin: 0,
              fontFamily: font.mono,
              fontSize: '11.5px',
              fontWeight: 600,
              letterSpacing: '.19em',
              textTransform: 'uppercase',
              color: color.orange
            }}
          >
            {panel.eyebrow}
          </p>
          <h2
            style={{
              margin: '18px 0 0',
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: 'clamp(30px,3vw,46px)',
              lineHeight: 1.06,
              letterSpacing: '-.028em',
              color: color.white,
              maxWidth: '15ch'
            }}
          >
            {panel.headline}
          </h2>
          <ul
            style={{
              display: 'grid',
              gap: '13px',
              margin: 'clamp(26px,3vw,40px) 0 0',
              padding: 0,
              listStyle: 'none',
              fontSize: '15px',
              lineHeight: 1.5,
              color: 'rgba(255,255,255,.86)'
            }}
          >
            {panel.points.map((point) => (
              <li key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                <Icon name="check_circle" size={19} color={color.orange} style={{ marginTop: '1px', flex: 'none' }} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="auth-form-col">
        <div className="auth-form">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: 'clamp(26px,4vh,40px)' }}>
            <Link to="/" style={{ display: 'inline-flex' }} aria-label="Delivaroo — home">
              <Logo size={19} />
            </Link>
            <Link to="/" className="auth-back-link">
              <Icon name="arrow_back" size={15} color="currentColor" />
              Back to site
            </Link>
          </div>

          {eyebrow && (
            <p
              style={{
                margin: '0 0 10px',
                fontFamily: font.mono,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '.17em',
                textTransform: 'uppercase',
                color: color.orangeDeep
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            style={{
              margin: '0 0 10px',
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: 'clamp(28px,3.6vw,38px)',
              lineHeight: 1.08,
              letterSpacing: '-.026em',
              color: color.ink
            }}
          >
            {title}
          </h1>
          <p style={{ margin: '0 0 26px', fontSize: '15px', lineHeight: 1.6, color: color.body }}>
            {subtitle}
          </p>

          {notice}
          {children}

          {footer && (
            <p
              style={{
                margin: '26px 0 0',
                paddingTop: '22px',
                borderTop: `1px solid ${color.borderSoft}`,
                fontSize: '14.5px',
                textAlign: 'center',
                color: color.body
              }}
            >
              {footer}
            </p>
          )}

          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              margin: '22px 0 0',
              fontSize: '12.5px',
              color: color.muted
            }}
          >
            <Icon name="lock" size={14} color="currentColor" />
            Secured with encrypted access tokens
          </p>
        </div>
      </div>
    </main>
  );
}
