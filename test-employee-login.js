/**
 * Employee Login Test Script
 * Tests all employee accounts to verify unique passwords work
 */

const https = require('https');

// Disable SSL verification for localhost testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const HTTPS_PORT = 3003;
const BASE_URL = `https://localhost:${HTTPS_PORT}`;

// Test credentials
const employees = [
  {
    name: 'John Manager',
    email: 'manager@bank.com',
    password: 'Manager2025!Secure#9X',
    expectedDepartment: 'Management'
  },
  {
    name: 'Sarah Verifier',
    email: 'verifier1@bank.com',
    password: 'Verifier1@2025!Kp7',
    expectedDepartment: 'Verification'
  },
  {
    name: 'Mike Validator',
    email: 'verifier2@bank.com',
    password: 'Validator2#2025!Qw3',
    expectedDepartment: 'Verification'
  },
  {
    name: 'Emma Analyst',
    email: 'analyst@bank.com',
    password: 'Analyst2025@Secure!7M',
    expectedDepartment: 'Analytics'
  },
  {
    name: 'David Admin',
    email: 'admin@bank.com',
    password: 'Admin2025#Strong!5R',
    expectedDepartment: 'Administration'
  }
];

// Helper function to make HTTPS POST requests
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: HTTPS_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false // Allow self-signed certificates
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test employee login
async function testEmployeeLogin(employee) {
  try {
    console.log(`\n🔐 Testing login for: ${employee.name}`);
    console.log(`   Email: ${employee.email}`);

    const response = await makeRequest('/api/auth/employee/login', {
      email: employee.email,
      password: employee.password
    });

    if (response.statusCode === 200 && response.data.success) {
      console.log('   ✅ Login SUCCESSFUL');
      console.log(`   👤 User: ${response.data.user.name}`);
      console.log(`   🏢 Department: ${response.data.user.department}`);
      console.log(`   🆔 Employee ID: ${response.data.user.employeeId}`);

      // Verify department matches
      if (response.data.user.department === employee.expectedDepartment) {
        console.log('   ✅ Department verification PASSED');
      } else {
        console.log(`   ❌ Department mismatch: Expected ${employee.expectedDepartment}, got ${response.data.user.department}`);
      }

      return true;
    } else {
      console.log('   ❌ Login FAILED');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Message: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// Test wrong password
async function testWrongPassword() {
  try {
    console.log('\n🔐 Testing login with WRONG password');
    console.log('   Email: manager@bank.com');

    const response = await makeRequest('/api/auth/employee/login', {
      email: 'manager@bank.com',
      password: 'WrongPassword123!'
    });

    if (response.statusCode === 401 && !response.data.success) {
      console.log('   ✅ Correctly REJECTED invalid password');
      return true;
    } else {
      console.log('   ❌ SECURITY ISSUE: Invalid password was accepted!');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// Test non-existent employee
async function testNonExistentEmployee() {
  try {
    console.log('\n🔐 Testing login with NON-EXISTENT employee');
    console.log('   Email: fake@bank.com');

    const response = await makeRequest('/api/auth/employee/login', {
      email: 'fake@bank.com',
      password: 'SomePassword123!'
    });

    if (response.statusCode === 401 && !response.data.success) {
      console.log('   ✅ Correctly REJECTED non-existent employee');
      return true;
    } else {
      console.log('   ❌ SECURITY ISSUE: Non-existent employee was accepted!');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 EMPLOYEE LOGIN TEST SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Testing server at: ${BASE_URL}`);
  console.log('Make sure the server is running before running this test!\n');

  let passed = 0;
  let failed = 0;

  // Test all valid employee logins
  console.log('\n📋 Testing Valid Employee Logins');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const employee of employees) {
    const result = await testEmployeeLogin(employee);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test security scenarios
  console.log('\n\n🔒 Testing Security Scenarios');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const wrongPasswordResult = await testWrongPassword();
  if (wrongPasswordResult) passed++; else failed++;
  await new Promise(resolve => setTimeout(resolve, 500));

  const nonExistentResult = await testNonExistentEmployee();
  if (nonExistentResult) passed++; else failed++;

  // Final results
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! Employee login system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running first
console.log('Checking if server is running...');
makeRequest('/api/auth/employee/login', { email: 'test@test.com', password: 'test' })
  .then(() => {
    console.log('✅ Server is reachable\n');
    runTests();
  })
  .catch((error) => {
    console.error('❌ Cannot connect to server!');
    console.error(`   Error: ${error.message}`);
    console.error('\n⚠️  Please start the server first:');
    console.error('   cd server && npm start\n');
    process.exit(1);
  });
