const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');
const pool = require('../../src/config/database');

let registeredToken;
let secondUserToken;
let adminToken;
let testUserId;
let secondUserId;
const testEmail = `cricket-api-${Date.now()}@example.test`;
const secondTestEmail = `cricket-api-second-${Date.now()}@example.test`;
const testPlayerName = `API Test Player ${Date.now()}`;
const testMatchName = `API Test Match ${Date.now()}`;

function tokenFor(role, userId = testUserId) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

beforeAll(async () => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, 'test-password-hash', 'Registered User'),
            ($2, 'test-password-hash', 'Registered User') RETURNING id, email`,
    [testEmail, secondTestEmail]
  );
  testUserId = result.rows.find((user) => user.email === testEmail).id;
  secondUserId = result.rows.find((user) => user.email === secondTestEmail).id;
  registeredToken = tokenFor('Registered User');
  secondUserToken = tokenFor('Registered User', secondUserId);
  adminToken = tokenFor('Administrator');
});

afterAll(async () => {
  await pool.query('DELETE FROM players WHERE name=$1', [testPlayerName]);
  await pool.query('DELETE FROM matches WHERE match_name=$1', [testMatchName]);
  if (testUserId || secondUserId) {
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [[testUserId, secondUserId].filter(Boolean)]);
  }
  await pool.end();
});

describe('Cricket data API', () => {
  test('player search is case-insensitive and requires authentication', async () => {
    const unauthorized = await request(app).get('/api/players?q=aarav');
    expect(unauthorized.statusCode).toBe(401);

    const response = await request(app)
      .get('/api/players?q=aArAv')
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.players.some((player) => player.name === 'Aarav Mehta')).toBe(true);
  });

  test('player details include profile and career totals', async () => {
    const player = await pool.query('SELECT id FROM players WHERE name=$1', ['Aarav Mehta']);
    const response = await request(app)
      .get(`/api/players/${player.rows[0].id}`)
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.player).toMatchObject({ name: 'Aarav Mehta', country: 'India', total_runs: 3120 });
  });

  test('only administrators can create, edit, and delete player records', async () => {
    const payload = { name: testPlayerName, age: 24, country: 'Canada', role: 'All-Rounder', total_matches: 2, total_runs: 30, total_wickets: 1 };
    const denied = await request(app)
      .post('/api/players')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send(payload);
    expect(denied.statusCode).toBe(403);

    const created = await request(app)
      .post('/api/players')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    expect(created.statusCode).toBe(201);
    const playerId = created.body.player.id;

    const updated = await request(app)
      .put(`/api/players/${playerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, age: 25 });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.player.age).toBe(25);

    const deleted = await request(app)
      .delete(`/api/players/${playerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.statusCode).toBe(200);
  });

  test('match status filtering returns only the requested state', async () => {
    const response = await request(app)
      .get('/api/matches?status=Scheduled')
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.matches.length).toBeGreaterThan(0);
    expect(response.body.matches.every((match) => match.status === 'Scheduled')).toBe(true);
  });

  test('only administrators can create, update, and delete match records', async () => {
    const payload = {
      match_name: testMatchName,
      team_a: 'Northern Comets',
      team_b: 'Lakeshore Falcons',
      match_datetime: new Date(Date.now() + 86_400_000).toISOString(),
      venue: 'Toronto Cricket Ground',
      status: 'Scheduled',
      result: '',
    };
    const denied = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send(payload);
    expect(denied.statusCode).toBe(403);

    const invalid = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, team_b: payload.team_a });
    expect(invalid.statusCode).toBe(400);

    const created = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);
    expect(created.statusCode).toBe(201);
    const matchId = created.body.match.id;

    const notCompleted = await request(app)
      .put(`/api/matches/${matchId}/performances`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ performances: [] });
    expect(notCompleted.statusCode).toBe(409);

    const updated = await request(app)
      .put(`/api/matches/${matchId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, status: 'Completed', result: 'Northern Comets won by 12 runs.' });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.match).toMatchObject({ status: 'Completed', result: 'Northern Comets won by 12 runs.' });

    const players = await pool.query('SELECT id FROM players ORDER BY id LIMIT 2');
    const teamAPlayer = players.rows[0].id;
    const teamBPlayer = players.rows[1].id;
    const deniedLineups = await request(app)
      .put(`/api/matches/${matchId}/lineups`)
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ team_a_player_ids: [teamAPlayer], team_b_player_ids: [teamBPlayer] });
    expect(deniedLineups.statusCode).toBe(403);

    const duplicateLineup = await request(app)
      .put(`/api/matches/${matchId}/lineups`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ team_a_player_ids: [teamAPlayer, teamAPlayer], team_b_player_ids: [teamBPlayer] });
    expect(duplicateLineup.statusCode).toBe(400);

    const lineups = await request(app)
      .put(`/api/matches/${matchId}/lineups`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ team_a_player_ids: [teamAPlayer], team_b_player_ids: [teamBPlayer] });
    expect(lineups.statusCode).toBe(200);
    expect(lineups.body.lineups).toHaveLength(2);

    const invalidPerformance = await request(app)
      .put(`/api/matches/${matchId}/performances`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ performances: [{ player_id: 999999, runs: 12, wickets: 1 }] });
    expect(invalidPerformance.statusCode).toBe(400);

    const performance = await request(app)
      .put(`/api/matches/${matchId}/performances`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ performances: [{ player_id: teamAPlayer, runs: 84, wickets: 2 }] });
    expect(performance.statusCode).toBe(200);
    expect(performance.body.performances).toMatchObject([{ player_id: teamAPlayer, runs: 84, wickets: 2 }]);

    const detail = await request(app)
      .get(`/api/matches/${matchId}`)
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(detail.statusCode).toBe(200);
    expect(detail.body.lineups).toHaveLength(2);
    expect(detail.body.performances).toMatchObject([{ player_id: teamAPlayer, runs: 84, wickets: 2 }]);

    const deleted = await request(app)
      .delete(`/api/matches/${matchId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.statusCode).toBe(200);
  });

  test('completed match details include lineups and player performances', async () => {
    const match = await pool.query("SELECT id FROM matches WHERE status='Completed' ORDER BY id LIMIT 1");
    const response = await request(app)
      .get(`/api/matches/${match.rows[0].id}`)
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.match.status).toBe('Completed');
    expect(response.body.lineups.length).toBeGreaterThan(0);
    expect(response.body.performances.length).toBeGreaterThan(0);
  });

  test('favourites are private to each account and cannot be duplicated', async () => {
    const player = await pool.query('SELECT id FROM players WHERE name=$1', ['Aarav Mehta']);
    const added = await request(app)
      .post('/api/favourites')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ type: 'player', id: player.rows[0].id });
    expect(added.statusCode).toBe(201);

    const duplicate = await request(app)
      .post('/api/favourites')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ type: 'player', id: player.rows[0].id });
    expect(duplicate.statusCode).toBe(409);

    const listed = await request(app)
      .get('/api/favourites')
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(listed.statusCode).toBe(200);
    expect(listed.body.favourites).toHaveLength(1);
    expect(listed.body.favourites[0].player_name).toBe('Aarav Mehta');

    const privateList = await request(app)
      .get('/api/favourites')
      .set('Authorization', `Bearer ${secondUserToken}`);
    expect(privateList.statusCode).toBe(200);
    expect(privateList.body.favourites).toEqual([]);

    const cannotRemoveAnotherUsersFavourite = await request(app)
      .delete(`/api/favourites/player/${player.rows[0].id}`)
      .set('Authorization', `Bearer ${secondUserToken}`);
    expect(cannotRemoveAnotherUsersFavourite.statusCode).toBe(404);

    const removed = await request(app)
      .delete(`/api/favourites/player/${player.rows[0].id}`)
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(removed.statusCode).toBe(200);
  });

  test('favourite endpoints return clear validation and not-found errors', async () => {
    const invalidType = await request(app)
      .post('/api/favourites')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ type: 'team', id: 1 });
    expect(invalidType.statusCode).toBe(400);
    expect(invalidType.body.message).toMatch(/valid player or match/i);

    const missingPlayer = await request(app)
      .post('/api/favourites')
      .set('Authorization', `Bearer ${registeredToken}`)
      .send({ type: 'player', id: 2147483647 });
    expect(missingPlayer.statusCode).toBe(404);

    const invalidRemovalId = await request(app)
      .delete('/api/favourites/player/not-an-id')
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(invalidRemovalId.statusCode).toBe(400);

    const missingFavourite = await request(app)
      .delete('/api/favourites/match/2147483647')
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(missingFavourite.statusCode).toBe(404);
  });
});
