// What makes a password acceptable here, and what merely makes it better.
//
// The backend is the authority: backend/app/resources/auth.py::validate_new_password
// rejects anything under PASSWORD_MIN_LENGTH characters and nothing else. So exactly
// one rule below is marked `required` — the rest are advice, and the UI labels them
// as advice. A checklist that implies a rule the server does not enforce teaches the
// user something false, and they find out at the worst possible moment.

export const PASSWORD_MIN_LENGTH = 8;

/** A password long enough to be comfortably above the floor rather than at it. */
const COMFORTABLE_LENGTH = 12;

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: `Minimum ${PASSWORD_MIN_LENGTH} characters`,
    required: true,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'lower', label: 'A lowercase letter', required: false, test: (value) => /[a-z]/.test(value) },
  { id: 'upper', label: 'An uppercase letter', required: false, test: (value) => /[A-Z]/.test(value) },
  { id: 'number', label: 'A number', required: false, test: (value) => /\d/.test(value) },
  { id: 'symbol', label: 'A symbol, like ! ? @ #', required: false, test: (value) => /[^A-Za-z0-9]/.test(value) },
];

// Four filled segments, so the meter and the score share one scale.
export const STRENGTH_STEPS = 4;

const LEVELS = [
  { label: 'Too short', tone: 'danger' },
  { label: 'Weak', tone: 'danger' },
  { label: 'Fair', tone: 'warn' },
  { label: 'Good', tone: 'ok' },
  { label: 'Strong', tone: 'ok' },
];

/**
 * Grade a password: which rules it satisfies, whether it may be submitted at all,
 * and a 0–4 score for the meter.
 *
 * Below the length floor the score is pinned to 0 however varied the characters are —
 * a six-character password with a symbol in it is not "fair", it is rejected.
 */
export function checkPassword(value = '') {
  const password = value ?? '';
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    required: rule.required,
    met: Boolean(password) && rule.test(password),
  }));

  const meetsMinimum = rules[0].met;
  const variety = rules.slice(1).filter((rule) => rule.met).length;
  const score = meetsMinimum
    ? Math.min(STRENGTH_STEPS, Math.max(1, variety + (password.length >= COMFORTABLE_LENGTH ? 1 : 0)))
    : 0;

  return { rules, score, meetsMinimum, ...LEVELS[score] };
}
