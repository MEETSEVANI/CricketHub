const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    status: 'success',
    message: 'Administrator access granted.',
    user: req.user,
  });
});

module.exports = router;