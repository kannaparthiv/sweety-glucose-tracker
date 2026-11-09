const request = require('supertest');
const app = require('../src/app');
const { initDb, closeDb, query } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

let tokenUser;

beforeAll(async () => {
  await initDb();
  await migrate();
  await query("DELETE FROM users WHERE email LIKE '%@reporttest.com'");

  const res = await request(app).post('/api/auth/register').send({
    name: 'Report Test Patient',
    email: 'patient@reporttest.com',
    password: 'Password123!',
  });
  tokenUser = res.body.token;

  // Insert known readings on 2026-10-15:
  // Values: 100, 140, 165, 122
  // Highest: 165
  // Lowest: 100
  // Average: (100 + 140 + 165 + 122) / 4 = 527 / 4 = 131.75 -> rounded to 131.8
  const readingsOct15 = [
    { date: '2026-10-15', time_slot: 'Morning (fasting)', value: 100 },
    { date: '2026-10-15', time_slot: 'After breakfast', value: 140 },
    { date: '2026-10-15', time_slot: 'After lunch', value: 165 },
    { date: '2026-10-15', time_slot: 'After dinner', value: 122 },
  ];

  for (const r of readingsOct15) {
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send(r);
  }

  // Insert a reading on 2026-10-02 (within month-to-date: 1 Oct - 15 Oct 2026)
  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${tokenUser}`)
    .send({
      date: '2026-10-02',
      time_slot: 'Morning (fasting)',
      value: 90,
    });

  // Insert a reading on 2026-09-20 (within previous month: 1 Sep - 30 Sep 2026)
  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${tokenUser}`)
    .send({
      date: '2026-09-20',
      time_slot: 'Morning (fasting)',
      value: 115,
    });
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email LIKE '%@reporttest.com'");
  await closeDb();
});

describe('Reports API', () => {
  it('should generate correct Daily Report for 2026-10-15', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    const { daily } = res.body;

    expect(daily.count).toBe(4);
    expect(daily.highest).toBe(165);
    expect(daily.lowest).toBe(100);
    expect(daily.average).toBe(131.8);
    expect(daily.readings).toHaveLength(4);
    expect(daily.readings[0].time_slot).toBe('Morning (fasting)');
  });

  it('should generate correct Month-to-Date Report (1 Oct - 15 Oct 2026)', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    const { monthToDate } = res.body;

    expect(monthToDate.dateRange.startDate).toBe('2026-10-01');
    expect(monthToDate.dateRange.endDate).toBe('2026-10-15');
    // Total readings: 4 from Oct 15 + 1 from Oct 02 = 5
    expect(monthToDate.count).toBe(5);
    expect(monthToDate.highest).toBe(165);
    expect(monthToDate.lowest).toBe(90);
    // (100 + 140 + 165 + 122 + 90) / 5 = 617 / 5 = 123.4
    expect(monthToDate.average).toBe(123.4);
  });

  it('should generate correct Monthly Report for previous month (1 Sep - 30 Sep 2026)', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    const { monthly } = res.body;

    expect(monthly.dateRange.startDate).toBe('2026-09-01');
    expect(monthly.dateRange.endDate).toBe('2026-09-30');
    expect(monthly.count).toBe(1);
    expect(monthly.highest).toBe(115);
    expect(monthly.lowest).toBe(115);
    expect(monthly.average).toBe(115);
  });

  it('should return empty state stats when no readings exist for the date', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-05-10')
      .set('Authorization', `Bearer ${tokenUser}`);

    expect(res.status).toBe(200);
    const { daily } = res.body;

    expect(daily.count).toBe(0);
    expect(daily.highest).toBeNull();
    expect(daily.lowest).toBeNull();
    expect(daily.average).toBeNull();
    expect(daily.readings).toEqual([]);
  });
});
