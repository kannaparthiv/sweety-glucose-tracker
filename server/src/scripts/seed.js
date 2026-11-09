const bcrypt = require('bcryptjs');
const { query, closeDb, initDb } = require('../config/db');
const migrate = require('./migrate');

async function seed(shouldClose = false) {
  console.log('[Seed] Starting database seeding...');
  try {
    await initDb();
    await migrate(false);

    // 1. Clean existing seed users (if any)
    await query('DELETE FROM users WHERE email IN ($1, $2)', [
      'demo@sweety.com',
      'alex@sweety.com',
    ]);

    // 2. Create Demo User
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const demoUserRes = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      ['Jane Doe', 'demo@sweety.com', passwordHash]
    );
    const demoUser = demoUserRes.rows[0];
    console.log(`[Seed] Created demo user: ${demoUser.email} (ID: ${demoUser.id})`);

    // 3. Create Second User to demonstrate user isolation
    const otherUserRes = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      ['Alex Smith', 'alex@sweety.com', passwordHash]
    );
    const otherUser = otherUserRes.rows[0];
    console.log(`[Seed] Created secondary user for isolation tests: ${otherUser.email} (ID: ${otherUser.id})`);

    // 4. Generate realistic readings for Demo User
    const slots = [
      { name: 'Morning (fasting)', min: 80, max: 115 },
      { name: 'After breakfast', min: 110, max: 155 },
      { name: 'After lunch', min: 115, max: 165 },
      { name: 'After dinner', min: 120, max: 160 },
    ];

    const today = new Date();
    const readings = [];

    // Seed readings for the past 45 days up to today
    for (let dayOffset = 45; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dateStr = d.toLocaleDateString('en-CA');

      const count = dayOffset === 0 ? 3 : Math.floor(Math.random() * 3) + 2; // 2 to 4
      const daySlots = slots.slice(0, count);

      for (const slot of daySlots) {
        const val = Math.floor(Math.random() * (slot.max - slot.min + 1)) + slot.min;
        readings.push({
          userId: demoUser.id,
          date: dateStr,
          slot: slot.name,
          value: val,
        });
      }
    }

    // Insert readings in batch
    for (const r of readings) {
      await query(
        `INSERT INTO readings (user_id, date, time_slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, date, time_slot) DO UPDATE SET value = EXCLUDED.value`,
        [r.userId, r.date, r.slot, r.value]
      );
    }
    console.log(`[Seed] Seeded ${readings.length} readings for ${demoUser.email}`);

    // Seed a couple readings for the other user to verify isolation
    const todayStr = today.toLocaleDateString('en-CA');
    await query(
      `INSERT INTO readings (user_id, date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [otherUser.id, todayStr, 'Morning (fasting)', 210]
    );

    console.log('[Seed] Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Email:    demo@sweety.com');
    console.log('Password: Password123!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    if (shouldClose) process.exit(1);
    throw error;
  } finally {
    if (shouldClose) {
      await closeDb();
    }
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = seed;
