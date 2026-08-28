// The role guard, spelled out for the one role that has extra powers (§2, §13–§15).
// A thin wrapper rather than a second implementation, so there is one gate to reason
// about and one place a mistake could live.

import ProtectedRoute from './ProtectedRoute';
import { ROLE } from '../../lib/roles';

export default function AdminRoute({ children }) {
  return <ProtectedRoute roles={[ROLE.ADMIN]}>{children}</ProtectedRoute>;
}
