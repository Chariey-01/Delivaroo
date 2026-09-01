import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasSession,
  setTokens,
} from '../lib/tokenStorage';

beforeEach(() => clearTokens());

describe('token storage', () => {
  test('round-trips the pair', () => {
    setTokens({ access: 'a', refresh: 'r' });
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');
    expect(hasSession()).toBe(true);
  });

  test('setting only an access token leaves the refresh token alone', () => {
    setTokens({ access: 'a', refresh: 'r' });
    setTokens({ access: 'a2' });
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r');
  });

  test('clearing removes both', () => {
    setTokens({ access: 'a', refresh: 'r' });
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(hasSession()).toBe(false);
  });

  test('a storage that throws is treated as no session, not a crash', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(getAccessToken()).toBeNull();
    expect(hasSession()).toBe(false);
    spy.mockRestore();
  });
});
