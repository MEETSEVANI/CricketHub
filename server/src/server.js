const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CricketHub API is running',
  });
});

app.listen(PORT, () => {
  console.log(`CricketHub API running on port ${PORT}`);
});