require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const pool = require('./config/database');
const protectedTestRoutes = require('./routes/protectedTestRoutes');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
app.use('/api/protected-test', protectedTestRoutes);
app.use(express.json());
app.use('/api/auth', authRoutes);

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