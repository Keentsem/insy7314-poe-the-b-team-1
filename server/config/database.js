/**
 * MongoDB Database Configuration
 * INSY7314 Task 3 - Persistent Storage
 */

const mongoose = require('mongoose');

// MongoDB connection string - using local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insy7314_payment_portal';

// Connection options
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Initialize employee accounts on first run
    const { initializeEmployeeAccounts } = require('../utils/seedData');
    await initializeEmployeeAccounts();

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('⚠️  Make sure MongoDB is running locally');
    console.error('   Install: https://www.mongodb.com/try/download/community');
    console.error('   Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');

    // Don't exit - allow app to run with warnings
    console.warn('⚠️  Running without database - data will not persist!');
    return null;
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = { connectDB, closeDB };
