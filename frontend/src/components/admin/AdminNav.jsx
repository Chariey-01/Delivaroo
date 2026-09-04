import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { can } from '../../lib/roles';
import { color, control, ease, font, radius } from '../../theme';
import { SECTIONS } from './adminSections';
import Icon from '../Icon';

/**
 * §27 — the portal's own navigation, kept apart from the site nav because it is a
 * different job: the site nav is for someone buying a delivery, this is for someone
 * running them. A rail on a desktop, a scrolling row of pills on a phone — the same
 * decision the dispatch table makes about itself at the same breakpoint.
 *
 * Sections the signed-in person may not open are absent, not disabled. A greyed-out
 * door with no explanation is §25's dead end; "you are a dispatcher" is a fact about
 * the account, not something this screen can talk them out of.
 */
export default function AdminNav() {
  const narrow = useSelector((state) => state.ui.narrow);
  const user = useSelector(selectUser);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const visible = SECTIONS.filter((section) => can(user, section.permission));
  const current = visible.find(
    (section) => pathname === section.to || (section.to !== '/admin' && pathname.startsWith(`${section.to}/`))
  ) || visible[0];

  const item = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '44px',
    padding: narrow ? '0 16px' : '0 14px',
    borderRadius: narrow ? radius.pill : '14px',
    border: `1px solid ${isActive ? color.ink : narrow ? 'rgba(28,32,31,.14)' : 'transparent'}`,
    background: isActive ? color.green : narrow ? color.card : 'transparent',
    color: isActive ? color.paper : color.body,
    fontFamily: font.body,
    fontSize: '14.5px',
    fontWeight: isActive ? 700 : 600,
    letterSpacing: 0,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: `background .18s ${ease.out}, color .18s, border-color .18s`
  });

  if (narrow) {
    return (
      <nav aria-label="Admin sections" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'grid', gap: '8px' }}>
          <span style={{ ...control.label, marginBottom: 0 }}>Admin section</span>
          <span style={{ position: 'relative', display: 'block' }}>
            <Icon
              name={current?.icon || 'dashboard'}
              size={19}
              color={color.orangeDeep}
              style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <select
              aria-label="Admin section"
              value={current?.to || '/admin'}
              onChange={(event) => navigate(event.target.value)}
              style={{
                ...control.field,
                height: '50px',
                paddingLeft: '46px',
                paddingRight: '42px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {visible.map((section) => (
                <option key={section.id} value={section.to}>
                  {section.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Admin sections"
      style={{
        position: 'sticky',
        top: '96px',
        flex: '0 0 214px',
        display: 'grid',
        gap: '2px',
        alignContent: 'start'
      }}
    >
      {visible.map((section) => (
        <NavLink key={section.id} to={section.to} end={section.to === '/admin'} style={item}>
          {({ isActive }) => (
            <>
              <Icon name={section.icon} size={18} color={isActive ? color.orange : color.muted} />
              {section.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
