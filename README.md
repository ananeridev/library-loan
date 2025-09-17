# Library Loans API 📚

Library loan system built with NestJS, Prisma, and PostgreSQL.

## ✅ COMPLETED FEATURES

- [x] **E2E suite tests for controllers** - Complete test coverage
- [x] **CI/CD with GitHub Actions** - Automated testing and deployment
- [x] **Comprehensive test suite** - Unit, Integration, and E2E tests

## Features

- ✅ **POST /loans** - Create a loan with business validations
- ✅ **PATCH /loans/:id/return** - Return a borrowed book
- ✅ **GET /catalog** - List catalog with availability status
- ✅ **Authentication** via header `x-user-id`
- ✅ **CI/CD** configured with GitHub Actions
- ✅ **PostgreSQL** as database
- ✅ **Complete test coverage** with real database integration

## Business Rules

### Loan
- [x] Maximum of 2 active loans per user
- [x] Block when stock is depleted (copies in use ≥ copiesTotal) → 409 Conflict
- [x] Book existence validation → 404 Not Found

## Testing

### Test Suite
- **Unit Tests**: Isolated component testing with mocked dependencies
- **Integration Tests**: Database integration testing with real PostgreSQL
- **E2E Tests**: Complete end-to-end testing with real database

### Running Tests
```bash
# All tests
npm run test:all

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### CI/CD
- **GitHub Actions**: Automated testing on every push and PR
- **Parallel Execution**: Unit and integration tests run in parallel
- **Sequential E2E**: E2E tests run sequentially to avoid data conflicts
- **Real Database**: PostgreSQL 13 used for integration and E2E tests
