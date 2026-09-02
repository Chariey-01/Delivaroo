// Authentication endpoints, exactly as BACKENDPRD §19 specifies them:
//
//   POST /auth/register   POST /auth/login   POST /auth/refresh
//   POST /auth/logout     GET  /auth/me
//
// The backend is not written yet, so the one thing this module does beyond calling
// those paths is normalise the response. Flask/SQLAlchemy serialises snake_case and
// the React side reads camelCase; doing the translation here means exactly one file
// changes if the backend settles on a different shape.

import { del, get, post } from './client';
import { clearTokens, getRefreshToken, setTokens } from '../lib/tokenStorage';

/** Backend user record → the shape the store and components read. */
export function normalizeUser(raw) {
  if (!raw) return null;
  const profile = raw.profile ?? {};
  const role = (raw.role ?? 'USER').toUpperCase();
  const fullName = profile.full_name ?? profile.fullName ?? raw.full_name ?? raw.fullName ?? '';
  return {
    id: raw.id,
    email: raw.email,
    role,
    isActive: raw.is_active ?? raw.isActive ?? true,
    fullName,
    phone: profile.phone ?? raw.phone ?? '',
    profileImage: profile.profile_image ?? profile.profileImage ?? null,
  };
}

/**
 * A login/register response carries the token pair and the user together. Tokens are
 * persisted here rather than in the slice so that a caller who bypasses Redux — a
 * test, or a future route loader — still ends up authenticated.
 */
function acceptSession(payload, remember) {
  const access = payload?.access_token ?? payload?.accessToken;
  const refresh = payload?.refresh_token ?? payload?.refreshToken;
  // `remember` decides which store the pair lands in; see lib/tokenStorage.
  if (access) setTokens({ access, refresh, remember });
  return normalizeUser(payload?.user ?? payload);
}

export async function register({ email, password, fullName, phone, remember = true }) {
  const data = await post(
    '/auth/register',
    {
      email: email?.trim().toLowerCase(),
      password,
      full_name: fullName,
      phone: phone || undefined,
    },
    { auth: false },
  );
  return acceptSession(data, remember);
}

export async function login({ email, password, remember = true }) {
  const data = await post(
    '/auth/login',
    { email: email?.trim().toLowerCase(), password },
    { auth: false },
  );
  return acceptSession(data, remember);
}

/** Request a reset email. The server deliberately gives the same response for every email. */
export function requestPasswordReset({ email }) {
  return post(
    '/auth/forgot-password',
    { email: email?.trim().toLowerCase() },
    { auth: false },
  );
}

/** Replace a password using the opaque token delivered in a reset email. */
export function resetPassword({ token, newPassword }) {
  return post(
    '/auth/reset-password',
    { token, new_password: newPassword },
    { auth: false },
  );
}

/** Change the current signed-in user's password. */
export function changePassword({ currentPassword, newPassword }) {
  return post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

/** The current user, used to restore a session from a stored token on page load. */
export async function me() {
  const data = await get('/auth/me');
  return normalizeUser(data?.user ?? data);
}

/**
 * Ask the backend to revoke the refresh token, then drop the local pair. The local
 * clear happens either way: a logout that fails on the network must still log you out
 * of this browser.
 */
export async function logout() {
  try {
    await post('/auth/logout', { refresh_token: getRefreshToken() });
  } catch {
    /* already expired or unreachable — signing out locally is still correct */
  } finally {
    clearTokens();
  }
  return null;
}

export { del };
