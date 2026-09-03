// W3-02 — integration: the signup and login flows, end to end through the real store,
// the real route table and the real guards. Only fetch is stubbed.

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ADMIN_USER,
  CUSTOMER_USER,
  TOKENS,
  fail,
  mockApi,
  ok,
  renderApp,
  signedOutState,
} from '../testUtils';
import { clearTokens, getAccessToken, getRefreshToken } from '../../lib/tokenStorage';

beforeEach(() => {
  clearTokens();
  // Signing in with "Remember me" leaves the address behind for next time, which is
  // the feature working — but it must not bleed from one test into the next.
  localStorage.clear();
  sessionStorage.clear();
});

// findBy, not getBy: the guards render a "checking your session" spinner until the
// stored-token question is answered, so the form is not in the DOM on first paint.
const type = async (user, label, value) =>
  user.type(await screen.findByLabelText(label), value);

/** Registration requires consent, so every signup path has to give it. */
const acceptTerms = async (user) => user.click(await screen.findByRole('checkbox', { name: /i agree/i }));

describe('signup', () => {
  test('creates the account, stores the tokens and lands on the dashboard', async () => {
    const user = userEvent.setup();
    const calls = mockApi({
      'POST /api/auth/register': ok({ ...TOKENS, user: CUSTOMER_USER }, 'Account created'),
    });

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await type(user, /full name/i, 'Cassie Customer');
    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await type(user, /confirm password/i, 'supersecret');
    await acceptTerms(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/hello, cassie/i)).toBeInTheDocument();

    // The request went to the endpoint BACKENDPRD §19 specifies, in its shape.
    const register = calls.find((c) => c.path === '/api/auth/register');
    expect(register.body).toMatchObject({
      email: 'customer@delivaroo.test',
      password: 'supersecret',
      full_name: 'Cassie Customer',
    });

    // The session persists, so a reload keeps the user signed in.
    expect(getAccessToken()).toBe(TOKENS.access_token);
    expect(getRefreshToken()).toBe(TOKENS.refresh_token);
  });

  test('client-side validation blocks the request entirely', async () => {
    const user = userEvent.setup();
    const calls = mockApi({});

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await type(user, /full name/i, 'Cassie Customer');
    await type(user, /email address/i, 'not-an-email');
    await type(user, /^password$/i, 'short');
    await type(user, /confirm password/i, 'different');
    await acceptTerms(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  test('a duplicate email is reported using the backend message', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/register': fail(409, 'Email is already registered') });

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await type(user, /full name/i, 'Cassie Customer');
    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await type(user, /confirm password/i, 'supersecret');
    await acceptTerms(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Email is already registered')).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });
});

describe('login', () => {
  test('signs in and stores the session', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/login': ok({ ...TOKENS, user: CUSTOMER_USER }) });

    renderApp({ route: '/login', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText(/hello, cassie/i)).toBeInTheDocument();
    expect(getAccessToken()).toBe(TOKENS.access_token);
  });

  test('bad credentials keep the user on the form with the server message', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/login': fail(401, 'Invalid email or password') });

    renderApp({ route: '/login', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'wrong-password');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  test('after being bounced by a guard, login returns the user to where they were going', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/login': ok({ ...TOKENS, user: ADMIN_USER }) });

    // Start at a protected admin URL while signed out.
    renderApp({ route: '/admin', preloadedState: signedOutState });

    // The guard redirected to the login screen.
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    await type(user, /email address/i, 'admin@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    // ...and afterwards they land on /admin, not on the generic dashboard.
    expect(await screen.findByText('Operations at a glance')).toBeInTheDocument();
  });
});

describe('logout', () => {
  test('clears the session, the tokens and the signed-in navigation', async () => {
    const user = userEvent.setup();
    mockApi({
      'POST /api/auth/login': ok({ ...TOKENS, user: CUSTOMER_USER }),
      'POST /api/auth/logout': ok(null, 'Logged out'),
    });

    renderApp({ route: '/login', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await screen.findByText(/hello, cassie/i);

    await user.click(screen.getByRole('button', { name: /cassie customer/i }));
    await user.click(screen.getByRole('menuitem', { name: /sign out/i }));

    await waitFor(() => expect(getAccessToken()).toBeNull());
    // §12 — signed out, the nav offers one way back in, not a "Sign in" link beside a
    // "Get Started" button pointing at the same screen.
    expect(await screen.findByRole('link', { name: /get started/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument();
  });
});
