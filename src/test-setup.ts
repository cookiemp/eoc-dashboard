import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<unknown>) => {
    const Component = vi.fn();
    return Component;
  },
}));

// Mock environment variables
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n';

// Mock Firestore globally
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(() => null),
}));

// Mock Genkit AI globally
vi.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: vi.fn((config, handler) => handler),
    definePrompt: vi.fn((config) => vi.fn()),
  },
}));

// Suppress console errors in tests unless needed
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
