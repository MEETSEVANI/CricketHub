const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { listMatches, getMatch, createMatch, updateMatch, deleteMatch } = require('../controllers/matchController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listMatches);
router.get('/:id', getMatch);
router.post('/', requireAdmin, createMatch);
router.put('/:id', requireAdmin, updateMatch);
router.delete('/:id', requireAdmin, deleteMatch);

module.exports = router;
