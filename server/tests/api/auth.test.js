const request = require('supertest');
const app = require('../../src/server');
const pool = require('../../src/config/database');
const jwt = require('jsonwebtoken');

const testEmail = `api-test-${Date.now()}@example.com`;
const testPassword = 'ApiTest@123';

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', [
    'api-test-%@example.com',
  ]);

  await pool.end();
});

describe('Authentication API', () => {
  test('GET /api/health returns a successful response', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('x-forwarded-proto', 'https');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers).toMatchObject({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'cache-control': 'no-store',
    });
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  test('POST /api/auth/register rejects an invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'apitest@example.com',
        password: 'weak',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errors).toBeDefined();
  });

  test('POST /api/auth/register successfully creates a user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.role).toBe('Registered User');
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  test('POST /api/auth/login successfully authenticates a user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.role).toBe('Registered User');
  });

  test('POST /api/auth/login rejects invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'doesnotexist@example.com',
        password: 'WrongPass@123',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('error');
  });
  test('protected Administrator route accepts a valid Administrator token', async () => {
    const token = jwt.sign(
      {
        userId: 999,
        role: 'Administrator',
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
      }
    );

    const response = await request(app)
      .get('/api/protected-test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toBe('Administrator access granted.');
    expect(response.body.user.role).toBe('Administrator');
  });

  test('protected Administrator route rejects a Registered User token', async () => {
    const token = jwt.sign(
      {
        userId: 998,
        role: 'Registered User',
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
      }
    );

    const response = await request(app)
      .get('/api/protected-test')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.status).toBe('error');
  });

  test('protected Administrator route rejects requests without a token', async () => {
    const response = await request(app)
      .get('/api/protected-test');

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('error');
  });

  test('protected Administrator route rejects a malformed bearer token', async () => {
    const response = await request(app)
      .get('/api/protected-test')
      .set('Authorization', 'Bearer not-a-valid-jwt');

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Invalid or expired authentication token.',
    });
  });
});
