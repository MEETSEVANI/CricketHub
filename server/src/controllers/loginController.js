const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { validateLogin } = require('../validators/loginValidator');

async function loginUser(req, res) {
  const { email, password } = req.body;

  const errors = validateLogin(email, password);

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Login validation failed.',
      errors,
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      status: 'error',
      message: 'Unable to process login.',
    });
  }
}

module.exports = {
  loginUser,
};