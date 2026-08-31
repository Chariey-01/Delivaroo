// W2-12 — protected routes and role guards, exercised through the real route table.
//
// These assert browser-side routing behaviour only. Authorization itself is the
// backend's job (BACKENDPRD §2): a guard that passes here proves the UI is coherent,
// not that the data is safe.

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ADMIN_USER,
  CUSTOMER_USER,
  mockApi,
  ok,
  renderApp,
  renderSignedIn,
  signedOutState,
} from '../testUtils';
import { clearTokens, setTokens } from '../../lib/tokenStorage';

beforeEach(() => {
  clearTokens();
  mockApi({});
});

describe('unauthenticated users', () => {
  test('a protected route redirects to the login screen', async () => {
    renderApp({ route: '/dashboard', preloadedState: signedOutState });
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  test('an admin route also redirects to login, not to the 403 page', async () => {
    renderApp({ route: '/admin', preloadedState: signedOutState });
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument();
  });

  test('public routes stay reachable', async () => {
    renderApp({ route: '/', preloadedState: signedOutState });
    expect(await screen.findByRole('heading', { name: /the future of delivery is here/i })).toBeInTheDocument();
  });
});

describe('authenticated customers', () => {
  test('reach their own dashboard', async () => {
    renderSignedIn(CUSTOMER_USER, { route: '/dashboard' });
    expect(await screen.findByText(/hello, cassie/i)).toBeInTheDocument();
  });

  test('are refused the admin route with a 403, not a login prompt', async () => {
    renderSignedIn(CUSTOMER_USER, { route: '/admin' });

    expect(await screen.findByRole('heading', { name: /don't have access/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
  });

  test('do not see the admin link in the navigation', async () => {
    renderSignedIn(CUSTOMER_USER, { route: '/dashboard' });
    await screen.findByText(/hello, cassie/i);
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
  });

  test('are sent on from /login rather than shown the form again', async () => {
    renderSignedIn(CUSTOMER_USER, { route: '/login' });
    expect(await screen.findByText(/hello, cassie/i)).toBeInTheDocument();
  });
});

describe('administrators', () => {
  test('reach the admin portal', async () => {
    renderSignedIn(ADMIN_USER, { route: '/admin' });
    expect(await screen.findByText('Operations at a glance')).toBeInTheDocument();
  });

  test('also reach the ordinary dashboard', async () => {
    renderSignedIn(ADMIN_USER, { route: '/dashboard' });
    expect(await screen.findByText(/hello, ada/i)).toBeInTheDocument();
  });

  test('see the admin link in the navigation', async () => {
    renderSignedIn(ADMIN_USER, { route: '/dashboard' });
    await screen.findByText(/hello, ada/i);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /ada admin/i }));
    expect(screen.getByRole('menuitem', { name: /admin portal/i })).toBeInTheDocument();
  });
});

describe('session restoration', () => {
  test('a stored token is exchanged for the user, and the protected route renders', async () => {
    setTokens({ access: 'stored-token', refresh: 'stored-refresh' });
    mockApi({ 'GET /api/auth/me': ok({ user: ADMIN_USER }) });

    // No preloaded user: exactly the state after a hard refresh on a protected URL.
    renderApp({ route: '/admin' });

    expect(await screen.findByText('Operations at a glance')).toBeInTheDocument();
  });

  test('a guard shows the checking state instead of bouncing while the token is exchanged', async () => {
    setTokens({ access: 'stored-token' });

    // A request that never settles: the guard must wait, not redirect.
    global.fetch = jest.fn(() => new Promise(() => {}));

    renderApp({ route: '/dashboard' });

    expect(await screen.findByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
  });

  test('an expired stored token ends at the login screen without an error banner', async () => {
    setTokens({ access: 'expired' });
    mockApi({ 'GET /api/auth/me': { status: 401, body: { message: 'Token has expired' } } });

    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('unknown routes', () => {
  test('render the not-found page', async () => {
    renderApp({ route: '/nowhere', preloadedState: signedOutState });
    expect(await screen.findByRole('heading', { name: /that page has moved on/i })).toBeInTheDocument();
  });
});
