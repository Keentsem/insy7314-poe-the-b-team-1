/**
 * Seed Invoices - Generate sample invoices for testing
 * This creates sample payments and invoices to demonstrate the system
 */

const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insy7314_payment_portal';

/**
 * Generate invoices for existing verified payments that don't have invoices yet
 */
async function generateInvoicesForExistingPayments() {
  try {
    console.log('\n📄 Generating invoices for existing verified payments...');

    // Find verified payments without invoices
    const verifiedPayments = await Payment.find({
      status: { $in: ['verified', 'submitted_to_swift', 'completed'] },
      verifiedBy: { $exists: true }
    });

    if (verifiedPayments.length === 0) {
      console.log('   No verified payments found');
      return 0;
    }

    let created = 0;

    for (const payment of verifiedPayments) {
      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({ paymentId: payment._id });

      if (existingInvoice) {
        console.log(`   ℹ️  Invoice already exists for payment ${payment.transactionId}`);
        continue;
      }

      // Get employee and customer details
      const employee = await Employee.findById(payment.verifiedBy);
      const customer = await Customer.findById(payment.customerId);

      if (!employee || !customer) {
        console.log(`   ⚠️  Missing employee or customer for payment ${payment.transactionId}`);
        continue;
      }

      // Generate invoice
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await Invoice.create({
        invoiceNumber,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        customerId: payment.customerId,
        customerEmail: payment.customerEmail,
        customerName: customer.name,
        amount: payment.amount,
        currency: payment.currency,
        recipientAccount: payment.recipientAccount,
        recipientSwift: payment.recipientSwift,
        recipientName: payment.recipientName,
        reference: payment.reference,
        verifiedBy: payment.verifiedBy,
        verifiedByEmail: payment.verifiedByEmail,
        verifiedByName: employee.name,
        verifierDepartment: employee.department,
        verifierNotes: payment.verifierNotes || '',
        paymentStatus: payment.status,
        swiftReference: payment.swiftReference,
        submittedToSwiftAt: payment.submittedToSwiftAt,
        invoiceDate: payment.verifiedAt,
        status: 'generated'
      });

      console.log(`   ✓ Created invoice ${invoiceNumber} for payment ${payment.transactionId}`);
      created++;
    }

    return created;

  } catch (error) {
    console.error('Error generating invoices:', error);
    return 0;
  }
}

/**
 * Create sample payments and invoices for demonstration
 */
async function createSamplePaymentsAndInvoices() {
  try {
    console.log('\n💰 Creating sample payments and invoices...');

    // Get customers and employees
    const customers = await Customer.find({ status: 'active' }).limit(3);
    const employees = await Employee.find({ status: 'active' }).limit(3);

    if (customers.length === 0 || employees.length === 0) {
      console.log('   ⚠️  No customers or employees found. Please seed those first.');
      return 0;
    }

    const samplePayments = [
      {
        amount: 1250.50,
        currency: 'USD',
        recipientAccount: 'GB29NWBK60161331926819',
        recipientSwift: 'NWBKGB2L',
        recipientName: 'Acme Corporation',
        reference: 'Invoice 2024-001'
      },
      {
        amount: 3450.00,
        currency: 'EUR',
        recipientAccount: 'DE89370400440532013000',
        recipientSwift: 'COBADEFF',
        recipientName: 'Global Tech GmbH',
        reference: 'Contract Payment'
      },
      {
        amount: 850.75,
        currency: 'GBP',
        recipientAccount: 'FR1420041010050500013M02606',
        recipientSwift: 'BNPAFRPP',
        recipientName: 'European Suppliers Ltd',
        reference: 'Services Q1 2024'
      },
      {
        amount: 2100.00,
        currency: 'USD',
        recipientAccount: 'US64SVBK00000000012345',
        recipientSwift: 'SVBKUS6S',
        recipientName: 'Silicon Valley Solutions',
        reference: 'Software License'
      },
      {
        amount: 5500.00,
        currency: 'ZAR',
        recipientAccount: 'ZA001234567890123456789',
        recipientSwift: 'ABSAZAJJ',
        recipientName: 'South African Traders',
        reference: 'Quarterly Payment'
      }
    ];

    let created = 0;

    for (let i = 0; i < samplePayments.length && i < customers.length; i++) {
      const customer = customers[i % customers.length];
      const employee = employees[i % employees.length];
      const paymentData = samplePayments[i];

      // Create payment
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const payment = await Payment.create({
        transactionId,
        customerId: customer._id,
        customerEmail: customer.email,
        ...paymentData,
        status: 'verified',
        verifiedBy: employee._id,
        verifiedByEmail: employee.email,
        verifierNotes: 'Approved - All documentation verified',
        verifiedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random time in last 14 days
      });

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await Invoice.create({
        invoiceNumber,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        customerId: customer._id,
        customerEmail: customer.email,
        customerName: customer.name,
        ...paymentData,
        verifiedBy: employee._id,
        verifiedByEmail: employee.email,
        verifiedByName: employee.name,
        verifierDepartment: employee.department,
        verifierNotes: payment.verifierNotes,
        paymentStatus: 'verified',
        invoiceDate: payment.verifiedAt,
        status: 'generated'
      });

      console.log(`   ✓ Created payment ${transactionId} and invoice ${invoiceNumber}`);
      console.log(`      Customer: ${customer.email}, Employee: ${employee.email}`);
      created++;

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return created;

  } catch (error) {
    console.error('Error creating sample payments:', error);
    return 0;
  }
}

/**
 * Main seeding function
 */
async function seedInvoices() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 INVOICE SEEDING SCRIPT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check existing invoices
    const existingCount = await Invoice.countDocuments();
    console.log(`📊 Current invoices in database: ${existingCount}`);

    // Strategy 1: Generate invoices for existing verified payments
    const generatedCount = await generateInvoicesForExistingPayments();

    // Strategy 2: Create sample payments with invoices if needed
    let sampleCount = 0;
    if (generatedCount === 0) {
      console.log('\n💡 No existing verified payments. Creating sample data...');
      sampleCount = await createSamplePaymentsAndInvoices();
    }

    const totalCreated = generatedCount + sampleCount;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEEDING COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Invoices created: ${totalCreated}`);
    console.log(`📊 Total invoices now: ${await Invoice.countDocuments()}`);
    console.log(`💳 Total payments: ${await Payment.countDocuments()}`);
    console.log(`👥 Total customers: ${await Customer.countDocuments()}`);
    console.log(`👔 Total employees: ${await Employee.countDocuments()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedInvoices();
}

module.exports = { seedInvoices };
