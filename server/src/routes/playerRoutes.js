const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const {
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listPlayers);
router.get('/:id', getPlayer);
router.post('/', requireAdmin, createPlayer);
router.put('/:id', requireAdmin, updatePlayer);
router.delete('/:id', requireAdmin, deletePlayer);

module.exports = router;
