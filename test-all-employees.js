/**
 * Test ALL employee logins to verify they work
 */

const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const employees = [
  {
    name: 'John Manager',
    email: 'manager@bank.com',
    password: 'Manager2025!Secure#9X'
  },
  {
    name: 'Sarah Verifier',
    email: 'verifier1@bank.com',
    password: 'Verifier1@2025!Kp7'
  },
  {
    name: 'Mike Validator',
    email: 'verifier2@bank.com',
    password: 'Validator2#2025!Qw3'
  },
  {
    name: 'Emma Analyst',
    email: 'analyst@bank.com',
    password: 'Analyst2025@Secure!7M'
  },
  {
    name: 'David Admin',
    email: 'admin@bank.com',
    password: 'Admin2025#Strong!5R'
  }
];

async function testLogin(employee) {
  return new Promise((resolve) => {
    // Get CSRF token first
    const csrfReq = https.request({
      hostname: 'localhost',
      port: 3003,
      path: '/api/csrf-token',
      method: 'GET',
      rejectUnauthorized: false
    }, (csrfRes) => {
      let csrfData = '';

      csrfRes.on('data', (chunk) => {
        csrfData += chunk;
      });

      csrfRes.on('end', () => {
        const csrfParsed = JSON.parse(csrfData);
        const csrfToken = csrfParsed.csrfToken;
        const cookies = csrfRes.headers['set-cookie'];

        // Now attempt login
        const postData = JSON.stringify({
          email: employee.email,
          password: employee.password
        });

        const loginReq = https.request({
          hostname: 'localhost',
          port: 3003,
          path: '/api/auth/employee/login',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'X-CSRF-Token': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookies ? cookies.join('; ') : ''
          },
          rejectUnauthorized: false
        }, (loginRes) => {
          let loginData = '';

          loginRes.on('data', (chunk) => {
            loginData += chunk;
          });

          loginRes.on('end', () => {
            try {
              const parsed = JSON.parse(loginData);
              resolve({
                employee,
                success: loginRes.statusCode === 200 && parsed.success,
                statusCode: loginRes.statusCode,
                data: parsed
              });
            } catch (err) {
              resolve({
                employee,
                success: false,
                statusCode: loginRes.statusCode,
                error: err.message,
                rawData: loginData
              });
            }
          });
        });

        loginReq.on('error', (error) => {
          resolve({
            employee,
            success: false,
            error: error.message
          });
        });

        loginReq.write(postData);
        loginReq.end();
      });
    });

    csrfReq.on('error', (error) => {
      resolve({
        employee,
        success: false,
        error: 'CSRF token fetch failed: ' + error.message
      });
    });

    csrfReq.end();
  });
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTING ALL EMPLOYEE LOGINS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  for (const employee of employees) {
    console.log(`Testing: ${employee.name} (${employee.email})`);
    console.log(`Password: ${employee.password}`);

    const result = await testLogin(employee);

    if (result.success) {
      console.log(`✅ SUCCESS - ${result.data.user.name} logged in`);
      console.log(`   Department: ${result.data.user.department}`);
      passed++;
    } else {
      console.log(`❌ FAILED - Status ${result.statusCode}`);
      console.log(`   Message: ${result.data?.message || result.error}`);
      if (result.rawData) {
        console.log(`   Raw: ${result.rawData.substring(0, 200)}`);
      }
      failed++;
    }
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed: ${passed}/5`);
  console.log(`❌ Failed: ${failed}/5`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed === 0) {
    console.log('🎉 ALL EMPLOYEES CAN LOGIN FROM BACKEND!\n');
    console.log('If login still fails in browser, the issue is:');
    console.log('  1. Browser caching - try hard refresh (Ctrl+Shift+R)');
    console.log('  2. Check browser console for exact error');
    console.log('  3. Check frontend is making request to correct endpoint\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
