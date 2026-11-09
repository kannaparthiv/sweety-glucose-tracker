const app = require('./app');
const { initDb } = require('./config/db');
const migrate = require('./scripts/migrate');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Initializing database...');
    await initDb();

    // Auto-run migrations on startup to ensure tables exist
    await migrate();

    app.listen(PORT, () => {
      console.log(`[Server] Sweety API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
