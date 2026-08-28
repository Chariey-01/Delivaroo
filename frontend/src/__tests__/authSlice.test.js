// W2-10 — authentication state management.

import reducer, {
  clearAuthError,
  loadSession,
  login,
  logout,
  selectAuthResolving,
  selectIsAdmin,
  selectIsSignedIn,
  sessionExpired,
  signup,
} from '../store/authSlice';
import { clearTokens, getAccessToken, setTokens } from '../lib/tokenStorage';

const initial = reducer(undefined, { type: '@@INIT' });
const user = { id: 1, email: 'a@b.c', role: 'USER', fullName: 'A B' };

beforeEach(() => clearTokens());

describe('auth reducer', () => {
  test('starts signed out and unresolved', () => {
    expect(initial.user).toBeNull();
    expect(initial.status).toBe('idle');
    expect(selectAuthResolving({ auth: initial })).toBe(true);
  });

  test('a pending login sets submitting without clearing the session', () => {
    const state = reducer({ ...initial, user, status: 'ready' }, login.pending('', {}));
    expect(state.submitting).toBe(true);
    expect(state.user).toEqual(user);
  });

  test('a fulfilled login stores the user and resolves the session', () => {
    const state = reducer(initial, login.fulfilled(user, '', {}));
    expect(state.user).toEqual(user);
    expect(state.status).toBe('ready');
    expect(state.submitting).toBe(false);
    expect(selectIsSignedIn({ auth: state })).toBe(true);
  });

  test('a rejected login surfaces the message and leaves the user signed out', () => {
    const pending = reducer(initial, login.pending('', {}));
    const state = reducer(pending, {
      type: login.rejected.type,
      payload: 'Invalid email or password.',
    });
    expect(state.error).toBe('Invalid email or password.');
    expect(state.user).toBeNull();
    expect(state.submitting).toBe(false);
  });

  test('signup resolves through the same path as login', () => {
    const state = reducer(initial, signup.fulfilled(user, '', {}));
    expect(state.user).toEqual(user);
    expect(state.status).toBe('ready');
  });

  test('a rejected session restore signs out quietly, without an error', () => {
    setTokens({ access: 'stale' });
    const state = reducer({ ...initial, status: 'loading' }, { type: loadSession.rejected.type });
    expect(state.user).toBeNull();
    expect(state.status).toBe('ready');
    expect(state.error).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  test('loadSession resolving to null still marks the question answered', () => {
    const state = reducer(initial, loadSession.fulfilled(null, '', undefined));
    expect(state.status).toBe('ready');
    expect(selectAuthResolving({ auth: state })).toBe(false);
  });

  test('logout clears the user', () => {
    const signedIn = reducer(initial, login.fulfilled(user, '', {}));
    const state = reducer(signedIn, logout.fulfilled(null, '', undefined));
    expect(state.user).toBeNull();
  });

  test('sessionExpired clears both the store and the stored tokens', () => {
    setTokens({ access: 'abc', refresh: 'def' });
    const signedIn = reducer(initial, login.fulfilled(user, '', {}));
    const state = reducer(signedIn, sessionExpired());
    expect(state.user).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  test('clearAuthError only clears the error', () => {
    const withError = { ...initial, user, error: 'boom' };
    expect(reducer(withError, clearAuthError())).toMatchObject({ user, error: null });
  });

  test('selectIsAdmin reads the role, not a separate flag', () => {
    expect(selectIsAdmin({ auth: { user: { role: 'ADMIN' } } })).toBe(true);
    expect(selectIsAdmin({ auth: { user: { role: 'USER' } } })).toBe(false);
    expect(selectIsAdmin({ auth: { user: null } })).toBe(false);
  });
});
