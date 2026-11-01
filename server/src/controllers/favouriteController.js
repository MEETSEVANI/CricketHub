const pool = require('../config/database');

function parseItemId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listFavourites(req, res) {
  try {
    const result = await pool.query(
      `SELECT f.id, f.created_at,
              CASE WHEN f.player_id IS NOT NULL THEN 'player' ELSE 'match' END AS type,
              p.id AS player_id, p.name AS player_name, p.country, p.role,
              m.id AS match_id, m.match_name, m.team_a, m.team_b,
              m.match_datetime, m.status AS match_status, m.result
       FROM favourites f
       LEFT JOIN players p ON p.id=f.player_id
       LEFT JOIN matches m ON m.id=f.match_id
       WHERE f.user_id=$1
       ORDER BY f.created_at DESC`,
      [req.user.userId]
    );
    return res.json({ status: 'success', favourites: result.rows });
  } catch (error) {
    console.error('Favourite list error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to load favourites.' });
  }
}

async function addFavourite(req, res) {
  const { type } = req.body;
  const id = parseItemId(req.body.id);
  if (!['player', 'match'].includes(type) || !id) {
    return res.status(400).json({ status: 'error', message: 'Choose a valid player or match to favourite.' });
  }

  try {
    const result = type === 'player'
      ? await pool.query('INSERT INTO favourites (user_id, player_id) VALUES ($1,$2) RETURNING id', [req.user.userId, id])
      : await pool.query('INSERT INTO favourites (user_id, match_id) VALUES ($1,$2) RETURNING id', [req.user.userId, id]);
    return res.status(201).json({ status: 'success', message: 'Added to favourites.', favouriteId: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'That item is already in your favourites.' });
    if (error.code === '23503') return res.status(404).json({ status: 'error', message: 'The selected item was not found.' });
    console.error('Favourite add error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to add favourite.' });
  }
}

async function removeFavourite(req, res) {
  const id = parseItemId(req.params.id);
  const { type } = req.params;
  if (!['player', 'match'].includes(type) || !id) {
    return res.status(400).json({ status: 'error', message: 'Choose a valid player or match.' });
  }
  const column = type === 'player' ? 'player_id' : 'match_id';
  try {
    const result = await pool.query(
      `DELETE FROM favourites WHERE user_id=$1 AND ${column}=$2 RETURNING id`,
      [req.user.userId, id]
    );
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Favourite not found.' });
    return res.json({ status: 'success', message: 'Removed from favourites.' });
  } catch (error) {
    console.error('Favourite removal error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to remove favourite.' });
  }
}

module.exports = { listFavourites, addFavourite, removeFavourite };
