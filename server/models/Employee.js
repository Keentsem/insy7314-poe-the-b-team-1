/**
 * Employee Model - MongoDB Schema
 * Stores employee account information (pre-populated)
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Management', 'Verification', 'Analytics', 'Administration']
  },
  role: {
    type: String,
    default: 'employee'
  },
  permissions: {
    type: [String],
    default: ['view_payments', 'verify_payments', 'submit_swift']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });

// Don't return password hash in JSON
employeeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
