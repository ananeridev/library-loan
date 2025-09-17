module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: [
    '../src/**/*.(t|j)s',
    '!../src/**/*.spec.ts',
    '!../src/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../coverage/e2e',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  testTimeout: 30000,
  // Executar testes E2E sequencialmente para evitar conflitos de dados
  maxWorkers: 1,
};
