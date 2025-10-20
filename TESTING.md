# Testing Guide

This document provides comprehensive information about testing in the ERCS Intel Dashboard project.

## Overview

The project uses **Vitest** as the testing framework with:
- **React Testing Library** for component testing
- **jsdom** environment for DOM simulation
- **Mock support** for Firebase, AI flows, and Next.js features

## Table of Contents

- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

All testing dependencies are already installed:
- `vitest` - Test framework
- `@testing-library/react` - Component testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment
- `@vitejs/plugin-react` - React support for Vitest

### Configuration Files

- **`vitest.config.ts`** - Main Vitest configuration
- **`src/test-setup.ts`** - Global test setup and mocks

## Running Tests

### Available Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with UI (browser-based interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Watch Mode

Watch mode automatically re-runs tests when files change:

```bash
npm run test:watch
```

Press `h` in watch mode to see available commands.

### Coverage Report

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Writing Tests

### Test File Naming

Test files should be co-located with the code they test and follow these naming conventions:

- **Unit tests**: `filename.test.ts` or `filename.test.tsx`
- **Integration tests**: `filename.test.ts`
- **Component tests**: `ComponentName.test.tsx`

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyFunction', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should do something correctly', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Unit Test Example

Testing utility functions:

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toBe('bg-red-500 text-white');
  });

  it('should handle Tailwind conflicts', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4'); // Later value wins
  });
});
```

### Component Test Example

Testing React components:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MyComponent from './MyComponent';

vi.mock('@/app/actions', () => ({
  myAction: vi.fn(),
}));

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const { myAction } = await import('@/app/actions');
    (myAction as any).mockResolvedValue({ success: true });

    render(<MyComponent />);
    
    // Simulate user action
    const button = screen.getByRole('button');
    button.click();

    await waitFor(() => {
      expect(myAction).toHaveBeenCalled();
    });
  });
});
```

### Service Test Example

Testing services with mocked Firestore:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}));

describe('incident-service', () => {
  let mockFirestore: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFirestore = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          id: 'test-id',
          set: vi.fn(() => Promise.resolve()),
        })),
      })),
    };

    const { getFirestore } = await import('@/lib/firebase-admin');
    (getFirestore as any).mockResolvedValue(mockFirestore);
  });

  it('should add incident to Firestore', async () => {
    const { addIncident } = await import('./incident-service');
    
    await addIncident({ title: 'Test', ... });
    
    expect(mockFirestore.collection).toHaveBeenCalledWith('incidents');
  });
});
```

## Test Structure

### Project Test Organization

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts              # Unit tests
├── services/
│   ├── incident-service.ts
│   └── incident-service.test.ts   # Service tests
├── app/
│   ├── actions.ts
│   └── actions.test.ts            # Integration tests
└── components/
    └── dashboard/
        ├── ai-summary.tsx
        └── ai-summary.test.tsx    # Component tests
```

### Test Categories

1. **Unit Tests** - Test individual functions and utilities
   - Fast execution
   - No external dependencies
   - Example: `utils.test.ts`

2. **Service Tests** - Test service layer logic
   - Mock external dependencies (Firebase, APIs)
   - Test business logic
   - Example: `incident-service.test.ts`

3. **Integration Tests** - Test multiple components working together
   - Mock only external services
   - Test workflows
   - Example: `actions.test.ts`

4. **Component Tests** - Test React components
   - Use React Testing Library
   - Test user interactions
   - Example: `ai-summary.test.tsx`

## Mocking Strategies

### Global Mocks (test-setup.ts)

Global mocks are configured in `src/test-setup.ts`:

```typescript
// Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), ... }),
}));

// Firebase
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(() => null),
}));

// AI flows
vi.mock('@/ai/genkit', () => ({
  ai: { defineFlow: vi.fn(), ... },
}));
```

### Per-Test Mocks

Override global mocks in specific tests:

```typescript
vi.mock('@/app/actions', () => ({
  getSummary: vi.fn(),
}));

describe('MyTest', () => {
  it('should use mocked action', async () => {
    const { getSummary } = await import('@/app/actions');
    (getSummary as any).mockResolvedValue({ summary: 'Test' });
    
    // Use in test
  });
});
```

### Mocking Firestore

Example of mocking Firestore operations:

```typescript
const mockFirestore = {
  collection: vi.fn((name) => ({
    doc: vi.fn((id) => ({
      id: id || 'auto-id',
      get: vi.fn(() => Promise.resolve({
        exists: true,
        data: () => ({ field: 'value' }),
      })),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    })),
    where: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ docs: [] })),
        })),
      })),
    })),
  })),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
};
```

### Mocking Server Actions

```typescript
vi.mock('@/app/actions', () => ({
  getSummary: vi.fn((input) => 
    Promise.resolve({ summary: 'Test summary' })
  ),
  getLatestIncidents: vi.fn(() => 
    Promise.resolve([])
  ),
}));
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
describe('MyService', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
  });

  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ }); // Should not depend on test 1
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return empty array when no incidents exist', () => {});

// ❌ Bad
it('test 1', () => {});
```

### 3. Follow AAA Pattern

Arrange-Act-Assert:

```typescript
it('should add two numbers', () => {
  // Arrange
  const a = 5;
  const b = 3;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(8);
});
```

### 4. Test Both Success and Error Cases

```typescript
describe('fetchData', () => {
  it('should return data on success', async () => {
    // Test success case
  });

  it('should handle errors gracefully', async () => {
    // Test error case
  });
});
```

### 5. Use waitFor for Async Tests

```typescript
it('should load data asynchronously', async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### 6. Mock External Dependencies

Always mock:
- API calls
- Database operations
- AI/ML services
- Third-party libraries

```typescript
vi.mock('@/services/external-api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' })),
}));
```

### 7. Keep Tests Fast

- Mock expensive operations
- Avoid real network calls
- Use minimal test data
- Run tests in parallel (Vitest default)

### 8. Test User Behavior, Not Implementation

```typescript
// ✅ Good - Tests user-facing behavior
it('should display error message when submission fails', async () => {
  render(<Form />);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});

// ❌ Bad - Tests implementation details
it('should call setState with error', () => {
  // Testing internal state management
});
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

If you get module resolution errors:

```bash
# Check tsconfig.json paths match vitest.config.ts
# Ensure aliases are correctly configured
```

#### 2. Mock Not Working

```typescript
// Make sure to clear mocks
beforeEach(() => {
  vi.clearAllMocks();
});

// Import after mocking
vi.mock('./module');
const { fn } = await import('./module');
```

#### 3. Async Test Timeouts

Increase timeout for slow tests:

```typescript
it('slow test', async () => {
  // Test code
}, 10000); // 10 second timeout
```

#### 4. DOM Cleanup Issues

React Testing Library automatically cleans up after each test, but you can force cleanup:

```typescript
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### Debug Mode

Run tests with verbose output:

```bash
npm test -- --reporter=verbose
```

Run a single test file:

```bash
npm test src/lib/utils.test.ts
```

Run tests matching a pattern:

```bash
npm test -- --grep="incident"
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Coverage Goals

Target coverage levels:
- **Unit tests**: 80%+ coverage
- **Service layer**: 70%+ coverage
- **Integration tests**: 60%+ coverage
- **Components**: 70%+ coverage

Check current coverage:

```bash
npm run test:coverage
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Before deployment
- Scheduled nightly builds (if configured)

Ensure all tests pass before pushing code.

---

**Questions or issues?** Open an issue or contact the development team.
