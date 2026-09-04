// Two small conveniences that belong beside the sign-in form and nowhere else.
//
// Neither ever touches a password. The remembered value is an email address the user
// asked us to keep, and it is dropped the moment they clear the box.

const EMAIL_KEY = 'delivaroo.rememberedEmail';

function safe(run, fallback = null) {
  try {
    return run();
  } catch {
    return fallback;
  }
}

export const getRememberedEmail = () => safe(() => localStorage.getItem(EMAIL_KEY)) ?? '';

export function setRememberedEmail(email) {
  safe(() => {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  });
}

// A dead connection and a refused password are different problems with different
// fixes, so they must not read the same. Everything else the server says is passed
// through untouched — it is written for a person and is better than a paraphrase.
const NETWORK = /failed to fetch|networkerror|network request failed|load failed/i;

export const friendlyAuthError = (message) =>
  message && NETWORK.test(message)
    ? "We couldn't reach the server. Check your connection and try again."
    : message;
