import {
  collectErrors,
  validateConfirm,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../lib/validators';

describe('form validators', () => {
  test('email must be present and well formed', () => {
    expect(validateEmail('')).toMatch(/required/i);
    expect(validateEmail('not-an-email')).toMatch(/valid/i);
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });

  test('password enforces the minimum length', () => {
    expect(validatePassword('')).toMatch(/required/i);
    expect(validatePassword('short')).toMatch(/8 characters/i);
    expect(validatePassword('longenough1')).toBeNull();
  });

  test('confirmation must match', () => {
    expect(validateConfirm('secret123', 'secret124')).toMatch(/do not match/i);
    expect(validateConfirm('secret123', 'secret123')).toBeNull();
  });

  test('full name is required', () => {
    expect(validateFullName(' ')).toMatch(/required/i);
    expect(validateFullName('A')).toMatch(/full name/i);
    expect(validateFullName('Ada Lovelace')).toBeNull();
  });

  test('phone is optional but validated when given', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('abc')).toMatch(/valid/i);
    expect(validatePhone('+254 700 000 000')).toBeNull();
  });

  test('collectErrors drops the passing fields', () => {
    expect(
      collectErrors({ email: null, password: 'Password is required.' }),
    ).toEqual({ password: 'Password is required.' });
  });
});
