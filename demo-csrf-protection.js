/**
 * CSRF Protection Demonstration
 * Tests CSRF token validation on payment endpoints
 *
 * Run: node demo-csrf-protection.js
 * Prerequisites: Server must be running on https://localhost:3003
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n=== CSRF PROTECTION DEMONSTRATION ===\n');

// Test 1: Request without CSRF token (should fail with 403)
async function testWithoutToken() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      userId: 'test-user',
      amount: 100,
      recipientAccount: '1234567890'
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    console.log('Test 1: Payment request WITHOUT CSRF token');
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Expected: 403 Forbidden`);
      console.log(`Result: ${res.statusCode === 403 ? '✓ PASS' : '✗ FAIL'} - CSRF protection blocked request without token\n`);
      resolve();
    });

    req.on('error', (e) => {
      console.error(`✗ Error: ${e.message}\n`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

// Test 2: Request with invalid CSRF token (should fail with 403)
async function testWithInvalidToken() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      userId: 'test-user',
      amount: 100,
      recipientAccount: '1234567890'
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': 'invalid-fake-token-12345',
        'Cookie': '_csrf=another-fake-value'
      }
    };

    console.log('Test 2: Payment request with INVALID CSRF token');
    const req = https.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Expected: 403 Forbidden`);
      console.log(`Result: ${res.statusCode === 403 ? '✓ PASS' : '✗ FAIL'} - CSRF protection rejected invalid token\n`);
      resolve();
    });

    req.on('error', (e) => {
      console.error(`✗ Error: ${e.message}\n`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

// Test 3: Fetch valid CSRF token from server
async function testFetchToken() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/csrf-token',
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    console.log('Test 3: Fetching valid CSRF token from /api/csrf-token');
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`Status Code: ${res.statusCode}`);
          console.log(`CSRF Token received: ${response.csrfToken ? response.csrfToken.substring(0, 20) + '...' : 'None'}`);
          console.log(`Cookie header: ${res.headers['set-cookie'] ? 'Present' : 'Missing'}`);
          console.log(`Result: ${response.csrfToken && res.headers['set-cookie'] ? '✓ PASS' : '✗ FAIL'} - CSRF token endpoint working\n`);
        } catch (e) {
          console.log(`✗ FAIL - Invalid response format\n`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`✗ Error: ${e.message}\n`);
      resolve();
    });

    req.end();
  });
}

// Run all tests
(async () => {
  await testWithoutToken();
  await testWithInvalidToken();
  await testFetchToken();

  console.log('=== DEMONSTRATION COMPLETE ===');
  console.log('\nSecurity Implementation:');
  console.log('- CSRF tokens prevent unauthorized state-changing requests');
  console.log('- Double-submit cookie pattern validates token matches cookie');
  console.log('- Tokens are rotated after each transaction');
  console.log('\nCode Locations:');
  console.log('- Middleware: server/middleware/csrfProtection.js');
  console.log('- Client usage: client/src/components/PaymentForm.jsx:47-55');
  console.log('- API config: client/src/config/api.js:17-22');
  console.log('- Server endpoint: server/index.js:272\n');
})();
