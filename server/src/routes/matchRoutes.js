const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  saveMatchLineups,
  saveMatchPerformances,
} = require('../controllers/matchController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listMatches);
router.get('/:id', getMatch);
router.post('/', requireAdmin, createMatch);
router.put('/:id/lineups', requireAdmin, saveMatchLineups);
router.put('/:id/performances', requireAdmin, saveMatchPerformances);
router.put('/:id', requireAdmin, updateMatch);
router.delete('/:id', requireAdmin, deleteMatch);

module.exports = router;
