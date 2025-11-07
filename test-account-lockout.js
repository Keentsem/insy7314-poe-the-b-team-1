/**
 * Account Lockout Test Script
 * Tests the progressive account lockout feature
 *
 * Expected behavior:
 * - 5 failed attempts should trigger 15 minute lockout
 * - Account should return 423 (Locked) status
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n=== ACCOUNT LOCKOUT TEST ===\n');

// Helper function to make login request
function attemptLogin(email, password, attemptNumber) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/auth/employee/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({
            attempt: attemptNumber,
            statusCode: res.statusCode,
            success: response.success,
            message: response.message,
            locked: response.locked || false,
            remainingMinutes: response.remainingMinutes
          });
        } catch (e) {
          resolve({
            attempt: attemptNumber,
            statusCode: res.statusCode,
            error: body || 'Invalid response'
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        attempt: attemptNumber,
        error: e.message
      });
    });

    req.write(data);
    req.end();
  });
}

// Main test function
async function testAccountLockout() {
  const testEmail = 'manager@bank.com';
  const wrongPassword = 'WrongPassword123!';

  console.log(`Testing account lockout for: ${testEmail}`);
  console.log('Using incorrect password to trigger failed attempts\n');

  console.log('Attempting 6 failed logins (lockout should occur after 5 attempts):\n');

  // Attempt 6 failed logins
  for (let i = 1; i <= 6; i++) {
    console.log(`Attempt ${i}:`);

    const result = await attemptLogin(testEmail, wrongPassword, i);

    if (result.statusCode === 429) {
      console.log(`  ⚠️  Status: ${result.statusCode} - Rate limit reached`);
      console.log(`  Note: Rate limiter is active. Wait 15 minutes or test with different account.\n`);
      break;
    } else if (result.statusCode === 423) {
      console.log(`  🔒 Status: ${result.statusCode} - ACCOUNT LOCKED!`);
      console.log(`  ✅ PASS - Account lockout triggered after ${i} attempts`);
      console.log(`  Message: ${result.message}`);
      if (result.remainingMinutes) {
        console.log(`  Unlock time: ${result.remainingMinutes} minutes`);
      }
      console.log('\n✅ Account lockout feature is working correctly!');
      return;
    } else if (result.statusCode === 401) {
      console.log(`  ❌ Status: ${result.statusCode} - Login failed (expected)`);
      console.log(`  Message: ${result.message}`);
    } else {
      console.log(`  ⚠️  Status: ${result.statusCode}`);
      console.log(`  Response:`, result);
    }

    console.log('');

    // Small delay between attempts
    if (i < 6) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n⚠️  Test did not trigger lockout after 6 attempts.');
  console.log('Possible reasons:');
  console.log('  - Rate limiter activated first (429 error)');
  console.log('  - Account was already locked');
  console.log('  - Lockout threshold is higher than expected');
}

// Run test
testAccountLockout().then(() => {
  console.log('\n=== TEST COMPLETE ===\n');
}).catch((error) => {
  console.error('Test error:', error);
});
