// Who may do what.
//
// BACKENDPRD §2 defines two roles, so this stays at two — a permission the UI invents
// and the backend does not enforce is not a permission at all. Kept free of React and
// of the store so the guards, the navigation and the tests all ask the same question.

export const ROLE = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

export const ROLE_LABEL = {
  [ROLE.USER]: 'Customer',
  [ROLE.ADMIN]: 'Administrator',
};

/**
 * A session's role, normalised. The backend may answer 'admin', 'ADMIN' or a legacy
 * `is_admin` boolean; all three have to read the same here.
 */
export const roleOf = (user) => {
  if (!user) return null;
  const raw = (user.role ?? '').toString().toUpperCase();
  if (raw === ROLE.ADMIN) return ROLE.ADMIN;
  if (raw === ROLE.USER) return ROLE.USER;
  return user.is_admin || user.isAdmin ? ROLE.ADMIN : ROLE.USER;
};

export const isAdmin = (user) => roleOf(user) === ROLE.ADMIN;

/** True when `user` holds any of `allowed`. An empty list means "any signed-in user". */
export const hasRole = (user, allowed) => {
  if (!user) return false;
  if (!allowed || allowed.length === 0) return true;
  const role = roleOf(user);
  return allowed.map((r) => r.toUpperCase()).includes(role);
};

/** One wording for a refusal, shared by the guards and the toasts. */
export const DENIED = {
  unauthenticated: 'Please sign in to continue.',
  admin: 'Only an administrator can do that.',
};
