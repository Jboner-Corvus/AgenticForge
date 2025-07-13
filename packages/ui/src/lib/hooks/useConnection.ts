import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import type { StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type {
  ClientNotification,
  ClientRequest,
  Progress,
  PromptReference,
  Request,
  ResourceReference,
  Result,
  ServerCapabilities,
} from "@modelcontextprotocol/sdk/types.js";

import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  SSEClientTransport,
  SseError,
} from "@modelcontextprotocol/sdk/client/sse.js";
import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  CancelledNotificationSchema,
  CompleteResultSchema,
  CreateMessageRequestSchema,
  ErrorCode,
  ListRootsRequestSchema,
  LoggingMessageNotificationSchema,
  McpError,
  PromptListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ToolListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { useState } from "react";
import { z } from "zod";

import type { InspectorConfig } from "../configurationTypes";
import type { ConnectionStatus } from "../constants";
import type { Notification } from "../notificationTypes";

import packageJson from "../../../package.json";
import { InspectorOAuthClientProvider } from "../auth";
import {
  getMCPProxyAddress,
  getMCPProxyAuthToken,
  getMCPServerRequestMaxTotalTimeout,
  getMCPServerRequestTimeout,
  resetRequestTimeoutOnProgress,
} from "../mcpUtils";
import { StdErrNotificationSchema } from "../notificationTypes";
import { useToast } from "./useToast";

