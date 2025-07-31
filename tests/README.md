# Test Suite

This directory contains all tests for the Gyllencreutz Family Heritage Website project.

## Structure

```
/tests
  /unit          # Unit tests
    /client      # Client-side unit tests
      /components
      /data
      /lib
      /utils
    /server      # Server-side unit tests
      /lib
      /routes
    /shared      # Shared unit tests
  /integration   # Integration tests
    /api
    /components
    /database
  /e2e           # End-to-end tests
    /workflows
  /mocks         # Mock data and utilities
    /client
    /server
  /utils         # Test utilities
  setup.ts       # Test setup configuration
```

## Test Types

### Unit Tests
Unit tests focus on testing individual functions, components, and modules in isolation. They should mock external dependencies and focus on the business logic.

### Integration Tests
Integration tests verify that multiple components work together correctly. These tests may interact with databases, APIs, or other external services.

### End-to-End Tests
End-to-end tests simulate real user interactions with the application. They typically run in a browser environment and test complete workflows.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Naming Convention
- Unit tests: `[filename].test.ts`
- Integration tests: `[filename].integration.test.ts`
- E2E tests: `[feature].e2e.test.ts`

### Test Structure
Tests should follow the AAA pattern:
1. **Arrange** - Set up the test data and conditions
2. **Act** - Execute the code under test
3. **Assert** - Verify the results

### Mocking
Use the mock utilities in `/tests/mocks` for consistent test data. Mock external services and APIs to ensure tests are reliable and fast.