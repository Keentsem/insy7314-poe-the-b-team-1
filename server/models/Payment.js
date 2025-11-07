/**
 * Payment Model - MongoDB Schema
 * Stores payment/transaction information
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 10000
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'ZAR'],
    default: 'USD'
  },
  recipientAccount: {
    type: String,
    required: true,
    match: /^[A-Z0-9]{8,34}$/
  },
  recipientSwift: {
    type: String,
    required: true,
    match: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
  },
  recipientName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  reference: {
    type: String,
    maxlength: 35
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'submitted_to_swift', 'completed', 'failed'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  verifiedByEmail: {
    type: String
  },
  verifierNotes: {
    type: String,
    maxlength: 500
  },
  verifiedAt: {
    type: Date
  },
  submittedToSwiftAt: {
    type: Date
  },
  swiftReference: {
    type: String
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for display ID
paymentSchema.virtual('displayId').get(function() {
  return this.transactionId.substring(0, 12).toUpperCase();
});

// Method to verify payment
paymentSchema.methods.verify = async function(employeeId, employeeEmail, approved, notes) {
  this.status = approved ? 'verified' : 'rejected';
  this.verifiedBy = employeeId;
  this.verifiedByEmail = employeeEmail;
  this.verifierNotes = notes;
  this.verifiedAt = new Date();

  if (!approved) {
    this.failureReason = notes;
  }

  await this.save();
  return this;
};

// Method to submit to SWIFT
paymentSchema.methods.submitToSwift = async function() {
  this.status = 'submitted_to_swift';
  this.submittedToSwiftAt = new Date();
  this.swiftReference = `SWIFT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  await this.save();
  return this;
};

// Method to complete payment
paymentSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();

  await this.save();
  return this;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
