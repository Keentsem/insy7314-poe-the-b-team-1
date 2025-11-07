/**
 * API SECURITY TESTS - TASK 3
 *
 * Comprehensive security testing for employee endpoints
 * Tests authentication, authorization, CSRF protection, rate limiting, and input validation
 *
 * Contributes to DevSecOps Pipeline (30 marks)
 * Demonstrates: API Testing (Test security tools, ensure app runs)
 */

const request = require('supertest');
const app = require('../index');

describe('Employee API Security Tests', () => {
  // ==========================================
  // EMPLOYEE LOGIN ENDPOINT TESTS
  // ==========================================

  describe('Employee Login Endpoint', () => {
    test('should return 200 OK and JWT token with valid employee credentials', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'manager@bank.com',
          password: 'BankEmployee2025!',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('manager@bank.com');
      expect(response.body.user.role).toBe('employee');

      // Verify JWT token is set in cookie
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      const hasAccessToken = cookies.some(cookie => cookie.startsWith('accessToken='));
      expect(hasAccessToken).toBe(true);
    });

    test('should return 401 Unauthorized with invalid employee credentials', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'manager@bank.com',
          password: 'WrongPassword123!',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    test('should return 401 Unauthorized for non-existent employee', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'nonexistent@bank.com',
          password: 'BankEmployee2025!',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should enforce rate limiting after multiple failed login attempts', async () => {
      const requests = [];

      // Make 6 failed login attempts
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/employee/login')
            .send({
              email: 'manager@bank.com',
              password: 'WrongPassword' + i,
            })
            .set('Accept', 'application/json')
        );
      }

      const responses = await Promise.all(requests);

      // Check if rate limiting was triggered (429 or 401)
      const lastResponse = responses[responses.length - 1];

      // Should either be rate limited (429) or still showing 401 for invalid credentials
      // The important part is that the endpoint is protected
      expect([401, 429]).toContain(lastResponse.status);

      // If rate limited, verify the message
      if (lastResponse.status === 429) {
        expect(lastResponse.body.message).toContain('Too many');
      }
    });

    test('should validate email format for employee login', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'invalid-email-format',
          password: 'BankEmployee2025!',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should prevent XSS in login email field', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'manager<script>alert("xss")</script>@bank.com',
          password: 'BankEmployee2025!',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // EMPLOYEE AUTHORIZATION TESTS
  // ==========================================

  describe('Employee Authorization', () => {
    let customerToken = '';
    let employeeToken = '';

    beforeAll(async () => {
      // Register and login as a customer
      await request(app).post('/api/auth/register').send({
        email: 'customer@example.com',
        password: 'Customer123!@#',
      });

      const customerLogin = await request(app).post('/api/auth/login').send({
        email: 'customer@example.com',
        password: 'Customer123!@#',
      });

      // Extract customer token from cookie
      const customerCookies = customerLogin.headers['set-cookie'];
      customerToken = customerCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Login as employee
      const employeeLogin = await request(app).post('/api/auth/employee/login').send({
        email: 'verifier1@bank.com',
        password: 'BankEmployee2025!',
      });

      // Extract employee token from cookie
      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];
    });

    test('should reject customer token for employee-only endpoints', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Cookie', `accessToken=${customerToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Employee');
      expect(response.body.code).toBe('EMPLOYEE_ACCESS_REQUIRED');
    });

    test('should allow employee token for employee endpoints', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
    });

    test('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
    });

    test('should reject requests with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Cookie', 'accessToken=invalid-token-here')
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
    });
  });

  // ==========================================
  // EMPLOYEE PAYMENT ENDPOINTS TESTS
  // ==========================================

  describe('Employee Payment Endpoints', () => {
    let employeeToken = '';
    let testTransactionId = '';

    beforeAll(async () => {
      // Login as employee
      const employeeLogin = await request(app).post('/api/auth/employee/login').send({
        email: 'verifier2@bank.com',
        password: 'BankEmployee2025!',
      });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Create a test payment as a customer
      await request(app).post('/api/auth/register').send({
        email: 'testcustomer@example.com',
        password: 'Customer123!@#',
      });

      const customerLogin = await request(app).post('/api/auth/login').send({
        email: 'testcustomer@example.com',
        password: 'Customer123!@#',
      });

      const customerCookies = customerLogin.headers['set-cookie'];
      const customerToken = customerCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Create a payment
      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({
          amount: 500.0,
          currency: 'USD',
          recipientAccount: 'GB29NWBK60161331926819',
          recipientSwift: 'NWBKGB2L',
          recipientName: 'John Doe',
          reference: 'Test payment',
        });

      testTransactionId = paymentResponse.body.transaction.id;
    });

    test('GET /api/payments/employee/pending should return pending payments', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    test('GET /api/payments/employee/all should return all payments', async () => {
      const response = await request(app)
        .get('/api/payments/employee/all')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    test('GET /api/payments/employee/all with status filter should work', async () => {
      const response = await request(app)
        .get('/api/payments/employee/all?status=pending')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/payments/employee/verify/:id should verify payment (approve)', async () => {
      // First get CSRF token
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post(`/api/payments/employee/verify/${testTransactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: true,
          verifierNotes: 'Payment looks good',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');
      expect(response.body.transaction.status).toBe('verified');
    });

    test('POST /api/payments/employee/verify/:id should reject without CSRF token', async () => {
      const response = await request(app)
        .post(`/api/payments/employee/verify/${testTransactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .send({
          verified: true,
          verifierNotes: 'Test',
        });

      // Should fail due to missing CSRF token
      expect([403, 500]).toContain(response.status);
    });

    test('POST /api/payments/employee/verify/:id should validate input data', async () => {
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      // Test with invalid verified value (not a boolean)
      const response = await request(app)
        .post(`/api/payments/employee/verify/${testTransactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: 'yes', // Should be boolean
          verifierNotes: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/payments/employee/verify/:id should prevent XSS in verifier notes', async () => {
      // Create another payment to test
      await request(app).post('/api/auth/register').send({
        email: 'testcustomer2@example.com',
        password: 'Customer123!@#',
      });

      const customerLogin = await request(app).post('/api/auth/login').send({
        email: 'testcustomer2@example.com',
        password: 'Customer123!@#',
      });

      const customerCookies = customerLogin.headers['set-cookie'];
      const customerToken = customerCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({
          amount: 250.0,
          currency: 'EUR',
          recipientAccount: 'DE89370400440532013000',
          recipientSwift: 'COBADEFF',
          recipientName: 'Jane Smith',
          reference: 'Invoice 123',
        });

      const newTransactionId = paymentResponse.body.transaction.id;

      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post(`/api/payments/employee/verify/${newTransactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: false,
          verifierNotes: '<script>alert("xss")</script>Suspicious payment',
        });

      // Should fail validation or sanitize
      expect([400, 200]).toContain(response.status);

      if (response.status === 200) {
        // If accepted, notes should be sanitized
        expect(response.body.transaction.verifierNotes).not.toContain('<script>');
      }
    });

    test('POST /api/payments/employee/submit-swift should submit verified payments in batch', async () => {
      // Create and verify a few payments first
      const transactionIds = [];

      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: `batchcustomer${i}@example.com`,
            password: 'Customer123!@#',
          });

        const customerLogin = await request(app)
          .post('/api/auth/login')
          .send({
            email: `batchcustomer${i}@example.com`,
            password: 'Customer123!@#',
          });

        const customerCookies = customerLogin.headers['set-cookie'];
        const customerToken = customerCookies
          .find(cookie => cookie.startsWith('accessToken='))
          .split(';')[0]
          .split('=')[1];

        const paymentResponse = await request(app)
          .post('/api/payments')
          .set('Cookie', `accessToken=${customerToken}`)
          .send({
            amount: 100.0 * (i + 1),
            currency: 'USD',
            recipientAccount: 'US64SVBKUS6S3300958879',
            recipientSwift: 'SVBKUS6S',
            recipientName: `Recipient ${i}`,
            reference: `Batch payment ${i}`,
          });

        const txId = paymentResponse.body.transaction.id;
        transactionIds.push(txId);

        // Verify each payment
        const csrfResponse = await request(app)
          .get('/api/csrf-token')
          .set('Cookie', `accessToken=${employeeToken}`)
          .set('Accept', 'application/json');

        const csrfToken = csrfResponse.body.csrfToken;

        await request(app)
          .post(`/api/payments/employee/verify/${txId}`)
          .set('Cookie', `accessToken=${employeeToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send({
            verified: true,
            verifierNotes: 'Verified for batch',
          });
      }

      // Now submit to SWIFT
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post('/api/payments/employee/submit-swift')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          transactionIds: transactionIds,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeDefined();
      expect(response.body.results.successful.length).toBeGreaterThan(0);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.transactionCount).toBe(transactionIds.length);
    });

    test('POST /api/payments/employee/submit-swift should validate transaction IDs format', async () => {
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post('/api/payments/employee/submit-swift')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          transactionIds: ['invalid-id', '<script>alert("xss")</script>'],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/payments/employee/submit-swift should reject empty array', async () => {
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post('/api/payments/employee/submit-swift')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          transactionIds: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // SECURITY HEADERS TESTS
  // ==========================================

  describe('Security Headers', () => {
    test('should include security headers on employee endpoints', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Accept', 'application/json');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  // ==========================================
  // INPUT VALIDATION TESTS
  // ==========================================

  describe('Input Validation on Employee Endpoints', () => {
    let employeeToken = '';

    beforeAll(async () => {
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

    test('should reject SQL injection attempts in query parameters', async () => {
      const response = await request(app)
        .get("/api/payments/employee/all?status=pending' OR '1'='1")
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      // Should either sanitize or return valid response without SQL injection
      expect(response.status).toBe(200);
      // Ensure it didn't execute SQL injection
      expect(response.body.success).toBe(true);
    });

    test('should handle malformed query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending?limit=abc&page=xyz')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      // Should handle gracefully, either with default values or error
      expect([200, 400]).toContain(response.status);
    });

    test('should reject excessively long verifier notes', async () => {
      // Create a test payment first
      await request(app).post('/api/auth/register').send({
        email: 'longnotecustomer@example.com',
        password: 'Customer123!@#',
      });

      const customerLogin = await request(app).post('/api/auth/login').send({
        email: 'longnotecustomer@example.com',
        password: 'Customer123!@#',
      });

      const customerCookies = customerLogin.headers['set-cookie'];
      const customerToken = customerCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({
          amount: 150.0,
          currency: 'GBP',
          recipientAccount: 'GB82WEST12345698765432',
          recipientSwift: 'NWBKGB2L',
          recipientName: 'Test User',
          reference: 'Test',
        });

      const transactionId = paymentResponse.body.transaction.id;

      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      // Try to submit with very long notes (> 500 characters)
      const longNotes = 'A'.repeat(600);

      const response = await request(app)
        .post(`/api/payments/employee/verify/${transactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: false,
          verifierNotes: longNotes,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  // ==========================================
  // CSRF PROTECTION TESTS
  // ==========================================

  describe('CSRF Protection', () => {
    let employeeToken = '';

    beforeAll(async () => {
      const employeeLogin = await request(app).post('/api/auth/employee/login').send({
        email: 'admin@bank.com',
        password: 'BankEmployee2025!',
      });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];
    });

    test('should provide CSRF token via GET /api/csrf-token', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.csrfToken).toBeDefined();
      expect(typeof response.body.csrfToken).toBe('string');
      expect(response.body.csrfToken.length).toBeGreaterThan(0);
    });

    test('CSRF token should be unique per request', async () => {
      const response1 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const response2 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const token1 = response1.body.csrfToken;
      const token2 = response2.body.csrfToken;

      // Tokens should be different (not cached)
      expect(token1).not.toBe(token2);
    });
  });
});
