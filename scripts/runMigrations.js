const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  });

  pool.on('error', err => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS "migrations" (
  "id" serial,
  "name" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id"),
  UNIQUE ("name")
);`);

    const query = await client.query('SELECT name FROM migrations');
    const migrations = query.rows.map(row => row.name);
    const migrationsDir = path.resolve(__dirname, '..', 'src', 'migrations');
    const files = await fs.readdir(migrationsDir);

    const pendingMigrations = files
      .filter(file => {
        return file.endsWith('.sql') && !migrations.includes(file);
      })
      .sort((a, b) => {
        const timeA = parseInt(a.split('_')[0], 10);
        const timeB = parseInt(b.split('_')[0], 10);
        return timeB - timeA;
      });

    if (pendingMigrations.length === 0) {
      console.log(chalk.green('success'), 'No migrations to run');
    }

    while (pendingMigrations.length > 0) {
      const migrationFile = pendingMigrations.pop();
      console.log(chalk.gray('>'), `Running ${migrationFile}...`);
      // read the file
      const migration = await fs.readFile(path.join(migrationsDir, migrationFile), 'utf-8');
      // try to run the query
      await client.query(migration);
      // add migration to the list of migrations
      await client.query('INSERT INTO migrations (name) VALUES($1) RETURNING id, name;', [migrationFile]);
      console.log(chalk.green('success'), `Finished ${migrationFile}`);
    }
  } catch (err) {
    console.log(chalk.red('error'), err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
