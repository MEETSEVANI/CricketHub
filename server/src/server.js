
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

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);

app.use(express.json());

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

// Export the app for automated testing
module.exports = app;

// Start the server only when this file is executed directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`CricketHub API running on port ${PORT}`);
  });
}
