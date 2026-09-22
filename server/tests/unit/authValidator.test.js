const { validateRegistration } = require('../../src/validators/authValidator');

describe('validateRegistration', () => {
  test('accepts a valid email and password', () => {
    const errors = validateRegistration(
      'user@example.com',
      'ValidPass@123'
    );

    expect(errors).toEqual([]);
  });

  test('rejects a missing email', () => {
    const errors = validateRegistration(
      '',
      'ValidPass@123'
    );

    expect(errors).toContain('Email is required.');
  });

  test('rejects an invalid email', () => {
    const errors = validateRegistration(
      'invalid-email',
      'ValidPass@123'
    );

    expect(errors).toContain('Please enter a valid email address.');
  });

  test('rejects a password shorter than 8 characters', () => {
    const errors = validateRegistration(
      'user@example.com',
      'Aa1@abc'
    );

    expect(errors).toContain(
      'Password must be at least 8 characters long.'
    );
  });

  test('rejects a password without an uppercase letter', () => {
    const errors = validateRegistration(
      'user@example.com',
      'validpass@123'
    );

    expect(errors).toContain(
      'Password must contain at least one uppercase letter.'
    );
  });

  test('rejects a password without a lowercase letter', () => {
    const errors = validateRegistration(
      'user@example.com',
      'VALIDPASS@123'
    );

    expect(errors).toContain(
      'Password must contain at least one lowercase letter.'
    );
  });

  test('rejects a password without a number', () => {
    const errors = validateRegistration(
      'user@example.com',
      'ValidPass@abc'
    );

    expect(errors).toContain(
      'Password must contain at least one number.'
    );
  });

  test('rejects a password without a special character', () => {
    const errors = validateRegistration(
      'user@example.com',
      'ValidPass123'
    );

    expect(errors).toContain(
      'Password must contain at least one special character.'
    );
  });
});