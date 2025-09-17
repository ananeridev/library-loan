# Test Structure

This directory contains all project tests organized by type and responsibility.

## Folder Structure

```
test/
├── unit/                    # Unit tests
│   ├── jest.config.js      # Jest configuration for unit tests
│   └── README.md           # Unit tests documentation
├── integration/            # Integration tests
│   ├── jest.config.js      # Jest configuration for integration tests
│   ├── catalog.integration.spec.ts
│   ├── loans.integration.spec.ts
│   └── README.md           # Integration tests documentation
├── e2e/                    # End-to-end tests
│   ├── jest.config.js      # Jest configuration for e2e tests
│   ├── catalog.e2e-spec.ts # E2E tests for catalog
│   ├── loans.e2e-spec.ts   # E2E tests for loans
│   └── README.md           # E2E tests documentation
└── README.md               # This file
```

## Test Types

### Unit Tests (`src/` and `test/unit/`)
- **Location**: `src/**/*.spec.ts` and `test/unit/**/*.spec.ts`
- **Purpose**: Test individual code units (classes, methods, functions)
- **Characteristics**: 
  - Isolated and fast
  - Use mocks for external dependencies
  - Focus on specific business logic

### Integration Tests (`test/integration/`)
- **Location**: `test/integration/**/*.integration.spec.ts`
- **Purpose**: Test integration between different components
- **Characteristics**:
  - Test interactions between services and repositories
  - Use mocks for external dependencies (database, APIs)
  - Verify data flows between components

### End-to-End Tests (`test/e2e/`)
- **Location**: `test/e2e/**/*.e2e-spec.ts`
- **Purpose**: Test the complete application from user perspective
- **Characteristics**:
  - Test complete APIs
  - Use real database (or containerized)
  - Simulate real usage scenarios

## Test Commands

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run in watch mode
npm run test:unit:watch

# Run with coverage
npm run test:unit:cov
```

### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run in watch mode
npm run test:integration:watch

# Run with coverage
npm run test:integration:cov
```

### E2E Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run in watch mode
npm run test:e2e:watch

# Run with coverage
npm run test:e2e:cov
```

### All Tests
```bash
# Run all test types
npm run test:all

# Run all with coverage
npm run test:all:cov
```

## Naming Conventions

- **Unit Tests**: `*.spec.ts`
- **Integration Tests**: `*.integration.spec.ts`
- **E2E Tests**: `*.e2e-spec.ts`

## Configuration

Each test type has its own Jest configuration:
- `test/unit/jest.config.js` - Configuration for unit tests
- `test/integration/jest.config.js` - Configuration for integration tests
- `test/e2e/jest.config.js` - Configuration for e2e tests

## Code Coverage

Coverage reports are generated in:
- `coverage/unit/` - Unit tests coverage
- `coverage/integration/` - Integration tests coverage
- `coverage/e2e/` - E2E tests coverage

## Catalog Focus

Catalog tests include:

### Unit Tests
- `src/catalog/catalog.service.spec.ts` - Catalog service tests
- `src/catalog/catalog.controller.spec.ts` - Catalog controller tests

### Integration Tests
- `test/integration/catalog.integration.spec.ts` - Catalog integration tests

### E2E Tests
- `test/e2e/catalog.e2e-spec.ts` - Catalog end-to-end tests

These tests cover:
- Book availability calculation
- Active loans filtering
- Database integration
- Catalog APIs
- Loan and return scenarios
