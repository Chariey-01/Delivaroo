// The HTTP layer: headers, token handling, the { message, data } envelope, and the
// one-shot refresh. These are the behaviours every screen inherits, so they are
// tested once here rather than re-asserted in each feature suite.

import { ApiError, api } from '../api/client';
import { clearTokens, getAccessToken, setTokens } from '../lib/tokenStorage';

const respond = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
});

beforeEach(() => {
  clearTokens();
  jest.restoreAllMocks();
});

describe('api client', () => {
  test('prefixes /api and sends JSON', async () => {
    global.fetch = jest.fn(async () => respond(200, { message: 'ok', data: { id: 1 } }));

    await api('/parcels', { method: 'POST', body: { weight: 2 } });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/parcels');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ weight: 2 });
  });

  test('unwraps the { message, data } envelope', async () => {
    global.fetch = jest.fn(async () => respond(200, { message: 'ok', data: { id: 7 } }));
    await expect(api('/parcels/7')).resolves.toEqual({ id: 7 });
  });

  test('returns a bare body unchanged when there is no envelope', async () => {
    global.fetch = jest.fn(async () => respond(200, { id: 7 }));
    await expect(api('/parcels/7')).resolves.toEqual({ id: 7 });
  });

  test('attaches the bearer token when one is stored', async () => {
    setTokens({ access: 'abc123' });
    global.fetch = jest.fn(async () => respond(200, { data: null }));

    await api('/auth/me');

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc123');
  });

  test('omits the token when auth is explicitly off', async () => {
    setTokens({ access: 'abc123' });
    global.fetch = jest.fn(async () => respond(200, { data: null }));

    await api('/auth/login', { method: 'POST', body: {}, auth: false });

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('surfaces the backend message on an error', async () => {
    global.fetch = jest.fn(async () => respond(403, { message: 'You are not authorized to update this parcel' }));

    await expect(api('/parcels/1')).rejects.toThrow('You are not authorized to update this parcel');
  });

  test('an error carries its status for callers that branch on it', async () => {
    global.fetch = jest.fn(async () => respond(404, { message: 'Not found' }));

    await expect(api('/parcels/999')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
    expect(new ApiError('x', { status: 1 })).toBeInstanceOf(Error);
  });

  test('a 204 resolves to null rather than failing to parse', async () => {
    global.fetch = jest.fn(async () => respond(204, undefined));
    await expect(api('/parcels/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  test('a non-JSON error body still produces a usable message', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 502,
      text: async () => '<html>Bad Gateway</html>',
    }));

    await expect(api('/parcels')).rejects.toThrow(/Bad Gateway/);
  });

  test('a 401 refreshes once and replays the original request', async () => {
    setTokens({ access: 'stale', refresh: 'refresh-token' });

    global.fetch = jest
      .fn()
      // 1. original request, rejected
      .mockResolvedValueOnce(respond(401, { message: 'Token has expired' }))
      // 2. the refresh
      .mockResolvedValueOnce(respond(200, { data: { access_token: 'fresh' } }))
      // 3. the replay
      .mockResolvedValueOnce(respond(200, { data: { id: 1 } }));

    await expect(api('/auth/me')).resolves.toEqual({ id: 1 });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[1][0]).toBe('/api/auth/refresh');
    // The replay must carry the new token, not the stale one.
    expect(global.fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh');
    expect(getAccessToken()).toBe('fresh');
  });

  test('a 401 with no refresh token clears the session instead of looping', async () => {
    setTokens({ access: 'stale' });
    global.fetch = jest.fn(async () => respond(401, { message: 'Token has expired' }));

    await expect(api('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  test('a failed refresh clears the session and does not retry forever', async () => {
    setTokens({ access: 'stale', refresh: 'dead' });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(respond(401, { message: 'expired' }))
      .mockResolvedValueOnce(respond(401, { message: 'refresh rejected' }));

    await expect(api('/auth/me')).rejects.toMatchObject({ status: 401 });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBeNull();
  });
});
