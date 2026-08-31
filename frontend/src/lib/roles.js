// §27 — who may do what inside the admin portal.
//
// Until now "staff" was a single boolean on the session, which is fine when the
// console does one job. A portal that can also re-price accounts, promote colleagues
// and pause the platform needs the finer answer: dispatch runs deliveries, an
// administrator runs Deliveroo. Kept free of React and of the store for the same
// reason orderStatus.js is — the Flask side has to agree with it exactly, and a
// permission that lives only in the UI is not a permission at all.

export const ROLE = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  DISPATCHER: 'DISPATCHER',
  ADMIN: 'ADMIN'
};

export const ROLE_LABEL = {
  [ROLE.USER]: 'Customer',
  [ROLE.CUSTOMER]: 'Customer',
  [ROLE.DISPATCHER]: 'Dispatcher',
  [ROLE.ADMIN]: 'Administrator'
};

export const ROLE_NOTE = {
  [ROLE.USER]: 'Books and tracks their own deliveries. No portal access.',
  [ROLE.CUSTOMER]: 'Books and tracks their own deliveries. No portal access.',
  [ROLE.DISPATCHER]: 'Runs the board: statuses, the scale, capacity and couriers.',
  [ROLE.ADMIN]: 'Everything a dispatcher can do, plus accounts and platform settings.'
};

export const STAFF_ROLES = [ROLE.DISPATCHER, ROLE.ADMIN];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

/**
 * Permissions, not screens. A screen may need several, and two screens may need the
 * same one — the sidebar, the buttons and the backend all ask this module the same
 * question rather than each re-deciding what a dispatcher is.
 */
export const PERMISSION = {
  VIEW_PORTAL: 'VIEW_PORTAL',
  /** Move an order along, drag its vehicle, say where the parcel is. */
  DISPATCH: 'DISPATCH',
  /** Record a measured weight — the fare is re-derived from it. */
  WEIGH_PARCEL: 'WEIGH_PARCEL',
  /** Take a transport mode offline, which withdraws it from customer quotes. */
  SET_CAPACITY: 'SET_CAPACITY',
  /** Put a courier on or off shift. */
  MANAGE_COURIERS: 'MANAGE_COURIERS',
  VIEW_ACCOUNTS: 'VIEW_ACCOUNTS',
  /** Promote, demote or suspend an account. */
  MANAGE_ACCOUNTS: 'MANAGE_ACCOUNTS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_AUDIT: 'VIEW_AUDIT',
  VIEW_NOTIFICATIONS: 'VIEW_NOTIFICATIONS',
  /** Pause bookings, post a notice, clear the demo data. */
  MANAGE_SETTINGS: 'MANAGE_SETTINGS'
};

const DISPATCHER_GRANTS = [
  PERMISSION.VIEW_PORTAL,
  PERMISSION.DISPATCH,
  PERMISSION.WEIGH_PARCEL,
  PERMISSION.SET_CAPACITY,
  PERMISSION.MANAGE_COURIERS,
  PERMISSION.VIEW_ACCOUNTS,
  PERMISSION.VIEW_REPORTS,
  PERMISSION.VIEW_AUDIT,
  PERMISSION.VIEW_NOTIFICATIONS
];

const GRANTS = {
  [ROLE.USER]: [],
  [ROLE.CUSTOMER]: [],
  [ROLE.DISPATCHER]: DISPATCHER_GRANTS,
  [ROLE.ADMIN]: Object.values(PERMISSION)
};

/**
 * A session's role. Sessions written before §27 carry only `isAdmin`, so they are
 * read as administrators rather than being locked out of the portal they were
 * already using.
 */
export const roleOf = (user) => {
  if (!user) return null;
  const role = String(user.role || '').toUpperCase();
  if (Object.hasOwn(ROLE, role)) return ROLE[role];
  return user.is_admin || user.isAdmin ? ROLE.ADMIN : ROLE.USER;
};

export const can = (user, permission) => (GRANTS[roleOf(user)] || []).includes(permission);

export const isStaff = (user) => isStaffRole(roleOf(user));

export const isAdmin = (user) => roleOf(user) === ROLE.ADMIN;

export const hasRole = (user, allowed) => {
  if (!user) return false;
  if (!allowed || allowed.length === 0) return true;
  const role = roleOf(user);
  return allowed.map((entry) => String(entry).toUpperCase()).includes(role);
};

/** The message a refused action gives back — one wording, backend and UI. */
export const DENIED = {
  unauthenticated: 'Please sign in to continue.',
  staff: 'Only staff can do that.',
  admin: 'Only an administrator can do that.'
};
