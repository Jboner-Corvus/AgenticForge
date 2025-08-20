/// <reference types="vitest-dom/extend-expect" />
/// <reference types="vitest/globals" />
import type { ClientRequest } from "@modelcontextprotocol/sdk/types.js";
import { SSEClientTransport, type SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport, type StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ status: "ok" }),
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

// Mock the SDK dependencies
const mockRequest = vi.fn().mockResolvedValue({ test: "response" });
const mockClient = {
  close: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  getInstructions: vi.fn(),
  getServerCapabilities: vi.fn(),
  getServerVersion: vi.fn(),
  notification: vi.fn(),
  request: mockRequest,
  setNotificationHandler: vi.fn(),
  setRequestHandler: vi.fn(),
};

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

  describe("Request Configuration", () => {
    test("uses the default config values in makeRequest", async () => {
      vi.spyOn(mcp, "Client").mockImplementation(() => mockClient as unknown as mcp.Client);
      const { result } = renderHook(() => useConnection(defaultProps));

      // Connect the client
      await act(async () => {
        await result.current.connect();
      });

      // Wait for the client to be connected
      await waitFor(() => expect(result.current.mcpClient).not.toBeNull(), { timeout: 2000 });

      const mockRequest: ClientRequest = {
        method: "ping",
        params: {},
      };

      const mockSchema = z.object({
        test: z.string(),
      });

      await act(async () => {
        await result.current.makeRequest(mockRequest, mockSchema);
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        mockRequest,
        mockSchema,
        expect.objectContaining({
          maxTotalTimeout:
            DEFAULT_INSPECTOR_CONFIG.MCP_REQUEST_MAX_TOTAL_TIMEOUT.value,
          resetTimeoutOnProgress:
            DEFAULT_INSPECTOR_CONFIG.MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS
              .value,
          timeout: DEFAULT_INSPECTOR_CONFIG.MCP_SERVER_REQUEST_TIMEOUT.value,
        }),
      );
    });

    test("overrides the default config values when passed in options in makeRequest", async () => {
      vi.spyOn(mcp, "Client").mockImplementation(() => mockClient as unknown as mcp.Client);
      const { result } = renderHook(() => useConnection(defaultProps));

      // Connect the client
      await act(async () => {
        await result.current.connect();
      });

      // Wait for the client to be connected
      await waitFor(() => expect(result.current.mcpClient).not.toBeNull(), { timeout: 2000 });

      const mockRequest: ClientRequest = {
        method: "ping",
        params: {},
      };

      const mockSchema = z.object({
        test: z.string(),
      });

      await act(async () => {
        await result.current.makeRequest(mockRequest, mockSchema, {
          maxTotalTimeout: 2000,
          resetTimeoutOnProgress: false,
          timeout: 1000,
        });
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        mockRequest,
        mockSchema,
        expect.objectContaining({
          maxTotalTimeout: 2000,
          resetTimeoutOnProgress: false,
          timeout: 1000,
        }),
      );
    });
  });

  test("throws error when mcpClient is not connected", async () => {
    const { result } = renderHook(() => useConnection(defaultProps));
    
    // Make sure mockClient is properly set up
    expect(mockClient).toBeDefined();
    
    const mockRequest: ClientRequest = {
      method: "ping",
      params: {},
    };

    const mockSchema = z.object({
      test: z.string(),
    });

    // Ensure the client is not connected initially
    expect(result.current.mcpClient).toBeNull();

    await expect(
      result.current.makeRequest(mockRequest, mockSchema),
    ).rejects.toThrow("MCP client not connected");
  });

  describe("URL Port Handling", () => {
    test("preserves HTTPS port number when connecting", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com:8443/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

      // Check that the URL contains the correct host and port
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.url).toBeDefined();
      expect(mockSSETransportInstance!.url?.host).toBe("example.com:8443");
      expect(mockSSETransportInstance!.url?.pathname).toBe("/api");
    });

    test("preserves HTTP port number when connecting", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const props = {
        ...defaultProps,
        sseUrl: "http://localhost:3000/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

      // Check that the URL contains the correct host and port
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.url).toBeDefined();
      expect(mockSSETransportInstance!.url?.host).toBe("localhost:3000");
      expect(mockSSETransportInstance!.url?.pathname).toBe("/api");
    });

    test("uses default port for HTTPS when not specified", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

      // Check that the URL contains the correct host without explicit port
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.url).toBeDefined();
      expect(mockSSETransportInstance!.url?.host).toBe("example.com");
      expect(mockSSETransportInstance!.url?.pathname).toBe("/api");
    });

    test("preserves port number in streamable-http transport", async () => {
      vi.spyOn(streamableHttp, "StreamableHTTPClientTransport").mockImplementation((url, options) => {
        mockStreamableHTTPTransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockStreamableHTTPClientTransport;
        return mockStreamableHTTPTransportInstance;
      });
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com:8443/api",
        transportType: "streamable-http" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

      // Check that the URL contains the correct host and port
      expect(mockStreamableHTTPTransportInstance).toBeDefined();
      expect(mockStreamableHTTPTransportInstance!.url).toBeDefined();
      expect(mockStreamableHTTPTransportInstance!.url?.host).toBe("example.com:8443");
      expect(mockStreamableHTTPTransportInstance!.url?.pathname).toBe("/api");
    });
  });

  describe("Proxy Authentication Headers", () => {
    beforeEach(() => {
      vi.stubEnv('VITE_MCP_PROXY_AUTH_TOKEN', 'test-proxy-token');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("sends X-MCP-Proxy-Auth header when proxy auth token is configured", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const propsWithProxyAuth = {
        ...defaultProps,
        config: {
          ...DEFAULT_INSPECTOR_CONFIG,
          MCP_PROXY_AUTH_TOKEN: {
            ...DEFAULT_INSPECTOR_CONFIG.MCP_PROXY_AUTH_TOKEN,
          },
        },
      };

      const { result } = renderHook(() => useConnection(propsWithProxyAuth));

      await act(async () => {
        await result.current.connect();
      });

      // Check that the transport was created with the correct headers
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.options).toBeDefined();
      expect(mockSSETransportInstance!.options?.requestInit).toBeDefined();

      expect(mockSSETransportInstance!.options?.requestInit?.headers).toHaveProperty(
        "X-MCP-Proxy-Auth",
        "Bearer test-proxy-token",
      );
    });

    test("does NOT send Authorization header for proxy auth", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const propsWithProxyAuth = {
        ...defaultProps,
        config: {
          ...DEFAULT_INSPECTOR_CONFIG,
          MCP_PROXY_AUTH_TOKEN: {
            ...DEFAULT_INSPECTOR_CONFIG.MCP_PROXY_AUTH_TOKEN,
          },
        },
      };

      const { result } = renderHook(() => useConnection(propsWithProxyAuth));

      await act(async () => {
        await result.current.connect();
      });

      // Check that Authorization header is NOT used for proxy auth
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.options).toBeDefined();
      expect(mockSSETransportInstance!.options?.requestInit?.headers).not.toHaveProperty(
        "Authorization",
        "Bearer test-proxy-token",
      );
    });

    test("preserves server Authorization header when proxy auth is configured", async () => {
      vi.spyOn(sse, "SSEClientTransport").mockImplementation((url, options) => {
        mockSSETransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockSSEClientTransport;
        return mockSSETransportInstance;
      });
      const propsWithBothAuth = {
        ...defaultProps,
        bearerToken: "server-auth-token",
        config: {
          ...DEFAULT_INSPECTOR_CONFIG,
          MCP_PROXY_AUTH_TOKEN: {
            ...DEFAULT_INSPECTOR_CONFIG.MCP_PROXY_AUTH_TOKEN,
          },
        },
      };

      const { result } = renderHook(() => useConnection(propsWithBothAuth));

      await act(async () => {
        await result.current.connect();
      });

      // Check that both headers are present and distinct
      expect(mockSSETransportInstance).toBeDefined();
      expect(mockSSETransportInstance!.options).toBeDefined();
      const headers = mockSSETransportInstance!.options?.requestInit?.headers;
      expect(headers).toHaveProperty(
        "Authorization",
        "Bearer server-auth-token",
      );
      expect(headers).toHaveProperty(
        "X-MCP-Proxy-Auth",
        "Bearer test-proxy-token",
      );
    });

    test("works correctly with streamable-http transport", async () => {
      vi.spyOn(streamableHttp, "StreamableHTTPClientTransport").mockImplementation((url, options) => {
        mockStreamableHTTPTransportInstance = {
          url: new URL(url),
          options: options,
        } as unknown as MockStreamableHTTPClientTransport;
        return mockStreamableHTTPTransportInstance;
      });
      const propsWithStreamableHttp = {
        ...defaultProps,
        config: {
          ...DEFAULT_INSPECTOR_CONFIG,
          MCP_PROXY_AUTH_TOKEN: {
            ...DEFAULT_INSPECTOR_CONFIG.MCP_PROXY_AUTH_TOKEN,
          },
        },
        transportType: "streamable-http" as const,
      };

      const { result } = renderHook(() =>
        useConnection(propsWithStreamableHttp),
      );

      await act(async () => {
        await result.current.connect();
      });

      // Check that the streamable HTTP transport was created with the correct headers
      expect(mockStreamableHTTPTransportInstance).toBeDefined();
      expect(mockStreamableHTTPTransportInstance!.options).toBeDefined();
      expect(
        mockStreamableHTTPTransportInstance!.options?.requestInit?.headers,
      ).toHaveProperty("X-MCP-Proxy-Auth", "Bearer test-proxy-token");
    });
  });
});