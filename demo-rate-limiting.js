/**
 * Rate Limiting & Brute Force Protection Demonstration
 * Tests login attempt rate limiting (5 attempts per 15 minutes)
 *
 * Run: node demo-rate-limiting.js
 * Prerequisites: Server must be running on https://localhost:3003
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n=== RATE LIMITING & BRUTE FORCE PROTECTION DEMONSTRATION ===\n');

// Helper function to make login attempt
function attemptLogin(attemptNumber, email, password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/auth/login',
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
            attemptNumber,
            statusCode: res.statusCode,
            message: response.message || response.error || 'Unknown response'
          });
        } catch (e) {
          resolve({
            attemptNumber,
            statusCode: res.statusCode,
            message: body || 'Invalid response'
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        attemptNumber,
        statusCode: 0,
        message: `Error: ${e.message}`
      });
    });

    req.write(data);
    req.end();
  });
}

// Test: Multiple failed login attempts
async function testRateLimiting() {
  console.log('Test: Brute Force Attack Simulation');
  console.log('----------------------------------------');
  console.log('Attempting 7 failed logins (limit is 5 per 15 minutes)\n');

  const testEmail = 'attacker@example.com';
  const wrongPassword = 'WrongPassword123!';

  let rateLimitTriggered = false;
  let rateLimitAttempt = 0;

  for (let i = 1; i <= 7; i++) {
    const result = await attemptLogin(i, testEmail, wrongPassword);

    console.log(`Attempt ${result.attemptNumber}:`);
    console.log(`  Status Code: ${result.statusCode}`);
    console.log(`  Message: ${result.message}`);

    if (result.statusCode === 429) {
      console.log(`  🛡️  RATE LIMIT TRIGGERED!`);
      rateLimitTriggered = true;
      rateLimitAttempt = i;
    } else if (result.statusCode === 401) {
      console.log(`  ✓ Failed as expected (invalid credentials)`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n--- Analysis ---');
  if (rateLimitTriggered) {
    console.log(`✓ PASS - Rate limiting activated after attempt ${rateLimitAttempt}`);
    console.log(`  - Brute force attacks are blocked`);
    console.log(`  - Attacker must wait 15 minutes before retrying`);
    console.log(`  - Protects user accounts from credential stuffing`);
  } else {
    console.log(`✗ FAIL - Rate limiting did not activate`);
    console.log(`  - System may be vulnerable to brute force attacks`);
  }

  console.log('\nRate Limiting Configuration:');
  console.log('  - Max attempts: 5 failed logins');
  console.log('  - Time window: 15 minutes');
  console.log('  - Tracking: Per IP + User-Agent combination');
  console.log('  - Response: HTTP 429 Too Many Requests\n');
}

// Additional security features display
function showSecurityFeatures() {
  console.log('=== OTHER BRUTE FORCE PROTECTION FEATURES ===\n');

  console.log('1. Argon2id Password Hashing:');
  console.log('   - Memory-hard algorithm resistant to GPU/ASIC attacks');
  console.log('   - Automatic salt generation per password');
  console.log('   - Configurable time and memory costs');
  console.log('   - Code: server/utils/passwordUtils.js:8-19\n');

  console.log('2. Account Lockout (implemented in rate limiter):');
  console.log('   - Temporary lockout after 5 failed attempts');
  console.log('   - 15-minute cooldown period');
  console.log('   - Prevents automated credential stuffing');
  console.log('   - Code: server/middleware/rateLimiter.js:8-45\n');

  console.log('3. User-Agent + IP Tracking:');
  console.log('   - Limits based on IP address AND User-Agent');
  console.log('   - Prevents simple IP rotation bypasses');
  console.log('   - More granular attack detection');
  console.log('   - Code: server/middleware/rateLimiter.js:19\n');

  console.log('4. Password Strength Requirements:');
  console.log('   - Minimum 8 characters');
  console.log('   - Must include: uppercase, lowercase, number, special char');
  console.log('   - Validated on both client and server');
  console.log('   - Code: client/src/components/RegisterForm.jsx:28-37\n');
}

// Demonstrate password hashing (cannot reverse)
function demonstrateHashing() {
  console.log('=== PASSWORD HASHING DEMONSTRATION ===\n');

  console.log('Plaintext Password Storage (NEVER DO THIS):');
  console.log('  ✗ Password: "MyPassword123"');
  console.log('  ✗ Stored as: "MyPassword123"');
  console.log('  ✗ Database breach = all passwords exposed\n');

  console.log('Argon2id Hashed Storage (IMPLEMENTED):');
  console.log('  ✓ Password: "MyPassword123"');
  console.log('  ✓ Stored as: "$argon2id$v=19$m=65536,t=3,p=4$..."');
  console.log('  ✓ Unique salt per password');
  console.log('  ✓ Computationally expensive to crack');
  console.log('  ✓ Database breach = passwords still protected\n');

  console.log('Hash Properties:');
  console.log('  - One-way function (cannot reverse)');
  console.log('  - Same input always produces same hash');
  console.log('  - Tiny input change = completely different hash');
  console.log('  - GPU/ASIC resistant (memory-hard)\n');
}

// Run all demonstrations
(async () => {
  await testRateLimiting();
  showSecurityFeatures();
  demonstrateHashing();

  console.log('=== DEMONSTRATION COMPLETE ===');
  console.log('\nKey Code Locations:');
  console.log('- Rate limiting middleware: server/middleware/rateLimiter.js');
  console.log('- Password hashing: server/utils/passwordUtils.js');
  console.log('- Login route: server/routes/authRoutes.js:27-67');
  console.log('- Client validation: client/src/components/RegisterForm.jsx:28-37');
  console.log('- Password requirements: client/src/components/RegisterForm.jsx:97-103\n');
})();
