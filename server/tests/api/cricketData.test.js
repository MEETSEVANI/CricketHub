const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');
const pool = require('../../src/config/database');

let registeredToken;
let adminToken;
let testUserId;
const testEmail = `cricket-api-${Date.now()}@example.test`;
const testPlayerName = `API Test Player ${Date.now()}`;

function tokenFor(role) {
  return jwt.sign({ userId: testUserId, role }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

beforeAll(async () => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, 'test-password-hash', 'Registered User') RETURNING id`,
    [testEmail]
  );
  testUserId = result.rows[0].id;
  registeredToken = tokenFor('Registered User');
  adminToken = tokenFor('Administrator');
});

afterAll(async () => {
  await pool.query('DELETE FROM players WHERE name=$1', [testPlayerName]);
  if (testUserId) await pool.query('DELETE FROM users WHERE id=$1', [testUserId]);
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

    const removed = await request(app)
      .delete(`/api/favourites/player/${player.rows[0].id}`)
      .set('Authorization', `Bearer ${registeredToken}`);
    expect(removed.statusCode).toBe(200);
  });
});
