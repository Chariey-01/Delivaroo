// Client-side validation. The backend validates everything again (§23) — this exists
// so the user hears about a typo before a round trip, not so the server can trust it.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value) => {
  const email = (value || '').trim();
  if (!email) return 'Email is required.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
};

export const validatePassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  return null;
};

export const validateFullName = (value) => {
  const name = (value || '').trim();
  if (!name) return 'Full name is required.';
  if (name.length < 2) return 'Enter your full name.';
  return null;
};

export const validateConfirm = (password, confirm) =>
  password !== confirm ? 'Passwords do not match.' : null;

/** Optional, but must look like a phone number when given. */
export const validatePhone = (value) => {
  const phone = (value || '').trim();
  if (!phone) return null;
  if (!/^\+?[\d\s-]{7,15}$/.test(phone)) return 'Enter a valid phone number.';
  return null;
};

/** Drops the null entries so a caller can test truthiness of the whole object. */
export const collectErrors = (candidates) =>
  Object.fromEntries(Object.entries(candidates).filter(([, message]) => message));
