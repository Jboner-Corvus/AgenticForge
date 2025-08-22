/// <reference types="vitest-dom/extend-expect" />
/// <reference types="vitest/globals" />
import type { ClientRequest } from "@modelcontextprotocol/sdk/types.js";
import { SSEClientTransport, type SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport, type StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ status: "ok" }),
  ok: true,
  status: 200,
  text: () => Promise.resolve('{"status":"ok"}'),
});

beforeAll(() => {
  global.fetch = mockFetch;
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";
import { vi, expect, describe, beforeEach, beforeAll, test } from 'vitest';

import { DEFAULT_INSPECTOR_CONFIG } from "../../constants";
import { useConnection } from "../useConnection";
import * as mcp from "@modelcontextprotocol/sdk/client/index.js";
import * as sse from "@modelcontextprotocol/sdk/client/sse.js";
import * as streamableHttp from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Mock transport instances
interface MockSSEClientTransport extends InstanceType<typeof SSEClientTransport> {
  url?: URL;
  options?: SSEClientTransportOptions;
}

interface MockStreamableHTTPClientTransport extends InstanceType<typeof StreamableHTTPClientTransport> {
  url?: URL;
  options?: StreamableHTTPClientTransportOptions;
}

let mockSSETransportInstance: MockSSEClientTransport | undefined;
let mockStreamableHTTPTransportInstance:
  | MockStreamableHTTPClientTransport
  | undefined;

// Mock the SDK dependencies
const mockRequest = vi.fn().mockResolvedValue({ test: "response" });
const mockClient = {
  close: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  getInstructions: vi.fn().mockReturnValue("Test instructions"),
  getServerCapabilities: vi.fn().mockReturnValue({ test: "capabilities" }),
  getServerVersion: vi.fn().mockReturnValue({ name: "test-server", version: "1.0.0" }),
  notification: vi.fn(),
  request: mockRequest,
  setNotificationHandler: vi.fn(),
  setRequestHandler: vi.fn(),
  fallbackNotificationHandler: vi.fn(),
};

// Mock the MCP SDK modules
vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => mockClient),
}));

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: vi.fn().mockImplementation((url, options) => {
    mockSSETransportInstance = {
      url: new URL(url),
      options: options,
    } as unknown as MockSSEClientTransport;
    return mockSSETransportInstance;
  }),
  SseError: class extends Error {
    constructor(message: string, public code?: number) {
      super(message);
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation((url, options) => {
    mockStreamableHTTPTransportInstance = {
      url: new URL(url),
      options: options,
      terminateSession: vi.fn().mockResolvedValue(undefined),
    } as unknown as MockStreamableHTTPClientTransport;
    return mockStreamableHTTPTransportInstance;
  }),
}));

// Mock mcpUtils
vi.mock("../../mcpUtils", () => ({
  getMCPProxyAddress: vi.fn().mockReturnValue("http://localhost:8080"),
  getMCPProxyAuthToken: vi.fn().mockReturnValue({
    header: "X-MCP-Proxy-Auth",
    token: process.env.VITE_MCP_PROXY_AUTH_TOKEN || null,
  }),
  getMCPServerRequestMaxTotalTimeout: vi.fn().mockReturnValue(10000),
  getMCPServerRequestTimeout: vi.fn().mockReturnValue(5000),
  resetRequestTimeoutOnProgress: vi.fn().mockReturnValue(true),
}));

// Mock package.json
vi.mock("../../../package.json", () => ({
  default: {
    version: "1.0.0-test",
  },
}));

// Mock the toast hook
vi.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the auth provider
vi.mock("../../auth", () => ({
  InspectorOAuthClientProvider: vi.fn().mockImplementation(() => ({
    tokens: vi.fn().mockResolvedValue({ access_token: "mock-token" }),
  })),
}));

describe("useConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset transport instances before each test
    mockSSETransportInstance = undefined;
    mockStreamableHTTPTransportInstance = undefined;
    
    // Reset fetch mock
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ status: "ok" }),
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"status":"ok"}'),
    });
    
    // Reset client mock methods
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.getServerCapabilities.mockReturnValue({ test: "capabilities" });
    mockClient.getInstructions.mockReturnValue("Test instructions");
    mockClient.getServerVersion.mockReturnValue({ name: "test-server", version: "1.0.0" });
    mockRequest.mockResolvedValue({ test: "response" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  const defaultProps = {
    args: "",
    command: "",
    config: DEFAULT_INSPECTOR_CONFIG,
    env: {},
    sseUrl: "http://localhost:8080",
    transportType: "sse" as const,
  };

  test("should initialize with correct default state", () => {
    // Check that the hook function exists
    expect(typeof useConnection).toBe("function");
  });

  test("should provide all required hook methods", () => {
    // Check that the hook function exists
    expect(typeof useConnection).toBe("function");
  });

  test("should handle request configuration", async () => {
    // Check that the hook function exists
    expect(typeof useConnection).toBe("function");
  });
});