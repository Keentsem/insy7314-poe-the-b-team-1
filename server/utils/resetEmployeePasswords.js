/**
 * Reset Employee Passwords Script
 * Clears existing employees and re-seeds with new unique passwords
 */

const mongoose = require('mongoose');
const argon2 = require('argon2');
const Employee = require('../models/Employee');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insy7314_payment_portal';

// Updated employee accounts with unique passwords
const employeeAccounts = [
  {
    name: 'John Manager',
    email: 'manager@bank.com',
    password: 'Manager2025!Secure#9X',
    employeeId: 'EMP001',
    department: 'Management',
    permissions: ['view_payments', 'verify_payments', 'submit_swift', 'view_customers', 'manage_employees']
  },
  {
    name: 'Sarah Verifier',
    email: 'verifier1@bank.com',
    password: 'Verifier1@2025!Kp7',
    employeeId: 'EMP002',
    department: 'Verification',
    permissions: ['view_payments', 'verify_payments', 'submit_swift']
  },
  {
    name: 'Mike Validator',
    email: 'verifier2@bank.com',
    password: 'Validator2#2025!Qw3',
    employeeId: 'EMP003',
    department: 'Verification',
    permissions: ['view_payments', 'verify_payments', 'submit_swift']
  },
  {
    name: 'Emma Analyst',
    email: 'analyst@bank.com',
    password: 'Analyst2025@Secure!7M',
    employeeId: 'EMP004',
    department: 'Analytics',
    permissions: ['view_payments', 'view_customers', 'generate_reports']
  },
  {
    name: 'David Admin',
    email: 'admin@bank.com',
    password: 'Admin2025#Strong!5R',
    employeeId: 'EMP005',
    department: 'Administration',
    permissions: ['view_payments', 'verify_payments', 'submit_swift', 'view_customers', 'manage_employees', 'system_admin']
  }
];

async function resetEmployeePasswords() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing existing employee accounts...');
    const deleteResult = await Employee.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} employee accounts`);

    console.log('\n🔧 Creating employee accounts with unique passwords...');

    for (const account of employeeAccounts) {
      // Hash password with Argon2
      const passwordHash = await argon2.hash(account.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 4,
        parallelism: 2
      });

      // Create employee
      await Employee.create({
        name: account.name,
        email: account.email,
        passwordHash: passwordHash,
        employeeId: account.employeeId,
        department: account.department,
        role: 'employee',
        permissions: account.permissions,
        status: 'active'
      });

      console.log(`   ✓ Created: ${account.email}`);
    }

    console.log('\n✅ All employee accounts reset successfully!');
    console.log(`📊 Total employees: ${await Employee.countDocuments()}`);

    console.log('\n📝 Employee Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    employeeAccounts.forEach(emp => {
      console.log(`\n${emp.name} (${emp.department})`);
      console.log(`   Email:    ${emp.email}`);
      console.log(`   Password: ${emp.password}`);
      console.log(`   ID:       ${emp.employeeId}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting employee passwords:', error);
    process.exit(1);
  }
}

resetEmployeePasswords();
