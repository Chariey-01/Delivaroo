// Read via viteEnv so this module stays parseable under Jest, which compiles ESM to
// CJS and cannot handle a bare import.meta. Same value, one level of indirection.
import { API_BASE_URL as BASE } from './viteEnv';

/**
 * Thin wrapper over fetch for the Flask backend. In dev leave VITE_API_URL
 * empty and let the Vite proxy forward /api to http://localhost:5000.
 */
export async function api(path, { method = 'GET', body, headers, ...rest } = {}) {
  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...rest,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${method} /api${path} failed: ${response.status} ${detail}`);
  }

  return response.status === 204 ? null : response.json();
}

/**
 * HTTP method helpers used by auth.js and parcels.js.
 */
export const get = (path, options = {}) =>
  api(path, { ...options, method: 'GET' });

export const post = (path, body, options = {}) =>
  api(path, { ...options, method: 'POST', body });

export const patch = (path, body, options = {}) =>
  api(path, { ...options, method: 'PATCH', body });

export const del = (path, options = {}) =>
  api(path, { ...options, method: 'DELETE' });

// Existing endpoints.
export const getShipment = (trackingId) =>
  api(`/shipments/${trackingId}`);

export const createQuote = (payload) =>
  api('/quotes', { method: 'POST', body: payload });