// Where the JWT pair lives between page loads (§19 of BACKENDPRD).
//
// Two stores, one behaviour: "Remember me" writes the pair to localStorage so a
// reload — or tomorrow morning — still finds a session; without it the pair goes to
// sessionStorage and dies with the tab, which is what someone on a shared machine
// is asking for when they clear that box. This is deliberately the only module that
// names the storage keys: the API client, the auth slice and the tests all go
// through here, so moving to httpOnly cookies later is a change to this file alone.

const ACCESS_KEY = 'delivaroo.accessToken';
const REFRESH_KEY = 'delivaroo.refreshToken';

/** Private browsing and disabled site data both make storage throw on access. */
function safe(run, fallback = null) {
  try {
    return run();
  } catch {
    return fallback;
  }
}

const readFrom = (store, key) => safe(() => store.getItem(key));

/**
 * Which store a token renewal should write to. A session started without "remember
 * me" must stay in sessionStorage when its access token is refreshed, or the box the
 * user cleared would quietly re-tick itself an hour later.
 */
function currentStore() {
  return readFrom(sessionStorage, ACCESS_KEY) ? sessionStorage : localStorage;
}

const read = (key) => readFrom(sessionStorage, key) ?? readFrom(localStorage, key);

export const getAccessToken = () => read(ACCESS_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

/**
 * Persist the pair. `remember` picks the store; omitting it keeps whichever store the
 * live session is already using, which is what a token refresh wants.
 */
export function setTokens({ access, refresh, remember } = {}) {
  safe(() => {
    const store = remember === undefined ? currentStore() : remember ? localStorage : sessionStorage;
    const other = store === localStorage ? sessionStorage : localStorage;
    if (access) {
      store.setItem(ACCESS_KEY, access);
      safe(() => other.removeItem(ACCESS_KEY));
    }
    if (refresh) {
      store.setItem(REFRESH_KEY, refresh);
      safe(() => other.removeItem(REFRESH_KEY));
    }
  });
}

export function clearTokens() {
  for (const store of [localStorage, sessionStorage]) {
    safe(() => {
      store.removeItem(ACCESS_KEY);
      store.removeItem(REFRESH_KEY);
    });
  }
}

export const hasSession = () => Boolean(getAccessToken());
