process.env.VITE_MCP_PROXY_ADDRESS = "http://localhost:6277";

// Mock global fetch for tests that use it
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;
