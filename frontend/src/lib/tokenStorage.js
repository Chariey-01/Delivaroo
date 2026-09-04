// Where the JWT pair lives between page loads (§19 of BACKENDPRD).
//
// localStorage rather than memory, because a customer who reloads mid-booking should
// still be signed in. It is deliberately the only module that names the storage keys:
// the API client, the auth slice and the tests all go through here, so moving to
// httpOnly cookies later is a change to this file alone.

const ACCESS_KEY = 'delivaroo.accessToken';
const REFRESH_KEY = 'delivaroo.refreshToken';

/** Private browsing and disabled site data both make localStorage throw on access. */
function safe(run, fallback = null) {
  try {
    return run();
  } catch {
    return fallback;
  }
}

export const getAccessToken = () => safe(() => localStorage.getItem(ACCESS_KEY));
export const getRefreshToken = () => safe(() => localStorage.getItem(REFRESH_KEY));

export function setTokens({ access, refresh } = {}) {
  safe(() => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  });
}

export function clearTokens() {
  safe(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  });
}

export const hasSession = () => Boolean(getAccessToken());
