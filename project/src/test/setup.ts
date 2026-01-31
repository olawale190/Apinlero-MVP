import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Create a chainable mock for Supabase queries
const createChainableMock = (defaultReturn: any = { data: [], error: null }) => {
  const createChain = (): any => {
    const chain: any = {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
      delete: vi.fn(() => createChain()),
      eq: vi.fn(() => createChain()),
      neq: vi.fn(() => createChain()),
      gt: vi.fn(() => createChain()),
      gte: vi.fn(() => createChain()),
      lt: vi.fn(() => createChain()),
      lte: vi.fn(() => createChain()),
      like: vi.fn(() => createChain()),
      ilike: vi.fn(() => createChain()),
      is: vi.fn(() => createChain()),
      in: vi.fn(() => createChain()),
      contains: vi.fn(() => createChain()),
      containedBy: vi.fn(() => createChain()),
      order: vi.fn(() => createChain()),
      limit: vi.fn(() => createChain()),
      range: vi.fn(() => createChain()),
      single: vi.fn(() => Promise.resolve(defaultReturn)),
      maybeSingle: vi.fn(() => Promise.resolve(defaultReturn)),
      then: (resolve: any) => Promise.resolve(defaultReturn).then(resolve),
    };
    return chain;
  };
  return createChain();
};

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => createChainableMock()),
    functions: {
      invoke: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
  },
}));

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock localStorage with proper implementation
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
  }),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStorageStore).forEach(key => delete sessionStorageStore[key]);
  }),
};
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Reset storage before each test
beforeEach(() => {
  Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
  Object.keys(sessionStorageStore).forEach(key => delete sessionStorageStore[key]);
});
