/**
 * Jest Configuration for Server Tests
 * INSY7314 Task 3 - DevSecOps Pipeline
 * Generates coverage reports for SonarQube integration
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration for SonarQube
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text', // Console output
    'text-summary', // Summary in console
    'html', // HTML report for viewing
    'lcov', // LCOV format for SonarQube
    'json-summary', // JSON summary
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/jest.config.js',
    '!**/config/**',
  ],

  // Coverage thresholds (60% for DevSecOps marks)
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Test match patterns
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Module path aliases (if needed)
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Transform configuration
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Maximum workers for parallel tests
  maxWorkers: '50%',

  // Test timeout (increased for integration tests)
  testTimeout: 30000,
};
