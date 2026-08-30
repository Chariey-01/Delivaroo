// The mirror of ProtectedRoute: /login and /signup have nothing to offer someone who
// is already signed in, so they are sent on to where they were headed.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuthResolving, selectUser } from '../../store/authSlice';
import Spinner from '../ui/Spinner';

export default function PublicOnlyRoute({ children }) {
  const user = useSelector(selectUser);
  const resolving = useSelector(selectAuthResolving);
  const location = useLocation();

  if (resolving) return <Spinner label="Checking your session…" />;
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />;

  return children ?? <Outlet />;
}
