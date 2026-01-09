export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/utils/index.js', '/src/lib/index.js', '/tests/mocks/'],
  coverageReporters: ['clover', 'html', 'text'],

  coverageThreshold: {
    global: {
      lines: 65,
      branches: 65,
      functions: 65,
      statements: 65,
    },
  },
  errorOnDeprecated: true,
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/specs/**/*.spec.js', '**/tests/**/*.js'],
  verbose: true,
};
