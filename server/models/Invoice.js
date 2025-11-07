/**
 * Invoice Model - MongoDB Schema
 * Generated automatically when employee verifies/accepts a payment
 */

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'EUR', 'GBP', 'ZAR'],
      default: 'USD',
    },
    recipientAccount: {
      type: String,
      required: true,
    },
    recipientSwift: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
    },
    // Employee who verified/approved the payment
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    verifiedByEmail: {
      type: String,
      required: true,
    },
    verifiedByName: {
      type: String,
      required: true,
    },
    verifierDepartment: {
      type: String,
    },
    verifierNotes: {
      type: String,
      maxlength: 500,
    },
    // Payment status at invoice generation
    paymentStatus: {
      type: String,
      enum: ['verified', 'submitted_to_swift', 'completed'],
      default: 'verified',
    },
    // SWIFT details (if submitted)
    swiftReference: {
      type: String,
    },
    submittedToSwiftAt: {
      type: Date,
    },
    // Invoice dates
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    // Invoice status
    status: {
      type: String,
      enum: ['generated', 'sent', 'paid', 'cancelled'],
      default: 'generated',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ paymentId: 1 });
invoiceSchema.index({ transactionId: 1 });
invoiceSchema.index({ verifiedBy: 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for display
invoiceSchema.virtual('displayInvoiceNumber').get(function () {
  return this.invoiceNumber;
});

// Method to mark invoice as paid
invoiceSchema.methods.markAsPaid = async function () {
  this.status = 'paid';
  this.paidDate = new Date();
  await this.save();
  return this;
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
