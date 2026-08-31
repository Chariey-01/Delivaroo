// §27 — who may do what inside the admin portal.

export const ROLE = {
  USER: 'USER',
  CUSTOMER: 'USER',
  DISPATCHER: 'DISPATCHER',
  ADMIN: 'ADMIN'
};

export const ROLE_LABEL = {
  [ROLE.USER]: 'User',
  [ROLE.DISPATCHER]: 'Dispatcher',
  [ROLE.ADMIN]: 'Administrator'
};

export const ROLE_NOTE = {
  [ROLE.USER]: 'Books and tracks their own deliveries. No portal access.',
  [ROLE.DISPATCHER]:
    'Runs the board: statuses, the scale, capacity and couriers.',
  [ROLE.ADMIN]:
    'Everything a dispatcher can do, plus accounts and platform settings.'
};

export const STAFF_ROLES = [ROLE.DISPATCHER, ROLE.ADMIN];

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

/**
 * Permissions used throughout the admin portal.
 */
export const PERMISSION = {
  VIEW_PORTAL: 'VIEW_PORTAL',
  DISPATCH: 'DISPATCH',
  WEIGH_PARCEL: 'WEIGH_PARCEL',
  SET_CAPACITY: 'SET_CAPACITY',
  MANAGE_COURIERS: 'MANAGE_COURIERS',
  VIEW_ACCOUNTS: 'VIEW_ACCOUNTS',
  MANAGE_ACCOUNTS: 'MANAGE_ACCOUNTS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  VIEW_AUDIT: 'VIEW_AUDIT',
  VIEW_NOTIFICATIONS: 'VIEW_NOTIFICATIONS',
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
  [ROLE.DISPATCHER]: DISPATCHER_GRANTS,
  [ROLE.ADMIN]: Object.values(PERMISSION)
};

/**
 * Return the user's normalized role.
 *
 * Old sessions may use `isAdmin` or `is_admin`, so both are supported.
 * Unknown roles fall back to USER for least privilege.
 */
export const roleOf = (user) => {
  if (!user) return null;

  if (user.is_admin === true || user.isAdmin === true) {
    return ROLE.ADMIN;
  }

  if (typeof user.role !== 'string') {
    return ROLE.USER;
  }

  const normalizedRole = user.role.toUpperCase();

  if (Object.values(ROLE).includes(normalizedRole)) {
    return normalizedRole;
  }

  return ROLE.USER;
};

/**
 * Check whether the user is an administrator.
 */
export const isAdmin = (user) => roleOf(user) === ROLE.ADMIN;

/**
 * Check whether a user has one of the supplied roles.
 *
 * No role list (or an empty list) means any signed-in user.
 */
export const hasRole = (user, roles) => {
  const role = roleOf(user);

  if (!role) return false;

  if (!roles || roles.length === 0) {
    return true;
  }

  return roles.includes(role);
};

export const can = (user, permission) =>
  (GRANTS[roleOf(user)] || []).includes(permission);

export const isStaff = (user) => isStaffRole(roleOf(user));

export const DENIED = {
  staff: 'Only staff can do that.',
  admin: 'Only an administrator can do that.'
};
