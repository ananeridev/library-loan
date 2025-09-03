# Library Loans API 📚

Library loan system built with NestJS, Prisma, and PostgreSQL.

## TODO LIST

- [ ] E2E suite tests for controllers

- [ ] Create a article about it

- [ ] Make the e2e tests run on github CI

## Features

- ✅ **POST /loans** - Create a loan with business validations
- ✅ **PATCH /loans/:id/return** - Return a borrowed book
- ✅ **GET /catalog** - List catalog with availability status
- ✅ **Autenticação** via header `x-user-id`
- ✅ **CI/CD** configured with GitHub Actions
- ✅ **PostgreSQL** as database

## Business Rules

### Empréstimos
- [x] Maximum of 2 active loans per user

- [x] Block when stock is depleted (copies in use ≥ copiesTotal) → 409 Conflict

- [x] Book existence validation → 404 Not Found
# library-loan