interface UseConnectionOptions {
  args: string;
  bearerToken?: string;
  command: string;
  config: InspectorConfig;
  env: Record<string, string>;
  getRoots?: () => string[];
  headerName?: string;
  onNotification?: (notification: Notification) => void;
  onPendingRequest?: (request: Request, resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => void;
  onStdErrNotification?: (notification: Notification) => void;
  sseUrl: string;
  transportType: "sse" | "stdio" | "streamable-http";
}

export function useConnection({
  args,
  bearerToken,
  command,
  config,
  env,
  getRoots,
  headerName,
  onNotification,
  onPendingRequest,
  onStdErrNotification,
  sseUrl,
  transportType,
}: UseConnectionOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const { toast } = useToast();
  const [serverCapabilities, setServerCapabilities] =
    useState<null | ServerCapabilities>(null);
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [clientTransport, setClientTransport] = useState<null | Transport>(
    null,
  );
  const [requestHistory, setRequestHistory] = useState<
    { request: string; response?: string }[]
  >([]);
  const [completionsSupported, setCompletionsSupported] = useState(true);

  const pushHistory = (request: object, response?: unknown) => {
    setRequestHistory((prev) => [
      ...prev,
      {
        request: JSON.stringify(request),
        response: response !== undefined ? JSON.stringify(response) : undefined,
      },
    ]);
  };

  const makeRequest = async <T extends z.ZodTypeAny>(
    request: ClientRequest,
    schema: T,
    options?: { suppressToast?: boolean } & RequestOptions,
  ): Promise<z.output<T>> => {
    if (!mcpClient) {
      throw new Error("MCP client not connected");
    }
    try {
      const abortController = new AbortController();

      // prepare MCP Client request options
      const mcpRequestOptions: RequestOptions = {
        maxTotalTimeout:
          options?.maxTotalTimeout ??
          getMCPServerRequestMaxTotalTimeout(config),
        resetTimeoutOnProgress:
          options?.resetTimeoutOnProgress ??
          resetRequestTimeoutOnProgress(config),
        signal: options?.signal ?? abortController.signal,
        timeout: options?.timeout ?? getMCPServerRequestTimeout(config),
      };

      // If progress notifications are enabled, add an onprogress hook to the MCP Client request options
      // This is required by SDK to reset the timeout on progress notifications
      if (mcpRequestOptions.resetTimeoutOnProgress) {
        mcpRequestOptions.onprogress = (params: Progress) => {
          // Add progress notification to `Server Notification` window in the UI
          if (onNotification) {
            onNotification({
              method: "notification/progress",
              params,
            } as Notification);
          }
        };
      }

      let response;
      try {
        response = await mcpClient.request(
          request,
          schema,
          mcpRequestOptions,
        );

        pushHistory(request, response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        pushHistory(request, { error: errorMessage });
        throw error;
      }

      return response as z.output<T>;
    } catch (e: unknown) {
      if (!options?.suppressToast) {
        const errorString = (e as Error).message ?? String(e);
        toast({
          description: errorString,
          title: "Error",
          variant: "destructive",
        });
      }
      throw e;
    }
  };

  const handleCompletion = async (
    ref: PromptReference | ResourceReference,
    argName: string,
    value: string,
    signal?: AbortSignal,
  ): Promise<string[]> => {
    if (!mcpClient || !completionsSupported) {
      return [];
    }

    const request: ClientRequest = {
      method: "completion/complete",
      params: {
        argument: {
          name: argName,
          value,
        },
        ref,
      },
    };

    try {
      const response = await makeRequest(request, CompleteResultSchema, {
        signal,
        suppressToast: true,
      });
      return (response as z.output<typeof CompleteResultSchema>).completion.values || [];
    } catch (e: unknown) {
      // Disable completions silently if the server doesn't support them.
      // See https://github.com/modelcontextprotocol/specification/discussions/122
      if (e instanceof McpError && e.code === ErrorCode.MethodNotFound) {
        setCompletionsSupported(false);
        return [];
      }

      // Unexpected errors - show toast and rethrow
      toast({
        description: e instanceof Error ? e.message : String(e),
        title: "Error",
        variant: "destructive",
      });
      throw e;
    }
  };

  const sendNotification = async (notification: ClientNotification) => {
    if (!mcpClient) {
      const error = new Error("MCP client not connected");
      toast({
        description: error.message,
        title: "Error",
        variant: "destructive",
      });
      throw error;
    }

    try {
      await mcpClient.notification(notification);
      // Log successful notifications
      pushHistory(notification);
    } catch (e: unknown) {
      if (e instanceof McpError) {
        // Log MCP protocol errors
        pushHistory(notification, { error: e.message });
      }
      toast({
        description: e instanceof Error ? e.message : String(e),
        title: "Error",
        variant: "destructive",
      });
      throw e;
    }
  };

  const checkProxyHealth = async () => {
    try {
      const proxyHealthUrl = new URL(`${getMCPProxyAddress(config)}/health`);
      const { header: proxyAuthTokenHeader, token: proxyAuthToken } =
        getMCPProxyAuthToken(config);
      const headers: HeadersInit = {};
      if (proxyAuthToken) {
        headers[proxyAuthTokenHeader] = `Bearer ${proxyAuthToken}`;
      }
      const proxyHealthResponse = await fetch(proxyHealthUrl, { headers });
      const proxyHealth = await proxyHealthResponse.json();
      if (proxyHealth?.status !== "ok") {
        throw new Error("MCP Proxy Server is not healthy");
      }
    } catch (e: unknown) {
      console.error("Couldn't connect to MCP Proxy Server", e);
      throw e;
    }
  };

  const is401Error = (error: unknown): boolean => {
    return (
      (error instanceof SseError && error.code === 401) ||
      (error instanceof Error && error.message.includes("401")) ||
      (error instanceof Error && error.message.includes("Unauthorized"))
    );
  };

  const isProxyAuthError = (error: unknown): boolean => {
    return (
      error instanceof Error &&
      error.message.includes("Authentication required. Use the session token")
    );
  };

  const handleAuthError = async (error: unknown) => {
    if (is401Error(error)) {
      const serverAuthProvider = new InspectorOAuthClientProvider(sseUrl);

      const result = await auth(serverAuthProvider, { serverUrl: sseUrl });
      return result === "AUTHORIZED";
    }

    return false;
  };

  const connect = async (retryCount: number = 0) => {
    const client = new Client<Request, Notification, Result>(
      {
        name: "mcp-inspector",
        version: packageJson.version,
      },
      {
        capabilities: {
          roots: {
            listChanged: true,
          },
          sampling: {},
        },
      },
    );

    try {
      await checkProxyHealth();
    } catch (e: unknown) {
      setConnectionStatus("error-connecting-to-proxy");
      return;
    }

    try {
      // Inject auth manually instead of using SSEClientTransport, because we're
      // proxying through the inspector server first.
      const headers: HeadersInit = {};

      // Create an auth provider with the current server URL
      const serverAuthProvider = new InspectorOAuthClientProvider(sseUrl);

      // Use manually provided bearer token if available, otherwise use OAuth tokens
      const token =
        bearerToken || (await serverAuthProvider.tokens())?.access_token;
      if (token) {
        const authHeaderName = headerName || "Authorization";

        // Add custom header name as a special request header to let the server know which header to pass through
        if (authHeaderName.toLowerCase() !== "authorization") {
          headers[authHeaderName] = token;
          headers["x-custom-auth-header"] = authHeaderName;
        } else {
          headers[authHeaderName] = `Bearer ${token}`;
        }
      }

      // Add proxy authentication
      const { header: proxyAuthTokenHeader, token: proxyAuthToken } =
        getMCPProxyAuthToken(config);
      const proxyHeaders: HeadersInit = {};
      if (proxyAuthToken) {
        proxyHeaders[proxyAuthTokenHeader] = `Bearer ${proxyAuthToken}`;
      }

      // Create appropriate transport
      let transportOptions:
        | SSEClientTransportOptions
        | StreamableHTTPClientTransportOptions;

      let mcpProxyServerUrl;
      switch (transportType) {
        case "sse":
          mcpProxyServerUrl = new URL(`${getMCPProxyAddress(config)}/sse`);
          mcpProxyServerUrl.searchParams.append("url", sseUrl);
          transportOptions = {
            eventSourceInit: {
              fetch: (
                url: globalThis.Request | string | URL,
                init?: RequestInit,
              ) =>
                fetch(url, {
                  ...init,
                  headers: { ...headers, ...proxyHeaders },
                }),
            },
            requestInit: {
              headers: { ...headers, ...proxyHeaders },
            },
          };
          break;

        case "stdio":
          mcpProxyServerUrl = new URL(`${getMCPProxyAddress(config)}/stdio`);
          mcpProxyServerUrl.searchParams.append("command", command);
          mcpProxyServerUrl.searchParams.append("args", args);
          mcpProxyServerUrl.searchParams.append("env", JSON.stringify(env));
          transportOptions = {
            authProvider: serverAuthProvider,
            eventSourceInit: {
              fetch: (
                url: globalThis.Request | string | URL,
                init?: RequestInit,
              ) =>
                fetch(url, {
                  ...init,
                  headers: { ...headers, ...proxyHeaders },
                }),
            },
            requestInit: {
              headers: { ...headers, ...proxyHeaders },
            },
          };
          break;

        case "streamable-http":
          mcpProxyServerUrl = new URL(`${getMCPProxyAddress(config)}/mcp`);
          mcpProxyServerUrl.searchParams.append("url", sseUrl);
          transportOptions = {
            eventSourceInit: {
              fetch: (
                url: globalThis.Request | string | URL,
                init?: RequestInit,
              ) =>
                fetch(url, {
                  ...init,
                  headers: { ...headers, ...proxyHeaders },
                }),
            },
            // TODO these should be configurable...
            reconnectionOptions: {
              initialReconnectionDelay: 1000,
              maxReconnectionDelay: 30000,
              maxRetries: 2,
              reconnectionDelayGrowFactor: 1.5,
            },
            requestInit: {
              headers: { ...headers, ...proxyHeaders },
            },
          };
          break;
      }
      (mcpProxyServerUrl as URL).searchParams.append(
        "transportType",
        transportType,
      );

      if (onNotification) {
        [
          CancelledNotificationSchema,
          LoggingMessageNotificationSchema,
          ResourceUpdatedNotificationSchema,
          ResourceListChangedNotificationSchema,
          ToolListChangedNotificationSchema,
          PromptListChangedNotificationSchema,
        ].forEach((notificationSchema) => {
          client.setNotificationHandler(notificationSchema, (notification: unknown) => onNotification(notification as Notification));
        });

        client.fallbackNotificationHandler = (
          notification: unknown,
        ): Promise<void> => {
          onNotification(notification as Notification);
          return Promise.resolve();
        };
      }

      if (onStdErrNotification) {
        client.setNotificationHandler(
          StdErrNotificationSchema,
          (notification: unknown) =>
            onStdErrNotification(notification as Notification),
        );
      }

      let capabilities;
      try {
        const transport =
          transportType === "streamable-http"
            ? new StreamableHTTPClientTransport(mcpProxyServerUrl as URL, {
                sessionId: undefined,
                ...transportOptions,
              })
            : new SSEClientTransport(
                mcpProxyServerUrl as URL,
                transportOptions,
              );

        await client.connect(transport as Transport);

        setClientTransport(transport);

        capabilities = client.getServerCapabilities();
        const initializeRequest = {
          method: "initialize",
        };
        pushHistory(initializeRequest, {
          capabilities,
          instructions: client.getInstructions(),
          serverInfo: client.getServerVersion(),
        });
      } catch (error) {
        console.error(
          `Failed to connect to MCP Server via the MCP Inspector Proxy: ${mcpProxyServerUrl}:`,
          error,
        );

        // Check if it's a proxy auth error
        if (isProxyAuthError(error)) {
          toast({
            description:
              "Please enter the session token from the proxy server console in the Configuration settings.",
            title: "Proxy Authentication Required",
            variant: "destructive",
          });
          setConnectionStatus("error");
          return;
        }

        const shouldRetry = await handleAuthError(error);
        if (shouldRetry) {
          return connect(retryCount + 1);
        }
        if (is401Error(error)) {
          // Don't set error state if we're about to redirect for auth

          return;
        }
        throw error;
      }
      setServerCapabilities(capabilities ?? null);
      setCompletionsSupported(true); // Reset completions support on new connection

      if (onPendingRequest) {
        client.setRequestHandler(CreateMessageRequestSchema, (request: z.infer<typeof CreateMessageRequestSchema>) => {
          return new Promise<Result>((resolve, reject) => {
            const customResolve = (value: unknown) => {
              resolve(value as Result);
            };
            onPendingRequest(request, customResolve, reject);
          });
        });
      }

      if (getRoots) {
        client.setRequestHandler(ListRootsRequestSchema, async () => {
          return { roots: getRoots() };
        });
      }

      setMcpClient(client);
      setConnectionStatus("connected");
     
    } catch (e: unknown) {
      const error = e; // Explicitly assign to a new variable to ensure usage
      console.error(error);
      setConnectionStatus("error");
    }
  };

  const disconnect = async () => {
    if (transportType === "streamable-http")
      await (
        clientTransport as StreamableHTTPClientTransport
      ).terminateSession();
    await mcpClient?.close();
    const authProvider = new InspectorOAuthClientProvider(sseUrl);
    authProvider.clear();
    setMcpClient(null);
    setClientTransport(null);
    setConnectionStatus("disconnected");
    setCompletionsSupported(false);
    setServerCapabilities(null);
  };

  return {
    completionsSupported,
    connect,
    connectionStatus,
    disconnect,
    handleCompletion,
    makeRequest,
    mcpClient,
    requestHistory,
    sendNotification,
    serverCapabilities,
  };
}
