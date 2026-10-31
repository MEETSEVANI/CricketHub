const pool = require('../config/database');
const { validatePlayer } = require('../validators/playerValidator');

const PLAYER_FIELDS = `id, name, age, country, role, total_matches,
  total_runs, total_wickets, created_at, updated_at`;

function parsePlayerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listPlayers(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role : '';

  if (query.length > 120) {
    return res.status(400).json({ status: 'error', message: 'Search text must be 120 characters or fewer.' });
  }

  const values = [];
  const conditions = [];
  if (query) {
    values.push(`%${query}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }
  if (role) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT ${PLAYER_FIELDS} FROM players
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY name ASC LIMIT 100`,
      values
    );
    return res.json({ status: 'success', players: result.rows });
  } catch (error) {
    console.error('Player search error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to load players.' });
  }
}

async function getPlayer(req, res) {
  const id = parsePlayerId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid player id.' });

  try {
    const result = await pool.query(`SELECT ${PLAYER_FIELDS} FROM players WHERE id = $1`, [id]);
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Player not found.' });
    return res.json({ status: 'success', player: result.rows[0] });
  } catch (error) {
    console.error('Player detail error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to load player details.' });
  }
}

async function createPlayer(req, res) {
  const { errors, player } = validatePlayer(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Player validation failed.', errors });

  try {
    const result = await pool.query(
      `INSERT INTO players (name, age, country, role, total_matches, total_runs, total_wickets)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${PLAYER_FIELDS}`,
      [player.name, player.age, player.country, player.role, player.total_matches, player.total_runs, player.total_wickets]
    );
    return res.status(201).json({ status: 'success', message: 'Player created.', player: result.rows[0] });
  } catch (error) {
    console.error('Player creation error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to create player.' });
  }
}

async function updatePlayer(req, res) {
  const id = parsePlayerId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid player id.' });
  const { errors, player } = validatePlayer(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Player validation failed.', errors });

  try {
    const result = await pool.query(
      `UPDATE players SET name=$1, age=$2, country=$3, role=$4,
       total_matches=$5, total_runs=$6, total_wickets=$7, updated_at=CURRENT_TIMESTAMP
       WHERE id=$8 RETURNING ${PLAYER_FIELDS}`,
      [player.name, player.age, player.country, player.role, player.total_matches, player.total_runs, player.total_wickets, id]
    );
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Player not found.' });
    return res.json({ status: 'success', message: 'Player updated.', player: result.rows[0] });
  } catch (error) {
    console.error('Player update error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to update player.' });
  }
}

async function deletePlayer(req, res) {
  const id = parsePlayerId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid player id.' });

  try {
    const result = await pool.query('DELETE FROM players WHERE id=$1 RETURNING id', [id]);
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Player not found.' });
    return res.json({ status: 'success', message: 'Player deleted.' });
  } catch (error) {
    console.error('Player deletion error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to delete player.' });
  }
}

module.exports = { listPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer };
