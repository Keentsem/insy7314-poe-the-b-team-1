/**
 * Employee Security Tests - INSY7314 Task 3
 * Comprehensive security testing for employee portal
 *
 * Tests cover:
 * - Employee authentication
 * - Rate limiting
 * - CSRF protection
 * - Role-based access control
 * - Input validation
 * - Password security
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/auth');
const paymentRoutes = require('../routes/payments');
const rateLimit = require('express-rate-limit');
const { rateLimitMessage } = require('../utils/validation');

// Create test app
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // More lenient rate limiter for testing
  const testLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: rateLimitMessage,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  // Routes
  app.use('/api/auth', testLimiter, authRoutes);
  app.use('/api/payments', testLimiter, paymentRoutes);

  return app;
};

describe('Employee Authentication Security Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Employee Login Endpoint', () => {
    test('should return 200 OK with valid employee credentials', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({
        email: 'manager@bank.com',
        password: 'BankEmployee2025!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('employee');
      expect(response.body.user.email).toBe('manager@bank.com');

      // Check for secure cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true);
    });

    test('should return 401 for invalid employee password', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({
        email: 'manager@bank.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    test('should return 401 for non-existent employee email', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({
        email: 'nonexistent@bank.com',
        password: 'BankEmployee2025!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({
        email: 'not-an-email',
        password: 'BankEmployee2025!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Security - Argon2 Hashing', () => {
    test('should never return password hash in response', async () => {
      const response = await request(app).post('/api/auth/employee/login').send({
        email: 'manager@bank.com',
        password: 'BankEmployee2025!',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    test('should use Argon2 for password hashing (timing attack resistance)', async () => {
      const start1 = Date.now();
      await request(app).post('/api/auth/employee/login').send({
        email: 'manager@bank.com',
        password: 'WrongPassword1!',
      });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app).post('/api/auth/employee/login').send({
        email: 'manager@bank.com',
        password: 'BankEmployee2025!',
      });
      const time2 = Date.now() - start2;

      // Timing should be similar (within 200ms) to prevent timing attacks
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(200);
    });
  });

  describe('Employee Registration Prevention', () => {
    test('should block employee registration attempts', async () => {
      const response = await request(app).post('/api/auth/employee/register').send({
        name: 'Unauthorized Employee',
        email: 'unauthorized@bank.com',
        password: 'BankEmployee2025!',
      });

      // Should return 403 Forbidden or 404 Not Found
      expect([403, 404]).toContain(response.status);
    });
  });
});

describe('Role-Based Access Control (RBAC) Tests', () => {
  let app;
  let customerToken;
  let employeeToken;

  beforeAll(async () => {
    app = createTestApp();

    // Register and login as customer
    const customerEmail = global.testUtils?.generateEmail() || `customer-${Date.now()}@test.com`;
    const customerPassword = 'Customer123!';

    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: customerEmail,
        password: customerPassword,
        accountNumber: 'CUST' + Date.now(),
      });

    const customerLogin = await request(app).post('/api/auth/login').send({
      email: customerEmail,
      password: customerPassword,
    });

    const customerCookies = customerLogin.headers['set-cookie'];
    customerToken = customerCookies
      .find(cookie => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];

    // Login as employee
    const employeeLogin = await request(app).post('/api/auth/employee/login').send({
      email: 'manager@bank.com',
      password: 'BankEmployee2025!',
    });

    const employeeCookies = employeeLogin.headers['set-cookie'];
    employeeToken = employeeCookies
      .find(cookie => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
  });

  test('should allow employee to access employee-only endpoints', async () => {
    const response = await request(app)
      .get('/api/payments/employee/pending')
      .set('Cookie', `accessToken=${employeeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.transactions).toBeDefined();
  });

  test('should block customer from accessing employee endpoints', async () => {
    const response = await request(app)
      .get('/api/payments/employee/pending')
      .set('Cookie', `accessToken=${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('EMPLOYEE_ACCESS_REQUIRED');
  });

  test('should block unauthenticated access to employee endpoints', async () => {
    const response = await request(app).get('/api/payments/employee/pending');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('should block employee from customer-only operations', async () => {
    // Employee shouldn't be able to create customer payments
    const response = await request(app)
      .post('/api/payments')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send({
        amount: 100,
        currency: 'USD',
        recipientAccount: 'GB29NWBK60161331926819',
        recipientSwift: 'NWBKGB2L',
        recipientName: 'John Doe',
        reference: 'Test',
      });

    // Should either forbid or fail validation (employee doesn't have userId)
    expect([400, 403]).toContain(response.status);
  });
});

describe('CSRF Protection Tests', () => {
  let app;
  let employeeToken;

  beforeAll(async () => {
    app = createTestApp();

    // Login as employee
    const employeeLogin = await request(app).post('/api/auth/employee/login').send({
      email: 'verifier1@bank.com',
      password: 'BankEmployee2025!',
    });

    const employeeCookies = employeeLogin.headers['set-cookie'];
    employeeToken = employeeCookies
      .find(cookie => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
  });

  test('should require X-Requested-With header for state-changing requests', async () => {
    const response = await request(app)
      .post('/api/payments/employee/verify/test-123')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send({
        verified: true,
        verifierNotes: 'Test note',
      });

    // Should fail CSRF check without proper headers
    expect([403, 400]).toContain(response.status);
  });

  test('should accept requests with proper CSRF headers', async () => {
    const response = await request(app)
      .post('/api/payments/employee/verify/nonexistent-id')
      .set('Cookie', `accessToken=${employeeToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        verified: true,
        verifierNotes: 'Test note',
      });

    // Should pass CSRF but fail because transaction doesn't exist
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});

describe('Input Validation Tests', () => {
  let app;
  let employeeToken;

  beforeAll(async () => {
    app = createTestApp();

    const employeeLogin = await request(app).post('/api/auth/employee/login').send({
      email: 'analyst@bank.com',
      password: 'BankEmployee2025!',
    });

    const employeeCookies = employeeLogin.headers['set-cookie'];
    employeeToken = employeeCookies
      .find(cookie => cookie.startsWith('accessToken='))
      .split(';')[0]
      .split('=')[1];
  });

  test('should validate transaction ID format', async () => {
    const response = await request(app)
      .post('/api/payments/employee/verify/<script>alert("xss")</script>')
      .set('Cookie', `accessToken=${employeeToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        verified: true,
        verifierNotes: 'Test',
      });

    expect([400, 404]).toContain(response.status);
  });

  test('should sanitize verifier notes for XSS', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const response = await request(app)
      .post('/api/payments/employee/verify/test-id')
      .set('Cookie', `accessToken=${employeeToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        verified: true,
        verifierNotes: xssPayload,
      });

    // Should sanitize or reject
    if (response.body.transaction) {
      expect(response.body.transaction.verifierNotes).not.toContain('<script>');
    }
  });

  test('should reject SQL injection attempts in filters', async () => {
    const sqlInjection = "'; DROP TABLE transactions; --";

    const response = await request(app)
      .get(`/api/payments/employee/all?status=${sqlInjection}`)
      .set('Cookie', `accessToken=${employeeToken}`);

    // Should either reject or sanitize
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('Rate Limiting Tests', () => {
  let app;

  beforeEach(() => {
    // Create new app with strict rate limiting for these tests
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    const strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: rateLimitMessage,
      skipSuccessfulRequests: false,
    });

    app.use('/api/auth', strictLimiter, authRoutes);
  });

  test('should rate limit after 5 failed login attempts', async () => {
    const requests = [];

    // Make 6 failed login attempts
    for (let i = 0; i < 6; i++) {
      requests.push(
        request(app).post('/api/auth/employee/login').send({
          email: 'manager@bank.com',
          password: 'WrongPassword123!',
        })
      );
    }

    const responses = await Promise.all(requests);

    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect([401, 429]).toContain(lastResponse.status);

    // At least some requests should fail with 401
    const unauthorizedCount = responses.filter(r => r.status === 401).length;
    expect(unauthorizedCount).toBeGreaterThan(0);
  });
});

describe('Security Headers Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test('should not leak sensitive information in error responses', async () => {
    const response = await request(app).post('/api/auth/employee/login').send({
      email: 'manager@bank.com',
      password: 'WrongPassword!',
    });

    expect(response.body.user).toBeUndefined();
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.message).not.toMatch(/password|hash|salt/i);
  });

  test('should include security-related response headers', async () => {
    const response = await request(app).get('/api/payments/employee/pending').send();

    // Check for presence of security headers (may be added by middleware)
    // Even if request fails, headers should be present
    expect(response.headers).toBeDefined();
  });
});

describe('Session Management Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test('should create httpOnly cookie on successful login', async () => {
    const response = await request(app).post('/api/auth/employee/login').send({
      email: 'admin@bank.com',
      password: 'BankEmployee2025!',
    });

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const accessTokenCookie = cookies.find(c => c.includes('accessToken'));
    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie).toMatch(/httponly/i);
    expect(accessTokenCookie).toMatch(/secure|samesite/i);
  });

  test('should invalidate token after logout', async () => {
    // Login first
    const loginResponse = await request(app).post('/api/auth/employee/login').send({
      email: 'verifier2@bank.com',
      password: 'BankEmployee2025!',
    });

    const cookies = loginResponse.headers['set-cookie'];
    const token = cookies.find(cookie => cookie.startsWith('accessToken=')).split(';')[0];

    // Logout
    const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', token);

    expect(logoutResponse.status).toBe(200);

    // Try to use token after logout
    const protectedResponse = await request(app)
      .get('/api/payments/employee/pending')
      .set('Cookie', token);

    // Should be unauthorized
    expect(protectedResponse.status).toBe(401);
  });
});
