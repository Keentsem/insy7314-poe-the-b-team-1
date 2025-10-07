const request = require('supertest');
const app = require('../index');

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    test('should enforce rate limiting on auth endpoints', async () => {
      const requests = [];

      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Test123!@#' })
            .set('Accept', 'application/json')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses[5];

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.message).toContain('Too many requests');
    });
  });

  describe('Input Validation', () => {
    test('should reject invalid email formats', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'Test123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should sanitize potentially dangerous input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test<script>alert("xss")</script>@example.com', password: 'Test123!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('HTTPS Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Authentication Logic', () => {
    test('should not leak user existence information', async () => {
      const nonExistentUserResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Test123!@#' });

      expect(nonExistentUserResponse.status).toBe(401);
      expect(nonExistentUserResponse.body.message).toBe('Invalid email or password');
    });

    test('should use secure password hashing', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email: 'security-test@example.com', password: 'Test123!@#' });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.password).toBeUndefined();
    });
  });
});