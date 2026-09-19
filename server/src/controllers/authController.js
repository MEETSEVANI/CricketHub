const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { validateRegistration } = require('../validators/authValidator');

async function registerUser(req, res) {
  const { email, password } = req.body;

  const errors = validateRegistration(email, password);

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Registration validation failed.',
      errors,
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, role, created_at`,
      [normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Unable to create account.',
    });
  }
}

module.exports = {
  registerUser,
}; 