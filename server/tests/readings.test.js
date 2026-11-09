const request = require('supertest');
const app = require('../src/app');
const { initDb, closeDb, query } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

let tokenUserA;
let tokenUserB;
let userIdA;
let userIdB;

beforeAll(async () => {
  await initDb();
  await migrate();
  await query("DELETE FROM users WHERE email LIKE '%@readingtest.com'");

  // Register User A
  const resA = await request(app).post('/api/auth/register').send({
    name: 'User A',
    email: 'userA@readingtest.com',
    password: 'Password123!',
  });
  tokenUserA = resA.body.token;
  userIdA = resA.body.user.id;

  // Register User B
  const resB = await request(app).post('/api/auth/register').send({
    name: 'User B',
    email: 'userB@readingtest.com',
    password: 'Password123!',
  });
  tokenUserB = resB.body.token;
  userIdB = resB.body.user.id;
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email LIKE '%@readingtest.com'");
  await closeDb();
});

describe('Readings API - Validation & CRUD Rules', () => {
  const testDate = '2026-10-15'; // Valid past date

  it('Rule 1: should reject missing glucose value with exact error message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: testDate,
        time_slot: 'Morning (fasting)',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter a glucose value.');
  });

  it('Rule 2: should reject value < 40 with exact error message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: testDate,
        time_slot: 'Morning (fasting)',
        value: 39,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('Rule 2: should reject value > 600 with exact error message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: testDate,
        time_slot: 'Morning (fasting)',
        value: 601,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('Rule 5: should reject future date with exact error message', async () => {
    // 2099-01-01 is definitely in the future
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: '2099-01-01',
        time_slot: 'Morning (fasting)',
        value: 110,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Date cannot be in the future.');
  });

  it('should successfully add 4 readings for 4 distinct slots on a date', async () => {
    const slots = [
      { slot: 'Morning (fasting)', val: 95 },
      { slot: 'After breakfast', val: 130 },
      { slot: 'After lunch', val: 140 },
      { slot: 'After dinner', val: 135 },
    ];

    for (const item of slots) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          time_slot: item.slot,
          value: item.val,
        });

      expect(res.status).toBe(201);
      expect(res.body.reading.value).toBe(item.val);
      expect(res.body.reading.time_slot).toBe(item.slot);
    }
  });

  it('Rule 3: should reject duplicate reading for same slot on same date', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: testDate,
        time_slot: 'After lunch',
        value: 145,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('You already have an After lunch reading for this date.');
  });

  it('Rule 4: should reject a 5th reading on the same day with exact error message', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: testDate,
        time_slot: 'Morning (fasting)', // Even if slot check runs, day count is 4
        value: 120,
      });

    expect(res.status).toBe(400);
    expect([
      'You can add only 4 readings per day.',
      'You already have a Morning (fasting) reading for this date.'
    ]).toContain(res.body.message);
  });

  it('User Isolation: User B should NOT see User A readings', async () => {
    const resA = await request(app)
      .get(`/api/readings?date=${testDate}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.readings.length).toBe(4);

    const resB = await request(app)
      .get(`/api/readings?date=${testDate}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.readings.length).toBe(0);
  });

  it('should update an existing reading successfully', async () => {
    const listRes = await request(app)
      .get(`/api/readings?date=${testDate}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    const readingToUpdate = listRes.body.readings[0];

    const updateRes = await request(app)
      .put(`/api/readings/${readingToUpdate.id}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        value: 102,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.reading.value).toBe(102);
  });

  it('User Isolation: User B cannot delete User A reading', async () => {
    const listRes = await request(app)
      .get(`/api/readings?date=${testDate}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    const readingId = listRes.body.readings[0].id;

    const delRes = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(delRes.status).toBe(404);
  });

  it('should delete a reading successfully', async () => {
    const listRes = await request(app)
      .get(`/api/readings?date=${testDate}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    const readingId = listRes.body.readings[0].id;

    const delRes = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(delRes.status).toBe(200);

    const verifyRes = await request(app)
      .get(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(verifyRes.status).toBe(404);
  });

  it('Bonus: should support pagination on GET /readings (?page=1&limit=2)', async () => {
    const res = await request(app)
      .get('/api/readings?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.readings.length).toBeLessThanOrEqual(2);
  });
});
