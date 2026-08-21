const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'financenote',
});

async function migrate() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(84219317)');
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const migrationDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const existing = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (existing.rowCount) continue;
      await client.query(fs.readFileSync(path.join(migrationDir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
      console.log(`Applied migration ${file}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
