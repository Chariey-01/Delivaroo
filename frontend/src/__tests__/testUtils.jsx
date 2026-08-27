// Shared test harness.
//
// Every suite mounts the real store, the real route table and the real guards — the
// only thing stubbed is the network. That is what makes these integration tests
// rather than a set of mirrors: if a reducer, a selector or a guard is wrong, they
// fail here, and if the backend contract changes, `mockApi` is the one file to edit.

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { makeStore } from '../store';
import { AppRoutes } from '../App';

export const ADMIN_USER = {
  id: 2,
  email: 'admin@delivaroo.test',
  role: 'ADMIN',
  profile: { full_name: 'Ada Admin', phone: '+254700000002' },
};

export const CUSTOMER_USER = {
  id: 1,
  email: 'customer@delivaroo.test',
  role: 'USER',
  profile: { full_name: 'Cassie Customer', phone: '+254700000001' },
};

export const TOKENS = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
};

/** A Flask-shaped success body: `{ message, data }` per BACKENDPRD §23. */
export const ok = (data, message = 'OK') => ({
  status: 200,
  body: { message, data },
});

/** A Flask-shaped error body: `{ message }`. */
export const fail = (status, message) => ({ status, body: { message } });

/**
 * Route `fetch` from a table of `'METHOD /api/path'` → response. An unlisted route
 * fails the test loudly rather than resolving to undefined and producing a confusing
 * downstream error.
 */
export function mockApi(routes) {
  const calls = [];

  global.fetch = jest.fn(async (url, options = {}) => {
    const method = options.method ?? 'GET';
    const path = String(url);
    const key = `${method} ${path}`;
    calls.push({ method, path, options, body: options.body ? JSON.parse(options.body) : undefined });

    const entry = routes[key] ?? routes[path];
    if (!entry) throw new Error(`Unstubbed request: ${key}`);

    const resolved = typeof entry === 'function' ? entry(calls.at(-1)) : entry;
    const { status = 200, body = null } = resolved;

    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === null ? '' : JSON.stringify(body)),
    };
  });

  return calls;
}

/** Mount the whole app at `route`, with a fresh store each time. */
export function renderApp({ route = '/', preloadedState } = {}) {
  const store = makeStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
  return { ...utils, store };
}

/** A store state with the session question already answered, for guard tests. */
export const signedInState = (user) => ({
  auth: {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: true,
      fullName: user.profile.full_name,
      phone: user.profile.phone,
      profileImage: null,
    },
    status: 'ready',
    submitting: false,
    error: null,
  },
});

export const signedOutState = {
  auth: { user: null, status: 'ready', submitting: false, error: null },
};
