import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { color, radius } from '../theme';
import PageShell from './PageShell';

/**
 * The public landing page. Intentionally plain: the marketing design is another
 * task's work — this exists so `/` is a real route and the nav has somewhere to go.
 */
export default function Home() {
  const user = useSelector(selectUser);

  return (
    <PageShell
      title="Send it. Track it. Done."
      subtitle="Book a courier, watch your parcel move across the map, and know exactly when it lands."
    >
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          to={user ? '/dashboard' : '/signup'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '52px',
            padding: '0 26px',
            borderRadius: radius.pill,
            background: color.ink,
            color: color.white,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {user ? 'Go to dashboard' : 'Create an account'}
        </Link>
        {!user && (
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '52px',
              padding: '0 26px',
              borderRadius: radius.pill,
              border: '1.5px solid rgba(17,17,17,.2)',
              color: color.ink,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        )}
      </div>
    </PageShell>
  );
}
