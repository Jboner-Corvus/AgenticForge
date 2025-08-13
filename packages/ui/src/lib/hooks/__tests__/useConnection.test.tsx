
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

beforeEach(() => {
  mockFetch.mockClear();
});
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";
import { vi, expect, describe, beforeEach, beforeAll, test, type Mock, type MockedFunction } from 'vitest';

import { DEFAULT_INSPECTOR_CONFIG } from "../../constants";
import { useConnection } from "../useConnection";

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

let mockSSETransportInstance: MockSSEClientTransport;
let mockStreamableHTTPTransportInstance: MockStreamableHTTPClientTransport;

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  return {
    Client: vi.fn().mockImplementation(() => {
      return mockClient;
    }),
  };
});

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => {
  const actual = vi.importActual<typeof import("@modelcontextprotocol/sdk/client/sse.js")>("@modelcontextprotocol/sdk/client/sse.js");
  return {
    ...actual,
    SSEClientTransport: vi.fn(function(url: string, options: SSEClientTransportOptions) {
      mockSSETransportInstance = {
        url: new URL(url),
        options: options,
        start: vi.fn(),
        close: vi.fn(),
        _reconnectionOptions: undefined,
        finishAuth: vi.fn(),
        send: vi.fn(),
        setProtocolVersion: vi.fn(),
      } as unknown as InstanceType<typeof SSEClientTransport>;
      return mockSSETransportInstance;
    }) as unknown as typeof SSEClientTransport,
  };
});

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn(function(url: string, options: StreamableHTTPClientTransportOptions) {
    mockStreamableHTTPTransportInstance = {
      url: new URL(url),
      options: options,
      start: vi.fn(),
      close: vi.fn(),
      _url: new URL(url),
      _reconnectionOptions: undefined,
      _authThenStart: vi.fn(),
      _commonHeaders: undefined,
      _startOrAuthSse: vi.fn(),
      _getNextReconnectionDelay: vi.fn(),
      _normalizeHeaders: vi.fn(),
      _scheduleReconnection: vi.fn(),
      // Add other missing properties as vi.fn() or undefined if needed
    } as unknown as InstanceType<typeof StreamableHTTPClientTransport>;
    return mockStreamableHTTPTransportInstance;
  }),
}));

