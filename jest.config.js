export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/utils/index.js', '/src/lib/index.js', '/tests/mocks/'],
  coverageReporters: ['clover', 'html', 'text'],

  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  errorOnDeprecated: true,
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {},
  testMatch: ['**/tests/specs/**/*.spec.js', '**/tests/**/*.js'],
  verbose: true,
};
