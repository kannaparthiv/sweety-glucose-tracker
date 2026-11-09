const request = require('supertest');
const app = require('../src/app');
const { initDb, closeDb, query } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

beforeAll(async () => {
  await initDb();
  await migrate();
  // Clear test users
  await query("DELETE FROM users WHERE email LIKE '%@authtest.com'");
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email LIKE '%@authtest.com'");
  await closeDb();
});

describe('Authentication API', () => {
  const testUser = {
    name: 'Test Patient',
    email: 'patient@authtest.com',
    password: 'SecurePassword123!',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with this email already exists.');
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email User',
        email: 'invalid-email-format',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter a valid email address.');
  });

  it('should reject registration with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pwd User',
        email: 'short@authtest.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at least 6 characters long.');
  });

  it('should login an existing user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('should protect routes when token is missing', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required. Please log in.');
  });
});
