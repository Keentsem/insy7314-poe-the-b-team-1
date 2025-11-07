/**
 * Jest Configuration for Client Tests
 * INSY7314 Task 3 - DevSecOps Pipeline
 * Generates coverage reports for SonarQube integration
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

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
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],

  // Coverage thresholds (60% for DevSecOps marks)
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Test match patterns
  testMatch: ['**/__tests__/**/*.(test|spec).{js,jsx}', '**/?(*.)+(spec|test).{js,jsx}'],

  // Transform JSX and ES6+ code
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },

  // Module name mapper for CSS and assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Maximum workers
  maxWorkers: '50%',
};
