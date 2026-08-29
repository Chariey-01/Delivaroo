import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { ROLE_LABEL, roleOf } from '../lib/roles';
import PageShell from './PageShell';
import { color, radius } from '../theme';

/**
 * Placeholder for the admin portal (BACKENDPRD §13–§15), which belongs to the
 * admin-ui task. It exists here so the role guard has a real destination to protect
 * and the guard tests have something to assert against.
 */
export default function AdminDashboard() {
  const user = useSelector(selectUser);

  return (
    <PageShell
      title="Admin portal"
      subtitle="Parcel status, present location and status history for every delivery."
    >
      <p style={{ fontSize: '14px', color: color.muted }}>
        Signed in as {user?.email} · {ROLE_LABEL[roleOf(user)]}
      </p>
      <div
        style={{
          marginTop: '18px',
          padding: '26px',
          borderRadius: radius.card,
          border: '1.5px dashed rgba(17,17,17,.16)',
          fontSize: '14.5px',
          lineHeight: 1.6,
        }}
      >
        The admin screens are owned by the <code>feature/admin-ui</code> task. This route is
        already behind the role guard, so they can be dropped in here without touching the
        routing or the authorization.
      </div>
    </PageShell>
  );
}
