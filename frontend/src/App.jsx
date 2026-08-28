import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppLayout from './routes/AppLayout';
import Home from './routes/Home';
import Login from './routes/Login';
import Signup from './routes/Signup';
import Dashboard from './routes/Dashboard';
import AdminDashboard from './routes/AdminDashboard';
import Unauthorized from './routes/Unauthorized';
import NotFound from './routes/NotFound';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AdminRoute from './components/routing/AdminRoute';
import PublicOnlyRoute from './components/routing/PublicOnlyRoute';

/**
 * The route table, split out from <App> so tests can mount it inside a MemoryRouter
 * and start at any URL — including the protected ones, which is the only way to test
 * a guard honestly.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />

        {/* Already signed in? These two screens have nothing to offer. */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Any signed-in user. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Administrators only — the same guard, narrowed by role. */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

/**
 * The store Provider lives here rather than in main.jsx so that `render(<App />)` is
 * enough to mount the application in a test — which is what the team's existing smoke
 * test does. Suites that need to control the session build their own store and mount
 * <AppRoutes /> instead.
 */
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
