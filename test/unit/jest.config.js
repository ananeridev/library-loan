module.exports = {
  displayName: 'Unit Tests',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    '../src/**/*.(t|j)s',
    '!../src/**/*.spec.ts',
    '!../src/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../coverage/unit',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
};
