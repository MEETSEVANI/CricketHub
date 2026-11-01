const pool = require('../config/database');

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

module.exports = { listMatches, getMatch };
