import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
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