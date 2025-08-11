import React from 'react';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock React.act for React 19 compatibility
if (!('act' in React)) {
  // @ts-expect-error - React 19 compatibility
  React.act = (callback: () => void) => {
    // In a real implementation, this would be more complex
    // For now, we'll just call the callback directly
    callback();
    // Return a mock object with a then method to prevent errors
    return {
      then: (resolve: () => void) => {
        resolve();
        return { catch: () => {} };
      }
    };
  };
}

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

process.env.VITE_MCP_PROXY_ADDRESS = "http://localhost:6277";

// Mock global fetch for tests that use it
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve({}),
  } as Response),
);