vi.mock("@modelcontextprotocol/sdk/client/auth.js", () => ({
  auth: vi.fn().mockResolvedValue("AUTHORIZED"),
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
  const defaultProps = {
    args: "",
    command: "",
    config: DEFAULT_INSPECTOR_CONFIG,
    env: {},
    sseUrl: "http://localhost:8080",
    transportType: "sse" as const,
  };

  describe("Request Configuration", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
    });

    test("uses the default config values in makeRequest", async () => {
      const { result } = renderHook(() => useConnection(defaultProps));

      // Connect the client
      await act(async () => {
        await result.current.connect();
      });

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

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
      const { result } = renderHook(() => useConnection(defaultProps));

      // Connect the client
      await act(async () => {
        await result.current.connect();
      });

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

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

    const mockRequest: ClientRequest = {
      method: "ping",
      params: {},
    };

    const mockSchema = z.object({
      test: z.string(),
    });

    await expect(
      result.current.makeRequest(mockRequest, mockSchema),
    ).rejects.toThrow("MCP client not connected");
  });

  describe("URL Port Handling", () => {
    

    test("preserves HTTPS port number when connecting", async () => {
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com:8443/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

            expect(mockSSETransportInstance.url?.toString()).toContain(
        "url=https%3A%2F%2Fexample.com%3A8443%2Fapi",
      );
    });

    test("preserves HTTP port number when connecting", async () => {
      const props = {
        ...defaultProps,
        sseUrl: "http://localhost:3000/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

            expect(mockSSETransportInstance.url?.toString()).toContain(
        "url=http%3A%2F%2Flocalhost%3A3000%2Fapi",
      );
    });

    test("uses default port for HTTPS when not specified", async () => {
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com/api",
        transportType: "sse" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

            expect(mockSSETransportInstance.url?.toString()).toContain("url=https%3A%2F%2Fexample.com%2Fapi");
      expect(mockSSETransportInstance.url?.toString()).not.toContain("%3A443");
    });

    test("preserves port number in streamable-http transport", async () => {
      const props = {
        ...defaultProps,
        sseUrl: "https://example.com:8443/api",
        transportType: "streamable-http" as const,
      };

      const { result } = renderHook(() => useConnection(props));

      await act(async () => {
        await result.current.connect();
      });

      const call = mockStreamableHTTPTransportInstance.url;
      expect(call?.toString()).toContain(
        "url=https%3A%2F%2Fexample.com%3A8443%2Fapi",
      );
    });
  });

  describe("Proxy Authentication Headers", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      vi.stubEnv('VITE_MCP_PROXY_AUTH_TOKEN', 'test-proxy-token');
      // Reset the mock transport objects
      if (mockSSETransportInstance) {
        mockSSETransportInstance.url = undefined;
        mockSSETransportInstance.options = undefined;
      }
      if (mockStreamableHTTPTransportInstance) {
        mockStreamableHTTPTransportInstance.url = undefined;
        mockStreamableHTTPTransportInstance.options = undefined;
      }
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("sends X-MCP-Proxy-Auth header when proxy auth token is configured", async () => {
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
      expect(mockSSETransportInstance.options).toBeDefined();
      expect(mockSSETransportInstance.options?.requestInit).toBeDefined();

      expect(mockSSETransportInstance.options?.requestInit?.headers).toHaveProperty(
        "X-MCP-Proxy-Auth",
        "Bearer test-proxy-token",
      );
      expect(mockSSETransportInstance?.options?.eventSourceInit?.fetch).toBeDefined();

      // Verify the fetch function includes the proxy auth header
      const mockFetch = mockSSETransportInstance.options?.eventSourceInit?.fetch;
      const testUrl = "http://test.com";
      await mockFetch?.(testUrl, {
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "text/event-stream",
        },
        mode: "cors",
        redirect: "follow",
        signal: new AbortController().signal,
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(
        ((global.fetch as Mock).mock.calls[0][1] as RequestInit)?.headers,
      ).toHaveProperty("X-MCP-Proxy-Auth", "Bearer test-proxy-token");
      expect((global.fetch as Mock).mock.calls[1][0]).toBe(testUrl);
      expect(
        ((global.fetch as Mock).mock.calls[1][1] as RequestInit)?.headers,
      ).toHaveProperty("X-MCP-Proxy-Auth", "Bearer test-proxy-token");
    });

    test("does NOT send Authorization header for proxy auth", async () => {
      const propsWithProxyAuth = {
        ...defaultProps,
        config: {
          ...DEFAULT_INSPECTOR_CONFIG,
          proxyAuthToken: "test-proxy-token",
        },
      };

      const { result } = renderHook(() => useConnection(propsWithProxyAuth));

      await act(async () => {
        await result.current.connect();
      });

      // Check that Authorization header is NOT used for proxy auth
      expect(mockSSETransportInstance.options?.requestInit?.headers).not.toHaveProperty(
        "Authorization",
        "Bearer test-proxy-token",
      );
    });

    test("preserves server Authorization header when proxy auth is configured", async () => {
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
      const headers = mockSSETransportInstance.options?.requestInit?.headers;
      expect(headers).toHaveProperty(
        "Authorization",
        "Bearer server-auth-token",
      );
      expect(headers).toHaveProperty(
        "X-MCP-Proxy-Auth",
        "Bearer test-proxy-token",
      );
    });

    test("sends X-MCP-Proxy-Auth in health check requests", async () => {
      const fetchMock = global.fetch as MockedFunction<typeof fetch>;
      fetchMock.mockClear();

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

      // Find the health check call
      const healthCheckCall = fetchMock.mock.calls.find(
        (call: Parameters<typeof global.fetch>) => (call[0] as URL).pathname === "/health",
      );

      expect(healthCheckCall).toBeDefined();
      expect(healthCheckCall![1]?.headers).toHaveProperty(
        "X-MCP-Proxy-Auth",
        "Bearer test-proxy-token",
      );
    });

    test("works correctly with streamable-http transport", async () => {
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
      expect(mockStreamableHTTPTransportInstance.options).toBeDefined();
      expect(
        mockStreamableHTTPTransportInstance.options?.requestInit?.headers,
      ).toHaveProperty("X-MCP-Proxy-Auth", "Bearer test-proxy-token");
    });
  });
});
