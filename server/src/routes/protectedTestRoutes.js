const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'You accessed a protected route.',
    user: req.user,
  });
});

module.exports = router;
