const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let pgliteInstance = null;

const usePgLite = process.env.USE_PGLITE === 'true';

async function initDb() {
  if (usePgLite) {
    if (!pgliteInstance) {
      const { PGlite } = require('@electric-sql/pglite');
      const dataDir = process.env.PGLITE_DATA_DIR
        ? path.resolve(__dirname, '../../', process.env.PGLITE_DATA_DIR)
        : undefined;

      if (dataDir && !fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      pgliteInstance = new PGlite(dataDir);
      console.log(`[DB] Connected using embedded PGlite ${dataDir ? `at ${dataDir}` : '(in-memory)'}`);
    }
    return pgliteInstance;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      pool = new Pool({ connectionString });
    } else {
      pool = new Pool({
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT, 10) || 5432,
        database: process.env.PGDATABASE || 'sweety_db',
      });
    }

    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
    });

    console.log('[DB] Connected to PostgreSQL pool');
  }

  return pool;
}

async function query(text, params = []) {
  if (usePgLite) {
    if (!pgliteInstance) {
      await initDb();
    }
    const res = await pgliteInstance.query(text, params);
    return {
      rows: res.rows || [],
      rowCount:
        res.rowCount !== undefined
          ? res.rowCount
          : res.affectedRows !== undefined
          ? res.affectedRows
          : res.rows
          ? res.rows.length
          : 0,
    };
  }

  if (!pool) {
    await initDb();
  }
  const res = await pool.query(text, params);
  return {
    rows: res.rows || [],
    rowCount: res.rowCount,
  };
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (pgliteInstance) {
    await pgliteInstance.close();
    pgliteInstance = null;
  }
}

module.exports = {
  initDb,
  query,
  closeDb,
  usePgLite,
};
