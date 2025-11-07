/**
 * Check what's actually in the database
 */

const mongoose = require('mongoose');
const argon2 = require('argon2');
const Employee = require('../models/Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insy7314_payment_portal';

// Test passwords
const testPasswords = {
  'manager@bank.com': 'Manager2025!Secure#9X',
  'verifier1@bank.com': 'Verifier1@2025!Kp7',
  'verifier2@bank.com': 'Validator2#2025!Qw3',
  'analyst@bank.com': 'Analyst2025@Secure!7M',
  'admin@bank.com': 'Admin2025#Strong!5R',
};

async function checkEmployees() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const employees = await Employee.find({}).sort({ email: 1 });

    console.log(`📊 Found ${employees.length} employees in database:\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const emp of employees) {
      console.log(`\n${emp.name}`);
      console.log(`  Email: ${emp.email}`);
      console.log(`  Employee ID: ${emp.employeeId}`);
      console.log(`  Department: ${emp.department}`);
      console.log(`  Status: ${emp.status}`);
      console.log(`  Password Hash: ${emp.passwordHash.substring(0, 50)}...`);

      // Test the password
      const expectedPassword = testPasswords[emp.email];
      if (expectedPassword) {
        try {
          const isValid = await argon2.verify(emp.passwordHash, expectedPassword);
          if (isValid) {
            console.log(`  ✅ Password verification: SUCCESS`);
            console.log(`  📝 Correct password: ${expectedPassword}`);
          } else {
            console.log(`  ❌ Password verification: FAILED`);
            console.log(`  📝 Expected password: ${expectedPassword}`);
            console.log(`  ⚠️  The password in database does NOT match expected password!`);
          }
        } catch (err) {
          console.log(`  ❌ Error verifying password: ${err.message}`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmployees();
