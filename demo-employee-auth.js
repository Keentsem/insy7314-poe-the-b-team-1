/**
 * Employee Authentication & Authorization Demonstration
 * Tests employee-specific login, JWT validation, and role-based access control
 *
 * Run: node demo-employee-auth.js
 * Prerequisites: Server must be running on https://localhost:3003
 */

const https = require('https');

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('\n=== EMPLOYEE AUTHENTICATION & AUTHORIZATION DEMONSTRATION ===\n');

// Helper function to make authenticated request
function makeRequest(path, method, data = null, cookies = null) {
  return new Promise(resolve => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = jsonData.length;
    }

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = https.request(options, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          const setCookies = res.headers['set-cookie'] || [];

          resolve({
            statusCode: res.statusCode,
            data: response,
            cookies: setCookies,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { error: body || 'Invalid response' },
            cookies: [],
          });
        }
      });
    });

    req.on('error', e => {
      resolve({
        statusCode: 0,
        data: { error: e.message },
        cookies: [],
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test 1: Employee Login
async function testEmployeeLogin() {
  console.log('Test 1: Employee Authentication');
  console.log('----------------------------------------');

  const employeeCredentials = {
    email: 'manager@bank.com',
    password: 'Manager2025!Secure#9X', // Correct password from EMPLOYEE_CREDENTIALS.md
  };

  console.log(`Attempting login as: ${employeeCredentials.email}`);

  const result = await makeRequest('/api/auth/employee/login', 'POST', employeeCredentials);

  console.log(`Status Code: ${result.statusCode}`);
  console.log(`Response:`, result.data.message || result.data.error);

  if (result.statusCode === 200) {
    console.log(`✓ PASS - Employee authenticated successfully`);
    console.log(`  - Employee ID: ${result.data.user?.employeeId || 'N/A'}`);
    console.log(`  - Department: ${result.data.user?.department || 'N/A'}`);
    console.log(`  - Role: ${result.data.user?.role || 'N/A'}`);
    console.log(`  - HttpOnly cookies set: ${result.cookies.length > 0 ? 'Yes' : 'No'}`);

    if (result.cookies.length > 0) {
      result.cookies.forEach((cookie, idx) => {
        const isHttpOnly = cookie.toLowerCase().includes('httponly');
        const isSecure = cookie.toLowerCase().includes('secure');
        console.log(`  - Cookie ${idx + 1}: HttpOnly=${isHttpOnly}, Secure=${isSecure}`);
      });
    }

    return result.cookies.join('; ');
  } else {
    console.log(`✗ FAIL - Authentication failed`);
    console.log(`  - Error: ${result.data.message || result.data.error}`);
    return null;
  }
}

// Test 2: Access Employee-Only Endpoint
async function testEmployeeAuthorization(cookies) {
  console.log('\n\nTest 2: Employee Authorization (Role-Based Access Control)');
  console.log('----------------------------------------');

  if (!cookies) {
    console.log('⚠ Skipping - No authentication cookies available');
    return;
  }

  console.log('Attempting to access employee-only endpoint: /api/payments/employee/pending');

  const result = await makeRequest('/api/payments/employee/pending', 'GET', null, cookies);

  console.log(`Status Code: ${result.statusCode}`);

  if (result.statusCode === 200) {
    console.log(`✓ PASS - Employee authorized to access endpoint`);
    console.log(`  - Pending payments found: ${result.data.payments?.length || 0}`);
    console.log(`  - Role-based access control working`);
  } else {
    console.log(`✗ FAIL - Authorization failed`);
    console.log(`  - Error: ${result.data.message || result.data.error}`);
  }
}

// Test 3: Prevent Customer Access to Employee Endpoints
async function testCustomerRejection() {
  console.log('\n\nTest 3: Customer Access Prevention (Negative Test)');
  console.log('----------------------------------------');

  const customerCredentials = {
    email: 'john@example.com',
    password: 'SecurePassword123!',
  };

  console.log(`Attempting customer login as: ${customerCredentials.email}`);
  const loginResult = await makeRequest('/api/auth/login', 'POST', customerCredentials);

  if (loginResult.statusCode === 200) {
    const customerCookies = loginResult.cookies.join('; ');
    console.log(`✓ Customer authenticated successfully`);
    console.log(`\nAttempting to access employee endpoint with customer token...`);

    const accessResult = await makeRequest(
      '/api/payments/employee/pending',
      'GET',
      null,
      customerCookies
    );

    console.log(`Status Code: ${accessResult.statusCode}`);

    if (accessResult.statusCode === 403 || accessResult.statusCode === 401) {
      console.log(`✓ PASS - Customer correctly denied access to employee endpoint`);
      console.log(`  - Role-based access control preventing privilege escalation`);
      console.log(`  - Error message: ${accessResult.data.message || accessResult.data.error}`);
    } else {
      console.log(`✗ FAIL - Customer was able to access employee endpoint`);
      console.log(`  - SECURITY VULNERABILITY: Role-based access control not working`);
    }
  } else {
    console.log(`⚠ Note: Customer not registered, cannot test cross-role access`);
  }
}

// Test 4: Employee Profile Endpoint
async function testEmployeeProfile(cookies) {
  console.log('\n\nTest 4: Employee Profile Access');
  console.log('----------------------------------------');

  if (!cookies) {
    console.log('⚠ Skipping - No authentication cookies available');
    return;
  }

  console.log('Fetching employee profile data...');

  const result = await makeRequest('/api/auth/employee/profile', 'GET', null, cookies);

  console.log(`Status Code: ${result.statusCode}`);

  if (result.statusCode === 200) {
    console.log(`✓ PASS - Employee profile retrieved successfully`);
    console.log(`  - Name: ${result.data.user?.name || 'N/A'}`);
    console.log(`  - Email: ${result.data.user?.email || 'N/A'}`);
    console.log(`  - Department: ${result.data.user?.department || 'N/A'}`);
    console.log(`  - Employee ID: ${result.data.user?.employeeId || 'N/A'}`);
    console.log(`  - Password hash hidden: ${!result.data.user?.passwordHash ? 'Yes' : 'No'}`);
  } else {
    console.log(`✗ FAIL - Could not retrieve employee profile`);
    console.log(`  - Error: ${result.data.message || result.data.error}`);
  }
}

// Display security features
function showSecurityFeatures() {
  console.log('\n\n=== EMPLOYEE SECURITY FEATURES ===\n');

  console.log('1. Role-Based Access Control (RBAC):');
  console.log('   - Separate authentication endpoints for employees and customers');
  console.log('   - Employee-specific middleware validates role in JWT token');
  console.log('   - Prevents privilege escalation attacks');
  console.log('   - Code: server/middleware/employeeAuth.js\n');

  console.log('2. Employee Authentication Flow:');
  console.log('   - Dedicated login endpoint: /api/auth/employee/login');
  console.log('   - JWT tokens include role claim for authorization');
  console.log('   - HttpOnly cookies prevent XSS token theft');
  console.log('   - Code: server/routes/auth.js (employee section)\n');

  console.log('3. Protected Employee Endpoints:');
  console.log('   - /api/payments/employee/pending - View pending payments');
  console.log('   - /api/payments/employee/all - View all payments');
  console.log('   - /api/payments/employee/verify/:id - Approve/reject payments');
  console.log('   - /api/customers/employee/all - View customer list');
  console.log('   - All require valid employee JWT token\n');

  console.log('4. Audit Trail:');
  console.log('   - Employee actions tracked in payment records');
  console.log('   - verifiedBy field stores employee email');
  console.log('   - verifierNotes field stores verification notes');
  console.log('   - Provides accountability and compliance');
  console.log('   - Code: server/models/Payment.js\n');
}

// Run all tests
(async () => {
  const employeeCookies = await testEmployeeLogin();
  await testEmployeeAuthorization(employeeCookies);
  await testCustomerRejection();
  await testEmployeeProfile(employeeCookies);
  showSecurityFeatures();

  console.log('=== DEMONSTRATION COMPLETE ===');
  console.log('\nKey Code Locations:');
  console.log('- Employee authentication: server/routes/auth.js (employee section)');
  console.log('- Employee middleware: server/middleware/employeeAuth.js');
  console.log('- Employee payments: server/routes/payments.js (employee section)');
  console.log('- Employee dashboard: client/src/components/employee/EmployeeDashboard.jsx');
  console.log('- Customer routes: server/routes/customers.js\n');
})();
