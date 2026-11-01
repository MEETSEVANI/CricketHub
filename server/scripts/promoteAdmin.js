require('dotenv').config();

const pool = require('../src/config/database');

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run db:promote-admin -- user@example.com');
    process.exitCode = 2;
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role='Administrator' WHERE email=$1 RETURNING email`,
      [email]
    );
    if (!result.rows[0]) {
      console.error('No account found for that email. Create the account first.');
      process.exitCode = 1;
      return;
    }
    console.log('Administrator role granted. Sign in again to refresh the role in your session.');
  } finally {
    await pool.end();
  }
}

promoteAdmin().catch((error) => {
  console.error(`Could not update account role: ${error.message}`);
  process.exitCode = 1;
});
