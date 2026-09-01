import { DENIED, ROLE, hasRole, isAdmin, roleOf } from '../lib/roles';

describe('role model', () => {
  test('no user has no role', () => {
    expect(roleOf(null)).toBeNull();
    expect(isAdmin(null)).toBe(false);
  });

  test('role is read case-insensitively', () => {
    expect(roleOf({ role: 'admin' })).toBe(ROLE.ADMIN);
    expect(roleOf({ role: 'ADMIN' })).toBe(ROLE.ADMIN);
    expect(roleOf({ role: 'user' })).toBe(ROLE.USER);
  });

  test('an is_admin flag is honoured when no role is present', () => {
    expect(roleOf({ is_admin: true })).toBe(ROLE.ADMIN);
    expect(roleOf({ isAdmin: true })).toBe(ROLE.ADMIN);
  });

  test('an unrecognised role falls back to the least privilege', () => {
    expect(roleOf({ role: 'SUPERUSER' })).toBe(ROLE.USER);
    expect(isAdmin({ role: 'SUPERUSER' })).toBe(false);
  });

  test('hasRole with no list means any signed-in user', () => {
    expect(hasRole({ role: 'USER' }, undefined)).toBe(true);
    expect(hasRole({ role: 'USER' }, [])).toBe(true);
    expect(hasRole(null, [])).toBe(false);
  });

  test('hasRole narrows to the listed roles', () => {
    expect(hasRole({ role: 'USER' }, [ROLE.ADMIN])).toBe(false);
    expect(hasRole({ role: 'ADMIN' }, [ROLE.ADMIN])).toBe(true);
  });

  test('refusal wording is shared, not invented per screen', () => {
    expect(DENIED.admin).toMatch(/administrator/i);
  });
});
