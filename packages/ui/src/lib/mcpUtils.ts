
import type { InspectorConfig } from "@/lib/configurationTypes";

export const getMCPProxyAddress = (config: InspectorConfig): string => {
  return (config.MCP_PROXY_FULL_ADDRESS?.value as string) || import.meta.env.VITE_MCP_PROXY_ADDRESS || "http://localhost:6277";
};

export const getMCPProxyAuthToken = (): { header: string; token: string | undefined } => {
  return {
    header: 'X-MCP-Proxy-Auth', // Hardcoded as it's not in InspectorConfig directly
    token: import.meta.env.VITE_MCP_PROXY_AUTH_TOKEN,
  };
};

export const getMCPServerRequestMaxTotalTimeout = (config: InspectorConfig): number => {
  return (config.MCP_REQUEST_MAX_TOTAL_TIMEOUT?.value as number) || 30000; // Default to 30 seconds
};

export const resetRequestTimeoutOnProgress = (config: InspectorConfig): boolean => {
  return (config.MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS?.value as boolean) || true;
};

export const getMCPServerRequestTimeout = (config: InspectorConfig): number => {
  return (config.MCP_SERVER_REQUEST_TIMEOUT?.value as number) || 10000; // Default to 10 seconds
};
