import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformation,
  OAuthClientMetadata,
  OAuthMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";

import {
  OAuthClientInformationSchema,
  OAuthTokensSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";

import { getServerSpecificKey, SESSION_KEYS } from "./constants";

export class InspectorOAuthClientProvider implements OAuthClientProvider {
  public readonly redirectUrl: string = `${window.location.origin}/oauth/callback`;

  clientMetadata: OAuthClientMetadata = {
    client_name: "MCP Inspector",
    client_uri: "https://github.com/modelcontextprotocol/inspector",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [this.redirectUrl],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };

  constructor(public serverUrl: string) {
    // Save the server URL to session storage
    sessionStorage.setItem(SESSION_KEYS.SERVER_URL, serverUrl);
  }

  clear() {
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.CLIENT_INFORMATION, this.serverUrl),
    );
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl),
    );
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.CODE_VERIFIER, this.serverUrl),
    );
  }

  async clientInformation() {
    const key = getServerSpecificKey(
      SESSION_KEYS.CLIENT_INFORMATION,
      this.serverUrl,
    );
    const value = sessionStorage.getItem(key);
    if (!value) {
      return undefined;
    }

    return await OAuthClientInformationSchema.parseAsync(JSON.parse(value));
  }

  codeVerifier() {
    const key = getServerSpecificKey(
      SESSION_KEYS.CODE_VERIFIER,
      this.serverUrl,
    );
    const verifier = sessionStorage.getItem(key);
    if (!verifier) {
      throw new Error("No code verifier saved for session");
    }

    return verifier;
  }

  redirectToAuthorization(authorizationUrl: URL) {
    window.location.href = authorizationUrl.href;
  }

  saveClientInformation(clientInformation: OAuthClientInformation) {
    const key = getServerSpecificKey(
      SESSION_KEYS.CLIENT_INFORMATION,
      this.serverUrl,
    );
    sessionStorage.setItem(key, JSON.stringify(clientInformation));
  }

  saveCodeVerifier(codeVerifier: string) {
    const key = getServerSpecificKey(
      SESSION_KEYS.CODE_VERIFIER,
      this.serverUrl,
    );
    sessionStorage.setItem(key, codeVerifier);
  }

  saveTokens(tokens: OAuthTokens) {
    const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl);
    sessionStorage.setItem(key, JSON.stringify(tokens));
  }

  async tokens() {
    const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl);
    const tokens = sessionStorage.getItem(key);
    if (!tokens) {
      return undefined;
    }

    return await OAuthTokensSchema.parseAsync(JSON.parse(tokens));
  }
}

// Overrides debug URL and allows saving server OAuth metadata to
// display in debug UI.
export class DebugInspectorOAuthClientProvider extends InspectorOAuthClientProvider {
  public readonly redirectUrl: string;

  constructor(serverUrl: string) {
    super(serverUrl);
    this.redirectUrl = `${window.location.origin}/oauth/callback/debug`;
  }

  clear() {
    super.clear();
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.SERVER_METADATA, this.serverUrl),
    );
  }

  getServerMetadata(): null | OAuthMetadata {
    const key = getServerSpecificKey(
      SESSION_KEYS.SERVER_METADATA,
      this.serverUrl,
    );
    const metadata = sessionStorage.getItem(key);
    if (!metadata) {
      return null;
    }
    return JSON.parse(metadata);
  }

  saveServerMetadata(metadata: OAuthMetadata) {
    const key = getServerSpecificKey(
      SESSION_KEYS.SERVER_METADATA,
      this.serverUrl,
    );
    sessionStorage.setItem(key, JSON.stringify(metadata));
  }
}
