import type { InspectorConfig } from "./configurationTypes";

// OAuth-related session storage keys
export const SESSION_KEYS = {
  AUTH_DEBUGGER_STATE: "mcp_auth_debugger_state",
  CLIENT_INFORMATION: "mcp_client_information",
  CODE_VERIFIER: "mcp_code_verifier",
  SERVER_METADATA: "mcp_server_metadata",
  SERVER_URL: "mcp_server_url",
  TOKENS: "mcp_tokens",
} as const;

// Generate server-specific session storage keys
export const getServerSpecificKey = (
  baseKey: string,
  serverUrl?: string,
): string => {
  if (!serverUrl) return baseKey;
  return `[${serverUrl}] ${baseKey}`;
};

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "error-connecting-to-proxy"
  | "error";

export const DEFAULT_MCP_PROXY_LISTEN_PORT = "6277";

/**
 * Default configuration for the MCP Inspector, Currently persisted in local_storage in the Browser.
 * Future plans: Provide json config file + Browser local_storage to override default values
 **/
export const DEFAULT_INSPECTOR_CONFIG: InspectorConfig = {
  MCP_PROXY_AUTH_TOKEN: {
    description:
      "Session token for authenticating with the MCP Proxy Server (displayed in proxy console on startup)",
    is_session_item: true,
    label: "Proxy Session Token",
    value: "",
  },
  MCP_PROXY_FULL_ADDRESS: {
    description:
      "Set this if you are running the MCP Inspector Proxy on a non-default address. Example: http://10.1.1.22:5577",
    is_session_item: false,
    label: "Inspector Proxy Address",
    value: "",
  },
  MCP_REQUEST_MAX_TOTAL_TIMEOUT: {
    description:
      "Maximum total timeout for requests sent to the MCP server (ms) (Use with progress notifications)",
    is_session_item: false,
    label: "Maximum Total Timeout",
    value: 60000,
  },
  MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: {
    description: "Reset timeout on progress notifications",
    is_session_item: false,
    label: "Reset Timeout on Progress",
    value: true,
  },
  MCP_SERVER_REQUEST_TIMEOUT: {
    description: "Timeout for requests to the MCP server (ms)",
    is_session_item: false,
    label: "Request Timeout",
    value: 10000,
  },
} as const;
