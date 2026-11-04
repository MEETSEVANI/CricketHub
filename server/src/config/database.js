const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const parsedDatabaseUrl = new URL(databaseUrl);
const usesSupabase =
  parsedDatabaseUrl.hostname.endsWith('.pooler.supabase.com') ||
  parsedDatabaseUrl.hostname.endsWith('.supabase.co');

let connectionString = databaseUrl;
let ssl;

if (usesSupabase) {
  // pg-connection-string overrides the `ssl` option when SSL parameters are
  // present in the URL. Use the bundled Supabase CA so TLS can verify the
  // database server even when the URL includes `sslmode=require`.
  ['sslmode', 'sslrootcert', 'sslcert', 'sslkey'].forEach((parameter) => {
    parsedDatabaseUrl.searchParams.delete(parameter);
  });

  connectionString = parsedDatabaseUrl.toString();
  ssl = {
    ca: fs.readFileSync(path.join(__dirname, '../../certs/prod-ca-2021.crt'), 'utf8'),
  };
}

const pool = new Pool({
  connectionString,
  ...(ssl ? { ssl } : {}),
});

module.exports = pool;
