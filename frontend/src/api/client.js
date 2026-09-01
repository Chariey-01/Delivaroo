// Thin wrapper over fetch for the Flask backend.
//
// Read the base URL via viteEnv so this module stays parseable under Jest. In
// development leave VITE_API_URL empty and let the Vite proxy forward /api to
// http://localhost:5000, which is also why every path here is relative.

import { API_BASE_URL as BASE } from './viteEnv';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../lib/tokenStorage';

/**
 * A failed request, carrying the pieces callers actually branch on. The backend
 * answers errors as `{ "message": "..." }` (§23), so that message is surfaced
 * verbatim — it is written for the user and is better than anything invented here.
 */
export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** 204 has no body, and an HTML error page must not blow up JSON parsing. */
async function readBody(response) {
  if (response.status === 204) return null;
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function messageFor(response, body) {
  if (body?.message) return body.message;
  if (response.status === 401) return 'Your session has expired. Please sign in again.';
  if (response.status === 403) return 'You are not authorized to do that.';
  if (response.status === 404) return 'Not found.';
  if (response.status >= 500) return 'The server is having trouble. Please try again.';
  return `Request failed (${response.status}).`;
}

async function send(path, { method = 'GET', body, headers, auth = true, signal } = {}) {
  const token = auth ? getAccessToken() : null;
  return fetch(`${BASE}/api${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * A single in-flight refresh, shared by every request that races into a 401 at the
 * same time. Without this, five parallel requests would fire five refreshes and four
 * of them would be rejected once the backend rotates the token.
 */
let refreshing = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  refreshing ??= (async () => {
    try {
      const response = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refresh}` },
      });
      if (!response.ok) return false;
      const body = await readBody(response);
      const next = body?.data ?? body ?? {};
      const access = next.access_token ?? next.accessToken;
      if (!access) return false;
      setTokens({ access, refresh: next.refresh_token ?? next.refreshToken });
      return true;
    } catch {
      return false;
    } finally {
      // Cleared on the next tick so callers awaiting this promise all read the result.
      queueMicrotask(() => {
        refreshing = null;
      });
    }
  })();

  return refreshing;
}

/**
 * Perform a request. On a 401 with a refresh token on hand the access token is
 * renewed once and the original request replayed; a second 401 signs the user out
 * rather than looping.
 */
export async function api(path, options = {}) {
  let response = await send(path, options);

  if (response.status === 401 && options.auth !== false && !options.retried) {
    if (await refreshAccessToken()) {
      response = await send(path, options);
    } else {
      clearTokens();
    }
  }

  const body = await readBody(response);
  if (!response.ok) {
    if (response.status === 401) clearTokens();
    throw new ApiError(messageFor(response, body), { status: response.status, data: body });
  }

  // §23 wraps successful payloads as { message, data }. Callers want the data.
  return body && Object.hasOwn(body, 'data') ? body.data : body;
}

export const get = (path, options) => api(path, { ...options, method: 'GET' });
export const post = (path, body, options) => api(path, { ...options, method: 'POST', body });
export const patch = (path, body, options) => api(path, { ...options, method: 'PATCH', body });
export const del = (path, options) => api(path, { ...options, method: 'DELETE' });
