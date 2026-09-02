// The behaviour the redesigned authentication screens added on top of the flows
// covered in integration/auth.test.jsx: what the password meter claims, what
// "Remember me" actually does to the stored session, and the two gates a user can
// walk into on the way to an account.

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CUSTOMER_USER, TOKENS, mockApi, ok, renderApp, signedOutState } from './testUtils';
import { checkPassword, PASSWORD_MIN_LENGTH, PASSWORD_RULES } from '../lib/passwordStrength';
import { clearTokens, getAccessToken } from '../lib/tokenStorage';

const type = async (user, label, value) => user.type(await screen.findByLabelText(label), value);

const fillSignup = async (user) => {
  await type(user, /full name/i, 'Cassie Customer');
  await type(user, /email address/i, 'customer@delivaroo.test');
  await type(user, /^password$/i, 'supersecret');
  await type(user, /confirm password/i, 'supersecret');
};

beforeEach(() => {
  clearTokens();
  localStorage.clear();
  sessionStorage.clear();
});

describe('password rules', () => {
  test('only the length rule is presented as required, because only it is enforced', () => {
    const required = PASSWORD_RULES.filter((rule) => rule.required);
    expect(required).toHaveLength(1);
    expect(required[0].id).toBe('length');
    // The floor matches backend/app/resources/auth.py::PASSWORD_MIN_LENGTH.
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  test('anything under the floor scores zero however varied it is', () => {
    expect(checkPassword('Aa1!').score).toBe(0);
    expect(checkPassword('Aa1!').meetsMinimum).toBe(false);
  });

  test('the score climbs with variety and length', () => {
    expect(checkPassword('password').score).toBe(1);
    expect(checkPassword('password1').score).toBe(2);
    expect(checkPassword('Password1').score).toBe(3);
    expect(checkPassword('Password1!').score).toBe(4);
  });
});

describe('sign in', () => {
  test('an empty submit reports both fields and sends nothing', async () => {
    const user = userEvent.setup();
    const calls = mockApi({});

    renderApp({ route: '/login', preloadedState: signedOutState });

    await user.click(await screen.findByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  test('clearing "Remember me" keeps the session to the tab it was opened in', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/login': ok({ ...TOKENS, user: CUSTOMER_USER }) });

    renderApp({ route: '/login', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => expect(getAccessToken()).toBe(TOKENS.access_token));
    expect(sessionStorage.getItem('delivaroo.accessToken')).toBe(TOKENS.access_token);
    expect(localStorage.getItem('delivaroo.accessToken')).toBeNull();
    // An email is only remembered when the user asked for it to be.
    expect(localStorage.getItem('delivaroo.rememberedEmail')).toBeNull();
  });

  test('a dead connection reads as a connection problem, not a refused password', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    renderApp({ route: '/login', preloadedState: signedOutState });

    await type(user, /email address/i, 'customer@delivaroo.test');
    await type(user, /^password$/i, 'supersecret');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach the server/i);
  });
});

describe('create account', () => {
  test('registration is blocked until the terms are accepted', async () => {
    const user = userEvent.setup();
    const calls = mockApi({});

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await fillSignup(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/accept the terms/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  test('the password requirement shown is the one the server enforces', async () => {
    const user = userEvent.setup();
    mockApi({});

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await type(user, /^password$/i, 'sup');
    expect(await screen.findByText(`Minimum ${PASSWORD_MIN_LENGTH} characters`)).toBeInTheDocument();
    expect(screen.getByText(/only the first is required/i)).toBeInTheDocument();
  });

  test('switching to sign in and back keeps the visitor on the same frame', async () => {
    const user = userEvent.setup();
    mockApi({});

    renderApp({ route: '/signup', preloadedState: signedOutState });

    await user.click(await screen.findByRole('link', { name: /sign in/i }));
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /create an account/i }));
    expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });
});

describe('forgot password', () => {
  test('the confirmation does not reveal whether the address has an account', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /api/auth/forgot-password': ok(null, 'If the email exists, a password reset link will be sent') });

    renderApp({ route: '/forgot-password', preloadedState: signedOutState });

    await type(user, /email address/i, 'stranger@delivaroo.test');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    const confirmation = await screen.findByRole('status');
    expect(confirmation).toHaveTextContent(/if the email exists/i);
    expect(confirmation).not.toHaveTextContent(/we found your account/i);
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  test('an invalid address never reaches the network', async () => {
    const user = userEvent.setup();
    const calls = mockApi({});

    renderApp({ route: '/forgot-password', preloadedState: signedOutState });

    await type(user, /email address/i, 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});

describe('reset password', () => {
  test('a link with no token disables the form and offers a new one', async () => {
    mockApi({});
    renderApp({ route: '/reset-password', preloadedState: signedOutState });

    expect(await screen.findByLabelText(/^new password$/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^reset password$/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /request a new one/i })).toBeInTheDocument();
  });

  test('mismatched passwords are caught before the request', async () => {
    const user = userEvent.setup();
    const calls = mockApi({});

    renderApp({ route: '/reset-password?token=a-real-token', preloadedState: signedOutState });

    await type(user, /^new password$/i, 'supersecret');
    await type(user, /confirm new password/i, 'supersecrez');
    await user.click(screen.getByRole('button', { name: /^reset password$/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});
