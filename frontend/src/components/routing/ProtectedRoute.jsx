// W1-13 / W2-12 — the route gate.
//
// Two things it must get right, and both are easy to get wrong:
//
//  1. It waits for the session question to be *answered*. On a hard refresh of a
//     protected URL the store starts with user: null while the stored token is still
//     being exchanged — redirecting on that first render would throw a signed-in user
//     out of the page they bookmarked.
//  2. It remembers where the person was going, so the login screen can send them
//     onward instead of dumping everyone on the dashboard.
//
// This is convenience and clarity, never security: the backend enforces authorization
// on every endpoint (§2), and a guard that only lives in the browser guards nothing.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthResolving, selectUser } from '../../store/authSlice';
import { hasRole } from '../../lib/roles';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ roles, children, redirectTo = '/login' }) {
  const user = useSelector(selectUser);
  const resolving = useSelector(selectAuthResolving);
  const location = useLocation();

  if (resolving) return <Spinner label="Checking your session…" />;

  if (!user) {
    // `replace` keeps the protected URL out of history, so Back from the login screen
    // does not bounce between the two.
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Signed in but wrong role: that is a 403, not a login prompt. Sending them back to
  // /login would be a lie — signing in again changes nothing.
  if (!hasRole(user, roles)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
