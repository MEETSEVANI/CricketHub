const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  listFavourites,
  addFavourite,
  removeFavourite,
} = require('../controllers/favouriteController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listFavourites);
router.post('/', addFavourite);
router.delete('/:type/:id', removeFavourite);

module.exports = router;
