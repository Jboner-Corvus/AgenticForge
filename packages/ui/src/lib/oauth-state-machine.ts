import type { OAuthProtectedResourceMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

import {
  discoverOAuthMetadata,
  discoverOAuthProtectedResourceMetadata,
  exchangeAuthorization,
  registerClient,
  selectResourceURL,
  startAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { OAuthMetadataSchema } from "@modelcontextprotocol/sdk/shared/auth.js";

import type { AuthDebuggerState, OAuthStep } from "./auth-types";

import { DebugInspectorOAuthClientProvider } from "./auth";

export interface StateMachineContext {
  provider: DebugInspectorOAuthClientProvider;
  serverUrl: string;
  state: AuthDebuggerState;
  updateState: (updates: Partial<AuthDebuggerState>) => void;
}

export interface StateTransition {
  canTransition: (context: StateMachineContext) => Promise<boolean>;
  execute: (context: StateMachineContext) => Promise<void>;
}

// State machine transitions
export const oauthTransitions: Record<OAuthStep, StateTransition> = {
  authorization_code: {
    canTransition: async () => true,
    execute: async (context) => {
      if (
        !context.state.authorizationCode ||
        context.state.authorizationCode.trim() === ""
      ) {
        context.updateState({
          validationError: "You need to provide an authorization code",
        });
        // Don't advance if no code
        throw new Error("Authorization code required");
      }
      context.updateState({
        oauthStep: "token_request",
        validationError: null,
      });
    },
  },

  authorization_redirect: {
    canTransition: async (context) =>
      !!context.state.oauthMetadata && !!context.state.oauthClientInfo,
    execute: async (context) => {
      const metadata = context.state.oauthMetadata;
      if (!metadata) {
        throw new Error("OAuth metadata is missing");
      }
      const clientInformation = context.state.oauthClientInfo;
      if (!clientInformation) {
        throw new Error("OAuth client information is missing");
      }

      let scope: string | undefined = undefined;
      if (metadata.scopes_supported) {
        scope = metadata.scopes_supported.join(" ");
      }

      const { authorizationUrl, codeVerifier } = await startAuthorization(
        context.serverUrl,
        {
          clientInformation,
          metadata,
          redirectUrl: context.provider.redirectUrl,
          resource: context.state.resource ?? undefined,
          scope,
        },
      );

      context.provider.saveCodeVerifier(codeVerifier);
      context.updateState({
        authorizationUrl: authorizationUrl.toString(),
        oauthStep: "authorization_code",
      });
    },
  },

  client_registration: {
    canTransition: async (context) => !!context.state.oauthMetadata,
    execute: async (context) => {
      const metadata = context.state.oauthMetadata;
      if (!metadata) {
        throw new Error("OAuth metadata is missing");
      }
      const clientMetadata = context.provider.clientMetadata;

      // Prefer scopes from resource metadata if available
      const scopesSupported =
        context.state.resourceMetadata?.scopes_supported ||
        metadata.scopes_supported;
      // Add all supported scopes to client registration
      if (scopesSupported) {
        (clientMetadata as { scope?: string }).scope = scopesSupported.join(" ");
      }

      const fullInformation = await registerClient(context.serverUrl, {
        clientMetadata,
        metadata,
      });

      context.provider.saveClientInformation(fullInformation);
      context.updateState({
        oauthClientInfo: fullInformation,
        oauthStep: "authorization_redirect",
      });
    },
  },

  complete: {
    canTransition: async () => false,
    execute: async () => {
      // No-op for complete state
    },
  },

  metadata_discovery: {
    canTransition: async () => true,
    execute: async (context) => {
      // Default to discovering from the server's URL
      let authServerUrl = new URL("/", context.serverUrl);
      let resourceMetadata: null | OAuthProtectedResourceMetadata = null;
      let resourceMetadataError: Error | null = null;
      try {
        resourceMetadata = await discoverOAuthProtectedResourceMetadata(
          context.serverUrl,
        );
        if (resourceMetadata?.authorization_servers?.length) {
          authServerUrl = new URL(resourceMetadata.authorization_servers[0]);
        }
      } catch (e) {
        if (e instanceof Error) {
          resourceMetadataError = e;
        } else {
          resourceMetadataError = new Error(String(e));
        }
      }

      const resource: undefined | URL = await selectResourceURL(
        context.serverUrl,
        context.provider,
        // we default to null, so swap it for undefined if not set
        resourceMetadata ?? undefined,
      );

      const metadata = await discoverOAuthMetadata(authServerUrl);
      if (!metadata) {
        throw new Error("Failed to discover OAuth metadata");
      }
      const parsedMetadata = await OAuthMetadataSchema.parseAsync(metadata);
      context.provider.saveServerMetadata(parsedMetadata);
      context.updateState({
        authServerUrl,
        oauthMetadata: parsedMetadata,
        oauthStep: "client_registration",
        resource,
        resourceMetadata,
        resourceMetadataError,
      });
    },
  },

  token_request: {
    canTransition: async (context) => {
      return (
        !!context.state.authorizationCode &&
        !!context.provider.getServerMetadata() &&
        !!(await context.provider.clientInformation())
      );
    },
    execute: async (context) => {
      const codeVerifier = context.provider.codeVerifier();
      const metadata = context.state.oauthMetadata;
      if (!metadata) {
        throw new Error("OAuth metadata is missing");
      }
      const clientInformation = await context.provider.clientInformation();
      if (!clientInformation) {
        throw new Error("OAuth client information is missing");
      }

      const tokens = await exchangeAuthorization(context.serverUrl, {
        authorizationCode: context.state.authorizationCode,
        clientInformation,
        codeVerifier,
        metadata,
        redirectUri: context.provider.redirectUrl,
        resource: context.state.resource ?? undefined,
      });

      context.provider.saveTokens(tokens);
      context.updateState({
        oauthStep: "complete",
        oauthTokens: tokens,
      });
    },
  },
};

export class OAuthStateMachine {
  constructor(
    private serverUrl: string,
    private updateState: (updates: Partial<AuthDebuggerState>) => void,
  ) {}

  async executeStep(state: AuthDebuggerState): Promise<void> {
    const provider = new DebugInspectorOAuthClientProvider(this.serverUrl);
    const context: StateMachineContext = {
      provider,
      serverUrl: this.serverUrl,
      state,
      updateState: this.updateState,
    };

    const transition = oauthTransitions[state.oauthStep];
    if (!(await transition.canTransition(context))) {
      throw new Error(`Cannot transition from ${state.oauthStep}`);
    }

    await transition.execute(context);
  }
}
