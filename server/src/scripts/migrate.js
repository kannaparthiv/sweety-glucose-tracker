const { query, closeDb, initDb } = require('../config/db');

async function migrate(shouldClose = false) {
  try {
    await initDb();

    // 1. Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Readings Table
    await query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_user_date_slot UNIQUE (user_id, date, time_slot)
      );
    `);

    // 3. Create Indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, date);
    `);

  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    if (shouldClose) {
      process.exit(1);
    }
    throw error;
  } finally {
    if (shouldClose) {
      await closeDb();
    }
  }
}

if (require.main === module) {
  migrate(true).then(() => {
    console.log('[Migration] Migration completed successfully.');
  });
}

module.exports = migrate;
