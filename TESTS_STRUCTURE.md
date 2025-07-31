# Test Structure Guidelines

This document outlines the test structure for the Gyllencreutz Family Heritage Website project.

## Directory Structure

```
/tests
  /unit
    /client
      /components
      /data
      /lib
      /utils
    /server
      /lib
      /routes
    /shared
  /integration
    /api
    /components
    /database
  /e2e
    /workflows
  /mocks
  /utils
```

## Test Organization Principles

1. **Separation by Type**: Tests are organized by type (unit, integration, e2e) as the primary categorization
2. **Mirror Source Structure**: Test file paths should mirror the source file paths
3. **Clear Naming Conventions**: 
   - Unit tests: `[filename].test.ts`
   - Integration tests: `[filename].integration.test.ts`
   - E2E tests: `[feature].e2e.test.ts`
4. **Consistent Test Data**: Shared mock data and utilities for maintainability

## Current Test Files Mapping

- `client/src/data/family-data.test.ts` → `tests/unit/client/data/family-data.test.ts`
- `client/src/lib/validation.test.ts` → `tests/unit/client/lib/validation.test.ts`
- `client/src/utils/generation-calculator.test.ts` → `tests/unit/client/utils/generation-calculator.test.ts`
- `server/lib/validation.test.ts` → `tests/unit/server/lib/validation.test.ts`
- `server/lib/performance-monitor.test.ts` → `tests/unit/server/lib/performance-monitor.test.ts`

## Test Categories

### Unit Tests
- Test individual functions and components in isolation
- Focus on business logic and data transformations
- Use mocks for external dependencies

### Integration Tests
- Test interactions between multiple components/modules
- API endpoint testing
- Database operations testing

### End-to-End Tests
- Full user workflow testing
- Browser-based testing with Playwright or similar tools
- Real API and database integration testing