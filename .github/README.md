# GitHub Actions Workflows

This directory contains CI/CD workflows for the Library Loans project.

## 📋 Available Workflows

### 1. **test.yml** - Test Suite
Executes all types of tests:
- ✅ **Unit Tests**: Isolated component tests
- ✅ **Integration Tests**: Tests with real database
- ✅ **E2E Tests**: Complete end-to-end tests
- ✅ **Build**: Application compilation

**Triggers:**
- Push to `main` or `develop`
- Pull Requests to `main` or `develop`

### 2. **deploy.yml** - Deployment
Manages application deployment:
- 🚀 **Staging**: Automatic deployment on push to `develop`
- 🚀 **Production**: Manual deployment on push to `main`

### 3. **security.yml** - Security & Quality
Security and code quality analysis:
- 🔒 **Security Audit**: Vulnerability checks
- 📊 **Code Quality**: ESLint, Prettier, TypeScript
- 🔍 **Dependency Review**: Dependency analysis

### 4. **coverage.yml** - Code Coverage
Generates coverage reports:
- 📈 **Code Coverage**: Detailed coverage reports
- 📊 **Codecov Integration**: Automatic upload to Codecov

## 🚀 How to Use

### Run Tests Locally
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

### Check Workflow Status
1. Go to the **Actions** tab on GitHub
2. View the status of each workflow
3. Click on a job to see detailed logs

### Manual Deployment
1. Push to the `main` branch
2. Go to the **Actions** tab
3. Manually run the "Deploy to Production" workflow

## 🔧 Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/library_loans_test
NODE_VERSION=18
```

### GitHub Secrets (if needed)
Configure the following secrets in the repository:
- `DATABASE_URL_PROD`: Production database URL
- `DEPLOY_TOKEN`: Deployment token
- `SLACK_WEBHOOK`: Webhook for notifications

## 📊 Reports

### Code Coverage
- **Unit Tests**: `coverage/unit/`
- **Integration Tests**: `coverage/integration/`
- **E2E Tests**: `coverage/e2e/`

### Artifacts
Workflows generate the following artifacts:
- Build artifacts (1 day retention)
- Coverage reports (7 days retention)
- Test results (7 days retention)

## 🐛 Troubleshooting

### Tests Failing
1. Check logs in the Actions tab
2. Run tests locally
3. Verify database configuration

### Deployment Failing
1. Check if all tests passed
2. Confirm environment variables are configured
3. Check deployment logs

### Performance Issues
1. E2E tests run sequentially to avoid conflicts
2. Use npm cache to speed up builds
3. Consider self-hosted runners for large projects

## 📝 Important Notes

- **E2E Tests**: Run sequentially (`maxWorkers: 1`) to avoid data conflicts
- **Database**: PostgreSQL 13 is used for all tests
- **Node.js**: Version 18 is used in all workflows
- **Cache**: npm dependencies are cached for better performance
