require('dotenv').config();

const express = require('express');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CricketHub API is running',
  });
});

app.get('/api/health/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      status: 'ok',
      message: 'CricketHub API is connected to PostgreSQL',
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error:', error
    );

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`CricketHub API running on port ${PORT}`);
});