export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/utils/index.js', '/src/lib/index.js', '/tests/mocks/'],
  coverageReporters: ['clover', 'html', 'text'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/specs/**/*.spec.js', '**/tests/**/*.js'],
  verbose: true,
};
