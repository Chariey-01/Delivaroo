import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectIsAdmin, selectUser } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { color, font, radius } from '../theme';
import Logo from './Logo';

const linkStyle = ({ isActive }) => ({
  fontSize: '14.5px',
  fontWeight: 600,
  textDecoration: 'none',
  color: isActive ? color.orangeDeep : color.body,
});

export default function Nav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const admin = useSelector(selectIsAdmin);

  const signOut = async () => {
    await dispatch(logout());
    dispatch(showToast({ message: 'You have been signed out.', tone: 'success' }));
    navigate('/', { replace: true });
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        padding: '16px clamp(16px,4vw,40px)',
        borderBottom: '1px solid rgba(17,17,17,.08)',
        background: color.white,
        fontFamily: font.body,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex' }}>
        <Logo size={19} />
      </Link>

      <nav style={{ display: 'flex', gap: '18px', marginLeft: 'auto', alignItems: 'center' }}>
        {user ? (
          <>
            <NavLink to="/dashboard" style={linkStyle}>
              Dashboard
            </NavLink>
            {admin && (
              <NavLink to="/admin" style={linkStyle}>
                Admin
              </NavLink>
            )}
            <span style={{ fontSize: '14px', color: color.muted }}>{user.fullName || user.email}</span>
            <button
              type="button"
              onClick={signOut}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: radius.pill,
                border: '1.5px solid rgba(17,17,17,.2)',
                background: 'transparent',
                fontFamily: font.body,
                fontSize: '14px',
                fontWeight: 700,
                color: color.ink,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={linkStyle}>
              Sign in
            </NavLink>
            <NavLink to="/signup" style={linkStyle}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
