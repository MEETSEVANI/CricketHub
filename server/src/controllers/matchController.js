const pool = require('../config/database');
const { validateMatch } = require('../validators/matchValidator');
const { validateLineups, validatePerformances } = require('../validators/matchAdminDataValidator');

const MATCH_FIELDS = `id, match_name, team_a, team_b, match_datetime, venue,
  status, result, created_at, updated_at`;

function parseMatchId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listMatches(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  if (query.length > 160) return res.status(400).json({ status: 'error', message: 'Search text must be 160 characters or fewer.' });
  if (status && !['Scheduled', 'Completed'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Status must be Scheduled or Completed.' });
  }

  const values = [];
  const conditions = [];
  if (query) {
    values.push(`%${query}%`);
    conditions.push(`(match_name ILIKE $${values.length} OR team_a ILIKE $${values.length} OR team_b ILIKE $${values.length})`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT ${MATCH_FIELDS} FROM matches
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY match_datetime ${status === 'Completed' ? 'DESC' : 'ASC'} LIMIT 100`,
      values
    );
    return res.json({ status: 'success', matches: result.rows });
  } catch (error) {
    console.error('Match search error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to load matches.' });
  }
}

async function getMatch(req, res) {
  const id = parseMatchId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid match id.' });

  try {
    const matchResult = await pool.query(`SELECT ${MATCH_FIELDS} FROM matches WHERE id=$1`, [id]);
    const match = matchResult.rows[0];
    if (!match) return res.status(404).json({ status: 'error', message: 'Match not found.' });

    const lineupsResult = await pool.query(
      `SELECT l.team_name, p.id AS player_id, p.name, p.country, p.role
       FROM lineups l JOIN players p ON p.id=l.player_id
       WHERE l.match_id=$1 ORDER BY l.team_name, p.name`, [id]
    );
    let performances = [];
    if (match.status === 'Completed') {
      const performanceResult = await pool.query(
        `SELECT p.id AS player_id, p.name, pf.runs, pf.wickets
         FROM performances pf JOIN players p ON p.id=pf.player_id
         WHERE pf.match_id=$1 ORDER BY pf.runs DESC, pf.wickets DESC`, [id]
      );
      performances = performanceResult.rows;
    }
    return res.json({ status: 'success', match, lineups: lineupsResult.rows, performances });
  } catch (error) {
    console.error('Match detail error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to load match details.' });
  }
}

async function createMatch(req, res) {
  const { errors, match } = validateMatch(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Match validation failed.', errors });

  try {
    const result = await pool.query(
      `INSERT INTO matches (match_name, team_a, team_b, match_datetime, venue, status, result)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${MATCH_FIELDS}`,
      [match.match_name, match.team_a, match.team_b, match.match_datetime, match.venue, match.status, match.result]
    );
    return res.status(201).json({ status: 'success', message: 'Match created.', match: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'A match with that name already exists.' });
    console.error('Match creation error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to create match.' });
  }
}

async function updateMatch(req, res) {
  const id = parseMatchId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid match id.' });
  const { errors, match } = validateMatch(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Match validation failed.', errors });

  try {
    const result = await pool.query(
      `UPDATE matches SET match_name=$1, team_a=$2, team_b=$3, match_datetime=$4,
       venue=$5, status=$6, result=$7, updated_at=CURRENT_TIMESTAMP
       WHERE id=$8 RETURNING ${MATCH_FIELDS}`,
      [match.match_name, match.team_a, match.team_b, match.match_datetime, match.venue, match.status, match.result, id]
    );
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Match not found.' });
    return res.json({ status: 'success', message: 'Match updated.', match: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ status: 'error', message: 'A match with that name already exists.' });
    console.error('Match update error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to update match.' });
  }
}

async function deleteMatch(req, res) {
  const id = parseMatchId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid match id.' });

  try {
    const result = await pool.query('DELETE FROM matches WHERE id=$1 RETURNING id', [id]);
    if (!result.rows[0]) return res.status(404).json({ status: 'error', message: 'Match not found.' });
    return res.json({ status: 'success', message: 'Match deleted.' });
  } catch (error) {
    console.error('Match deletion error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to delete match.' });
  }
}

async function saveMatchLineups(req, res) {
  const id = parseMatchId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid match id.' });
  const { errors, lineups } = validateLineups(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Lineup validation failed.', errors });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const matchResult = await client.query('SELECT id, team_a, team_b FROM matches WHERE id=$1', [id]);
    const match = matchResult.rows[0];
    if (!match) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Match not found.' });
    }

    const playerIds = [...lineups.team_a_player_ids, ...lineups.team_b_player_ids];
    if (playerIds.length) {
      const players = await client.query('SELECT id FROM players WHERE id = ANY($1::int[])', [playerIds]);
      if (players.rows.length !== playerIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'One or more selected players do not exist.' });
      }
    }

    await client.query('DELETE FROM lineups WHERE match_id=$1', [id]);
    await client.query(
      'DELETE FROM performances WHERE match_id=$1 AND NOT (player_id = ANY($2::int[]))',
      [id, playerIds]
    );
    for (const playerId of lineups.team_a_player_ids) {
      await client.query('INSERT INTO lineups (match_id, player_id, team_name) VALUES ($1, $2, $3)', [id, playerId, match.team_a]);
    }
    for (const playerId of lineups.team_b_player_ids) {
      await client.query('INSERT INTO lineups (match_id, player_id, team_name) VALUES ($1, $2, $3)', [id, playerId, match.team_b]);
    }
    await client.query('COMMIT');

    const saved = await pool.query(
      `SELECT l.team_name, p.id AS player_id, p.name, p.country, p.role
       FROM lineups l JOIN players p ON p.id=l.player_id
       WHERE l.match_id=$1 ORDER BY l.team_name, p.name`, [id]
    );
    return res.json({ status: 'success', message: 'Lineups saved.', lineups: saved.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Match lineup update error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to save match lineups.' });
  } finally {
    client.release();
  }
}

async function saveMatchPerformances(req, res) {
  const id = parseMatchId(req.params.id);
  if (!id) return res.status(400).json({ status: 'error', message: 'Invalid match id.' });
  const { errors, performances } = validatePerformances(req.body);
  if (errors.length) return res.status(400).json({ status: 'error', message: 'Performance validation failed.', errors });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const matchResult = await client.query('SELECT id, status FROM matches WHERE id=$1', [id]);
    const match = matchResult.rows[0];
    if (!match) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Match not found.' });
    }
    if (match.status !== 'Completed') {
      await client.query('ROLLBACK');
      return res.status(409).json({ status: 'error', message: 'Performance data can only be saved for completed matches.' });
    }

    const playerIds = performances.map((performance) => performance.player_id);
    if (playerIds.length) {
      const lineupPlayers = await client.query(
        'SELECT player_id FROM lineups WHERE match_id=$1 AND player_id = ANY($2::int[])', [id, playerIds]
      );
      if (lineupPlayers.rows.length !== playerIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: 'Performance records must belong to players in this match lineup.' });
      }
    }

    await client.query('DELETE FROM performances WHERE match_id=$1', [id]);
    for (const performance of performances) {
      await client.query(
        'INSERT INTO performances (match_id, player_id, runs, wickets) VALUES ($1, $2, $3, $4)',
        [id, performance.player_id, performance.runs, performance.wickets]
      );
    }
    await client.query('COMMIT');

    const saved = await pool.query(
      `SELECT p.id AS player_id, p.name, pf.runs, pf.wickets
       FROM performances pf JOIN players p ON p.id=pf.player_id
       WHERE pf.match_id=$1 ORDER BY pf.runs DESC, pf.wickets DESC`, [id]
    );
    return res.json({ status: 'success', message: 'Player performances saved.', performances: saved.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Match performance update error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Unable to save player performances.' });
  } finally {
    client.release();
  }
}

module.exports = { listMatches, getMatch, createMatch, updateMatch, deleteMatch, saveMatchLineups, saveMatchPerformances };
