const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { listMatches, getMatch } = require('../controllers/matchController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listMatches);
router.get('/:id', getMatch);

module.exports = router;
