/**
 * Seed Data - Initialize Employee Accounts
 * Pre-populates 5 employee accounts on first run
 */

const argon2 = require('argon2');
const Employee = require('../models/Employee');

// 5 Pre-populated employee accounts
// SECURITY: Each employee has a unique, strong password
const employeeAccounts = [
  {
    name: 'John Manager',
    email: 'manager@bank.com',
    password: 'Manager2025!Secure#9X',
    employeeId: 'EMP001',
    department: 'Management',
    permissions: [
      'view_payments',
      'verify_payments',
      'submit_swift',
      'view_customers',
      'manage_employees',
    ],
  },
  {
    name: 'Sarah Verifier',
    email: 'verifier1@bank.com',
    password: 'Verifier1@2025!Kp7',
    employeeId: 'EMP002',
    department: 'Verification',
    permissions: ['view_payments', 'verify_payments', 'submit_swift'],
  },
  {
    name: 'Mike Validator',
    email: 'verifier2@bank.com',
    password: 'Validator2#2025!Qw3',
    employeeId: 'EMP003',
    department: 'Verification',
    permissions: ['view_payments', 'verify_payments', 'submit_swift'],
  },
  {
    name: 'Emma Analyst',
    email: 'analyst@bank.com',
    password: 'Analyst2025@Secure!7M',
    employeeId: 'EMP004',
    department: 'Analytics',
    permissions: ['view_payments', 'view_customers', 'generate_reports'],
  },
  {
    name: 'David Admin',
    email: 'admin@bank.com',
    password: 'Admin2025#Strong!5R',
    employeeId: 'EMP005',
    department: 'Administration',
    permissions: [
      'view_payments',
      'verify_payments',
      'submit_swift',
      'view_customers',
      'manage_employees',
      'system_admin',
    ],
  },
];

/**
 * Initialize employee accounts if they don't exist
 */
const initializeEmployeeAccounts = async () => {
  try {
    // Check if employees already exist
    const existingCount = await Employee.countDocuments();

    if (existingCount >= 5) {
      console.log('✅ Employee accounts already initialized');
      return;
    }

    console.log('🔧 Initializing employee accounts...');

    // Create employee accounts
    for (const account of employeeAccounts) {
      // Check if employee already exists
      const existing = await Employee.findOne({ email: account.email });

      if (existing) {
        console.log(`   ✓ Employee already exists: ${account.email}`);
        continue;
      }

      // Hash password with Argon2
      const passwordHash = await argon2.hash(account.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 4,
        parallelism: 2,
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
        status: 'active',
      });

      console.log(`   ✓ Created employee: ${account.email}`);
    }

    console.log('✅ All employee accounts initialized successfully');
    console.log(`📊 Total employees: ${await Employee.countDocuments()}`);
  } catch (error) {
    console.error('❌ Error initializing employee accounts:', error.message);
  }
};

module.exports = {
  initializeEmployeeAccounts,
};
