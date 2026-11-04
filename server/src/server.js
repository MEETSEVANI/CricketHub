
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const favouriteRoutes = require('./routes/favouriteRoutes');
const protectedTestRoutes = require('./routes/protectedTestRoutes');
const pool = require('./config/database');

const app = express();

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (req.get('x-forwarded-proto')?.split(',')[0].trim() === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);

app.use(express.json());
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/protected-test', protectedTestRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CricketHub API is running',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CricketHub API' });
});

app.get('/api', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CricketHub API' });
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/\n');
});

// Database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.status(200).json({
      status: 'ok',
      message: 'CricketHub API is connected to PostgreSQL',
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: 'API endpoint not found.' });
});

// Export the app for automated testing
module.exports = app;

// Start the server only when this file is executed directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`CricketHub API running on port ${PORT}`);
  });
}
