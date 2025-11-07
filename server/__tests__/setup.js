/**
 * Jest Setup File for Server Tests
 * INSY7314 Task 3 - DevSecOps Pipeline
 *
 * This file runs before each test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.HTTPS_PORT = '3003';
process.env.HTTP_PORT = '3000';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random email
  generateEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,

  // Helper to generate random password
  generatePassword: () => `Test${Math.random().toString(36).substring(2, 10)}123!`,
};

// Suppress console output during tests (optional)
// Uncomment to reduce noise in test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});
