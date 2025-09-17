module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.integration.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    '../src/**/*.(t|j)s',
    '!../src/**/*.spec.ts',
    '!../src/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../coverage/integration',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
};
