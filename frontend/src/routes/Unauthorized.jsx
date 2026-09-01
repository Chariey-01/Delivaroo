import { Link } from 'react-router-dom';
import PageShell from './PageShell';
import { color } from '../theme';

/** Signed in, wrong role. A 403, said plainly — not another login prompt. */
export default function Unauthorized() {
  return (
    <PageShell
      title="You don't have access to that."
      subtitle="That area is restricted to administrators. If you think you should have access, ask an administrator to update your account."
    >
      <Link to="/dashboard" style={{ fontWeight: 700, color: color.orangeDeep }}>
        Back to your dashboard
      </Link>
    </PageShell>
  );
}
