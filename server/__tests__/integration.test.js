/**
 * INTEGRATION TESTS - TASK 3
 *
 * End-to-end integration testing for the complete payment workflow
 * Tests the full journey from customer payment creation to employee verification and SWIFT submission
 *
 * Contributes to DevSecOps Pipeline (30 marks)
 * Demonstrates: Complete workflow testing, ensuring app runs end-to-end
 */

const request = require('supertest');
const app = require('../index');

describe('Payment Workflow Integration Tests', () => {

  // ==========================================
  // FULL PAYMENT WORKFLOW TEST
  // ==========================================

  describe('Complete Payment Lifecycle', () => {

    let customerEmail;
    let customerToken;
    let employeeToken;
    let transactionId;

    beforeAll(async () => {
      // Generate unique customer email for this test run
      customerEmail = `integration-customer-${Date.now()}@example.com`;
    });

    test('Step 1: Customer registers successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: customerEmail,
          password: 'IntegrationTest123!@#'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(customerEmail);
    });

    test('Step 2: Customer logs in successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password: 'IntegrationTest123!@#'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(customerEmail);

      // Extract token from cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      customerToken = cookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      expect(customerToken).toBeDefined();
      expect(customerToken.length).toBeGreaterThan(0);
    });

    test('Step 3: Customer creates a payment transaction', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({
          amount: 750.50,
          currency: 'EUR',
          recipientAccount: 'FR1420041010050500013M02606',
          recipientSwift: 'BNPAFRPP',
          recipientName: 'Jean Dupont',
          reference: 'Integration test payment INV-001'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.transaction.id).toBeDefined();
      expect(response.body.transaction.status).toBe('pending');
      expect(response.body.transaction.amount).toBe(750.50);
      expect(response.body.transaction.currency).toBe('EUR');

      // Save transaction ID for later steps
      transactionId = response.body.transaction.id;
    });

    test('Step 4: Customer can view their transaction', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(Array.isArray(response.body.transactions)).toBe(true);

      // Find our transaction
      const ourTransaction = response.body.transactions.find(tx => tx.id === transactionId);
      expect(ourTransaction).toBeDefined();
      expect(ourTransaction.status).toBe('pending');
    });

    test('Step 5: Employee logs in successfully', async () => {
      const response = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'manager@bank.com',
          password: 'BankEmployee2025!'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('employee');
      expect(response.body.user.email).toBe('manager@bank.com');

      // Extract employee token
      const cookies = response.headers['set-cookie'];
      employeeToken = cookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      expect(employeeToken).toBeDefined();
    });

    test('Step 6: Employee views pending transactions', async () => {
      const response = await request(app)
        .get('/api/payments/employee/pending')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();

      // Our transaction should be in pending list
      const ourTransaction = response.body.transactions.find(tx => tx.id === transactionId);
      expect(ourTransaction).toBeDefined();
      expect(ourTransaction.customerEmail).toBe(customerEmail);
      expect(ourTransaction.amount).toBe(750.50);
      expect(ourTransaction.status).toBe('pending');
    });

    test('Step 7: Employee verifies and approves the payment', async () => {
      // Get CSRF token
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(csrfResponse.status).toBe(200);
      const csrfToken = csrfResponse.body.csrfToken;

      // Verify payment
      const response = await request(app)
        .post(`/api/payments/employee/verify/${transactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: true,
          verifierNotes: 'All documents verified. Transaction approved for SWIFT submission.'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');
      expect(response.body.transaction.status).toBe('verified');
      expect(response.body.transaction.verifiedBy).toBeDefined();
      expect(response.body.transaction.verifiedAt).toBeDefined();
      expect(response.body.transaction.verificationStatus).toBe('verified');
    });

    test('Step 8: Employee views verified transactions', async () => {
      const response = await request(app)
        .get('/api/payments/employee/all?status=verified')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Our transaction should now be in verified list
      const ourTransaction = response.body.transactions.find(tx => tx.id === transactionId);
      expect(ourTransaction).toBeDefined();
      expect(ourTransaction.status).toBe('verified');
      expect(ourTransaction.verifiedBy).toBeDefined();
    });

    test('Step 9: Employee submits verified payment to SWIFT', async () => {
      // Get CSRF token
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      // Submit to SWIFT
      const response = await request(app)
        .post('/api/payments/employee/submit-swift')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          transactionIds: [transactionId]
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('submitted');
      expect(response.body.results).toBeDefined();
      expect(response.body.results.successful.length).toBe(1);
      expect(response.body.results.failed.length).toBe(0);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.transactionCount).toBe(1);
      expect(response.body.summary.totalAmount).toBe(750.50);
      expect(response.body.summary.currencies.EUR).toBe(750.50);
    });

    test('Step 10: Transaction status is updated to submitted_to_swift', async () => {
      const response = await request(app)
        .get('/api/payments/employee/all')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);

      // Find our transaction
      const ourTransaction = response.body.transactions.find(tx => tx.id === transactionId);
      expect(ourTransaction).toBeDefined();
      expect(ourTransaction.status).toBe('submitted_to_swift');
      expect(ourTransaction.submittedBy).toBeDefined();
      expect(ourTransaction.submittedAt).toBeDefined();
    });

    test('Step 11: Customer can see updated transaction status', async () => {
      const response = await request(app)
        .get(`/api/payments/${transactionId}`)
        .set('Cookie', `accessToken=${customerToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.transaction.id).toBe(transactionId);
      expect(response.body.transaction.status).toBe('submitted_to_swift');
    });
  });

  // ==========================================
  // REJECTION WORKFLOW TEST
  // ==========================================

  describe('Payment Rejection Workflow', () => {

    let customerToken;
    let employeeToken;
    let rejectedTransactionId;

    beforeAll(async () => {
      // Register and login as customer
      const customerEmail = `rejection-customer-${Date.now()}@example.com`;

      await request(app)
        .post('/api/auth/register')
        .send({
          email: customerEmail,
          password: 'RejectionTest123!@#'
        });

      const customerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password: 'RejectionTest123!@#'
        });

      const customerCookies = customerLogin.headers['set-cookie'];
      customerToken = customerCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Create payment
      const paymentResponse = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({
          amount: 9999.99,
          currency: 'USD',
          recipientAccount: 'US64SVBKUS6S3300958879',
          recipientSwift: 'SVBKUS6S',
          recipientName: 'Suspicious Account',
          reference: 'High risk transaction'
        });

      rejectedTransactionId = paymentResponse.body.transaction.id;

      // Login as employee
      const employeeLogin = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'verifier1@bank.com',
          password: 'BankEmployee2025!'
        });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];
    });

    test('Employee rejects suspicious payment', async () => {
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post(`/api/payments/employee/verify/${rejectedTransactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: false,
          verifierNotes: 'Suspicious activity detected. Customer documentation incomplete.'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('rejected');
      expect(response.body.transaction.status).toBe('rejected');
      expect(response.body.transaction.verificationStatus).toBe('rejected');
      expect(response.body.transaction.verifierNotes).toContain('Suspicious');
    });

    test('Rejected payment cannot be submitted to SWIFT', async () => {
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
          transactionIds: [rejectedTransactionId]
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.failed.length).toBe(1);
      expect(response.body.results.successful.length).toBe(0);
      expect(response.body.results.failed[0].reason).toContain('rejected');
    });

    test('Customer sees rejection status and notes', async () => {
      const response = await request(app)
        .get(`/api/payments/${rejectedTransactionId}`)
        .set('Cookie', `accessToken=${customerToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction.status).toBe('rejected');
    });
  });

  // ==========================================
  // BATCH SWIFT SUBMISSION TEST
  // ==========================================

  describe('Batch SWIFT Submission Workflow', () => {

    let employeeToken;
    let verifiedTransactionIds = [];

    beforeAll(async () => {
      // Login as employee
      const employeeLogin = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'verifier2@bank.com',
          password: 'BankEmployee2025!'
        });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Create multiple verified transactions
      for (let i = 0; i < 5; i++) {
        const customerEmail = `batch-customer-${i}-${Date.now()}@example.com`;

        await request(app)
          .post('/api/auth/register')
          .send({
            email: customerEmail,
            password: 'BatchTest123!@#'
          });

        const customerLogin = await request(app)
          .post('/api/auth/login')
          .send({
            email: customerEmail,
            password: 'BatchTest123!@#'
          });

        const customerCookies = customerLogin.headers['set-cookie'];
        const customerToken = customerCookies
          .find(cookie => cookie.startsWith('accessToken='))
          .split(';')[0]
          .split('=')[1];

        // Create payment
        const paymentResponse = await request(app)
          .post('/api/payments')
          .set('Cookie', `accessToken=${customerToken}`)
          .send({
            amount: 100.00 * (i + 1),
            currency: i % 2 === 0 ? 'USD' : 'EUR',
            recipientAccount: 'GB29NWBK60161331926819',
            recipientSwift: 'NWBKGB2L',
            recipientName: `Batch Recipient ${i}`,
            reference: `Batch payment ${i}`
          });

        const transactionId = paymentResponse.body.transaction.id;

        // Verify payment
        const csrfResponse = await request(app)
          .get('/api/csrf-token')
          .set('Cookie', `accessToken=${employeeToken}`)
          .set('Accept', 'application/json');

        const csrfToken = csrfResponse.body.csrfToken;

        await request(app)
          .post(`/api/payments/employee/verify/${transactionId}`)
          .set('Cookie', `accessToken=${employeeToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send({
            verified: true,
            verifierNotes: `Batch transaction ${i} verified`
          });

        verifiedTransactionIds.push(transactionId);
      }
    });

    test('Employee submits multiple verified transactions in batch', async () => {
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
          transactionIds: verifiedTransactionIds
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.successful.length).toBe(5);
      expect(response.body.results.failed.length).toBe(0);
      expect(response.body.summary.transactionCount).toBe(5);
      expect(response.body.summary.totalAmount).toBe(1500); // 100+200+300+400+500
      expect(response.body.summary.currencies).toBeDefined();
      expect(response.body.summary.currencies.USD).toBeDefined();
      expect(response.body.summary.currencies.EUR).toBeDefined();
    });

    test('All batch transactions have submitted_to_swift status', async () => {
      const response = await request(app)
        .get('/api/payments/employee/all?status=submitted_to_swift')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);

      // Check that all our transactions are in the list
      for (const txId of verifiedTransactionIds) {
        const transaction = response.body.transactions.find(tx => tx.id === txId);
        expect(transaction).toBeDefined();
        expect(transaction.status).toBe('submitted_to_swift');
      }
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  describe('Error Handling and Edge Cases', () => {

    let employeeToken;

    beforeAll(async () => {
      const employeeLogin = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'analyst@bank.com',
          password: 'BankEmployee2025!'
        });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];
    });

    test('Cannot verify non-existent transaction', async () => {
      const csrfResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken = csrfResponse.body.csrfToken;

      const response = await request(app)
        .post('/api/payments/employee/verify/txn_nonexistent_12345')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          verified: true,
          verifierNotes: 'Test'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('Cannot submit non-existent transaction to SWIFT', async () => {
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
          transactionIds: ['txn_nonexistent_12345', 'txn_nonexistent_67890']
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results.successful.length).toBe(0);
      expect(response.body.results.failed.length).toBe(2);
    });

    test('Cannot verify already verified transaction', async () => {
      // Create and verify a transaction
      const customerEmail = `double-verify-${Date.now()}@example.com`;

      await request(app)
        .post('/api/auth/register')
        .send({
          email: customerEmail,
          password: 'DoubleTest123!@#'
        });

      const customerLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerEmail,
          password: 'DoubleTest123!@#'
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
          amount: 200.00,
          currency: 'GBP',
          recipientAccount: 'GB82WEST12345698765432',
          recipientSwift: 'NWBKGB2L',
          recipientName: 'Test User',
          reference: 'Double verify test'
        });

      const transactionId = paymentResponse.body.transaction.id;

      // Verify first time
      const csrfResponse1 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken1 = csrfResponse1.body.csrfToken;

      await request(app)
        .post(`/api/payments/employee/verify/${transactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken1)
        .send({
          verified: true,
          verifierNotes: 'First verification'
        });

      // Try to verify again
      const csrfResponse2 = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      const csrfToken2 = csrfResponse2.body.csrfToken;

      const response = await request(app)
        .post(`/api/payments/employee/verify/${transactionId}`)
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('X-CSRF-Token', csrfToken2)
        .send({
          verified: false,
          verifierNotes: 'Second verification attempt'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');
    });
  });

  // ==========================================
  // SECURITY ISOLATION TESTS
  // ==========================================

  describe('Security Isolation Between Users', () => {

    test('Customer cannot access another customer\'s transactions', async () => {
      // Create two customers
      const customer1Email = `customer1-${Date.now()}@example.com`;
      const customer2Email = `customer2-${Date.now()}@example.com`;

      // Register and create payment for customer 1
      await request(app)
        .post('/api/auth/register')
        .send({
          email: customer1Email,
          password: 'Customer1Test123!@#'
        });

      const customer1Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: customer1Email,
          password: 'Customer1Test123!@#'
        });

      const customer1Cookies = customer1Login.headers['set-cookie'];
      const customer1Token = customer1Cookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      const payment1 = await request(app)
        .post('/api/payments')
        .set('Cookie', `accessToken=${customer1Token}`)
        .send({
          amount: 300.00,
          currency: 'USD',
          recipientAccount: 'US64SVBKUS6S3300958879',
          recipientSwift: 'SVBKUS6S',
          recipientName: 'Customer 1 Recipient',
          reference: 'Customer 1 payment'
        });

      const customer1TransactionId = payment1.body.transaction.id;

      // Register customer 2
      await request(app)
        .post('/api/auth/register')
        .send({
          email: customer2Email,
          password: 'Customer2Test123!@#'
        });

      const customer2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: customer2Email,
          password: 'Customer2Test123!@#'
        });

      const customer2Cookies = customer2Login.headers['set-cookie'];
      const customer2Token = customer2Cookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      // Customer 2 tries to access customer 1's transaction
      const response = await request(app)
        .get(`/api/payments/${customer1TransactionId}`)
        .set('Cookie', `accessToken=${customer2Token}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('denied');
    });

    test('Employee can view all customer transactions', async () => {
      const employeeLogin = await request(app)
        .post('/api/auth/employee/login')
        .send({
          email: 'manager@bank.com',
          password: 'BankEmployee2025!'
        });

      const employeeCookies = employeeLogin.headers['set-cookie'];
      const employeeToken = employeeCookies
        .find(cookie => cookie.startsWith('accessToken='))
        .split(';')[0]
        .split('=')[1];

      const response = await request(app)
        .get('/api/payments/employee/all')
        .set('Cookie', `accessToken=${employeeToken}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(response.body.transactions.length).toBeGreaterThan(0);
    });
  });
});
