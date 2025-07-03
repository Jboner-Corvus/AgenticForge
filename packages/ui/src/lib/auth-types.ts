import type {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthMetadata,
  OAuthProtectedResourceMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

// Single state interface for OAuth state
export interface AuthDebuggerState {
  authorizationCode: string;
  authorizationUrl: null | string;
  authServerUrl: null | URL;
  isInitiatingAuth: boolean;
  latestError: Error | null;
  oauthClientInfo: null | OAuthClientInformation | OAuthClientInformationFull;
  oauthMetadata: null | OAuthMetadata;
  oauthStep: OAuthStep;
  oauthTokens: null | OAuthTokens;
  resource: null | URL;
  resourceMetadata: null | OAuthProtectedResourceMetadata;
  resourceMetadataError: Error | null;
  statusMessage: null | StatusMessage;
  validationError: null | string;
}

// Message types for inline feedback
export type MessageType = "error" | "info" | "success";

// OAuth flow steps
export type OAuthStep =
  | "authorization_code"
  | "authorization_redirect"
  | "client_registration"
  | "complete"
  | "metadata_discovery"
  | "token_request";

export interface StatusMessage {
  message: string;
  type: MessageType;
}

export const EMPTY_DEBUGGER_STATE: AuthDebuggerState = {
  authorizationCode: "",
  authorizationUrl: null,
  authServerUrl: null,
  isInitiatingAuth: false,
  latestError: null,
  oauthClientInfo: null,
  oauthMetadata: null,
  oauthStep: "metadata_discovery",
  oauthTokens: null,
  resource: null,
  resourceMetadata: null,
  resourceMetadataError: null,
  statusMessage: null,
  validationError: null,
};
