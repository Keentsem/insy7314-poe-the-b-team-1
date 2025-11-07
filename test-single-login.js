/**
 * Quick test for single employee login with detailed debugging
 */

const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'https://localhost:3003';

// Test Sarah Verifier credentials
const testCredentials = {
  email: 'verifier1@bank.com',
  password: 'Verifier1@2025!Kp7'
};

// Step 1: Get CSRF token
async function getCSRFToken() {
  return new Promise((resolve, reject) => {
    console.log('📋 Step 1: Fetching CSRF token...');

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/csrf-token',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response:`, parsed);

          if (res.statusCode === 200 && parsed.csrfToken) {
            console.log('   ✅ CSRF token received\n');
            resolve({ token: parsed.csrfToken, cookies: res.headers['set-cookie'] });
          } else {
            console.log('   ❌ Failed to get CSRF token\n');
            reject(new Error('No CSRF token in response'));
          }
        } catch (err) {
          console.log('   ❌ Failed to parse response\n');
          reject(err);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Request error:', error.message, '\n');
      reject(error);
    });

    req.end();
  });
}

// Step 2: Attempt login
async function attemptLogin(csrfToken, cookies) {
  return new Promise((resolve, reject) => {
    console.log('🔐 Step 2: Attempting employee login...');
    console.log(`   Email: ${testCredentials.email}`);
    console.log(`   Password: ${testCredentials.password}`);

    const postData = JSON.stringify({
      email: testCredentials.email,
      password: testCredentials.password
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/auth/employee/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-CSRF-Token': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      },
      rejectUnauthorized: false
    };

    // Add cookies if provided
    if (cookies && cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    console.log(`   Request headers:`, options.headers);

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`   Response status: ${res.statusCode}`);
      console.log(`   Response headers:`, res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response body:`, JSON.stringify(parsed, null, 2));

          if (res.statusCode === 200 && parsed.success) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log(`   Employee: ${parsed.user.name}`);
            console.log(`   Department: ${parsed.user.department}`);
            console.log(`   Employee ID: ${parsed.user.employeeId}`);
            resolve(parsed);
          } else {
            console.log('\n❌ LOGIN FAILED!');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Message: ${parsed.message || 'Unknown error'}`);
            reject(new Error(parsed.message || 'Login failed'));
          }
        } catch (err) {
          console.log('\n❌ Failed to parse response');
          console.log(`   Raw data: ${data}`);
          reject(err);
        }
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 EMPLOYEE LOGIN DEBUG TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Get CSRF token
    const { token, cookies } = await getCSRFToken();

    // Step 2: Attempt login
    await attemptLogin(token, cookies);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);

  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ TEST FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
})();
