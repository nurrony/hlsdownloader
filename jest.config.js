export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/utils/index.js', '/src/lib/index.js', '/tests/mocks/'],
  coverageReporters: ['clover', 'html', 'text'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: ['**/tests/specs/**/*.spec.js', '**/tests/**/*.js'],
  verbose: true,
};
