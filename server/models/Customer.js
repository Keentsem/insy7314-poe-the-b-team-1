/**
 * Customer Model - MongoDB Schema
 * Stores customer account information
 */

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  passwordHash: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'checking', 'business'],
    default: 'checking'
  },
  accountBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
customerSchema.index({ email: 1 });
customerSchema.index({ accountNumber: 1 });

// Method to increment failed login attempts
customerSchema.methods.incrementFailedLogins = async function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();
  await this.save();
};

// Method to reset failed login attempts
customerSchema.methods.resetFailedLogins = async function() {
  this.failedLoginAttempts = 0;
  this.lastLogin = new Date();
  await this.save();
};

// Don't return password hash in JSON
customerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
