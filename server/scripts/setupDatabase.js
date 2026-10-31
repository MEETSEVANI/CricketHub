require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../src/config/database');

async function setupDatabase() {
  const databaseDirectory = path.join(__dirname, '..', 'src', 'database');
  const schema = await fs.readFile(path.join(databaseDirectory, 'schema.sql'), 'utf8');
  const seed = await fs.readFile(path.join(databaseDirectory, 'seed.sql'), 'utf8');

  try {
    await pool.query(schema);
    await pool.query(seed);
    console.log('Database schema is ready and demo cricket data is seeded.');
  } finally {
    await pool.end();
  }
}

setupDatabase().catch((error) => {
  console.error(`Database setup failed: ${error.message}`);
  process.exitCode = 1;
});
