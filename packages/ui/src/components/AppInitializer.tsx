import { useCallback, useEffect, useState } from 'react';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { clientConfig } from '../config';
import { testServerHealth } from '../lib/api';
import { useCombinedStore as useStore } from '../store';
import { useLLMKeysStore } from '../store/llmKeysStore';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const AppInitializer = () => {
  const { translations } = useLanguage();
  const addDebugLog = useStore((state) => state.addDebugLog);
  const addMessage = useStore((state) => state.addMessage);
  const setAuthToken = useStore((state) => state.setAuthToken);
  const authToken = useStore((state) => state.authToken);
  const setServerHealthy = useStore((state) => state.setServerHealthy);
  const setSessionId = useStore((state) => state.setSessionId);
  const sessionId = useStore((state) => state.sessionId);
  const setTokenStatus = useStore((state) => state.setTokenStatus);
  const fetchAndDisplayToolCount = useStore(
    (state) => state.fetchAndDisplayToolCount,
  );

  // LLM Keys store
  const fetchKeys = useLLMKeysStore((state) => state.fetchKeys);

  // Add detailed error state management
  const [initError, setInitError] = useState<string | null>(null);
  const [initStage, setInitStage] = useState<string>('starting');
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  const initializeSession = useCallback(() => {
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [INFO] ${translations.newSessionGenerated}: ${currentSessionId}`,
      );
    } else {
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [INFO] ${translations.sessionRetrieved}: ${currentSessionId}`,
      );
    }
    setSessionId(currentSessionId);
  }, [addDebugLog, setSessionId, translations]);

  const checkServerHealth = useCallback(async () => {
    setInitStage('server_health_check');
    // Server health check starting
    addDebugLog(
      `[${new Date().toLocaleTimeString()}] [INFO] ${translations.checkingServerHealth}`,
    );

    try {
      const startTime = Date.now();
      const healthy = await testServerHealth(authToken, sessionId);
      const duration = Date.now() - startTime;

      setServerHealthy(healthy);
      setDebugInfo((prev) => ({
        ...prev,
        serverHealth: { healthy, duration, timestamp: Date.now() },
      }));

      // Server responded successfully
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [${healthy ? 'SUCCESS' : 'ERROR'}] ${translations.serverStatus}: ${healthy ? translations.serverOnline : translations.serverOffline}`,
      );

      if (healthy) {
        setInitStage('server_health_success');
      } else {
        setInitStage('server_health_failed');
        setInitError('Serveur non accessible');
        addMessage({
          type: 'error',
          content: `🏥 ERREUR SERVEUR\n\n❌ Le serveur backend n'est pas accessible.\n\n🔍 Diagnostic:\n- Temps de réponse: ${duration}ms\n- Status: ${healthy ? 'En ligne' : 'Hors ligne'}\n\n💡 Solution: Vérifiez que le serveur backend fonctionne sur le port 8080.`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      setInitError(`Erreur de connexion serveur: ${message}`);
      setInitStage('server_health_error');

      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [ERROR] ${translations.serverHealthCheckFailed}: ${message}`,
      );
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🚨 Détails erreur serveur: ${JSON.stringify(err)}`,
      );

      addMessage({
        type: 'error',
        content: `🚨 ERREUR DE CONNEXION SERVEUR\n\n❌ ${message}\n\n🔍 Diagnostic:\n- Type d'erreur: ${err instanceof Error ? err.constructor.name : typeof err}\n- URL testée: Probablement http://localhost:8080/health\n\n💡 Solutions:\n1. Vérifiez que le serveur backend est démarré\n2. Vérifiez la configuration CORS\n3. Vérifiez les logs du serveur`,
      });
    }

    addDebugLog(
      `[${new Date().toLocaleTimeString()}] [VERBOSE] 🏥 === FIN VÉRIFICATION SERVEUR ===`,
    );
  }, [
    addDebugLog,
    setServerHealthy,
    translations.checkingServerHealth,
    translations.serverOffline,
    translations.serverOnline,
    translations.serverStatus,
    translations.serverHealthCheckFailed,
    addMessage,
    authToken,
    sessionId,
  ]);

  const initializeAuthToken = useCallback(() => {
    setInitStage('auth_token_init');
    addDebugLog(
      `[${new Date().toLocaleTimeString()}] [VERBOSE] 🔐 === DÉBUT INITIALISATION TOKEN ===`,
    );

    try {
      // Check if we already have a token from persisted store
      const currentToken = useStore.getState().authToken;
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🔍 Token actuel du store: ${currentToken ? 'PRÉSENT (' + currentToken.substring(0, 20) + '...)' : 'ABSENT'}`,
      );

      if (currentToken) {
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [INFO] ${translations.tokenLoadedFromCookie}.`,
        );
        setTokenStatus(true);
        fetchAndDisplayToolCount();
        setInitStage('auth_token_success');
        return;
      }

      // Detailed environment variable logging
      const envDebugInfo = {
        'import.meta.env.AUTH_TOKEN': import.meta.env.AUTH_TOKEN,
        'clientConfig.AUTH_TOKEN': clientConfig.AUTH_TOKEN,
        'import.meta.env (keys)': Object.keys(import.meta.env),
        'document.location.href': document.location.href,
        'document.location.origin': document.location.origin,
      };

      setDebugInfo((prev) => ({ ...prev, envInfo: envDebugInfo }));

      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🌍 Variables d'environnement:`,
      );
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 📋 AUTH_TOKEN (import.meta): ${import.meta.env.AUTH_TOKEN ? 'PRÉSENT (' + String(import.meta.env.AUTH_TOKEN).substring(0, 20) + '...)' : 'ABSENT'}`,
      );
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 📋 AUTH_TOKEN (config): ${clientConfig.AUTH_TOKEN ? 'PRÉSENT (' + clientConfig.AUTH_TOKEN.substring(0, 20) + '...)' : 'ABSENT'}`,
      );
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 📋 Clés import.meta.env: ${Object.keys(import.meta.env).join(', ')}`,
      );
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🌐 URL actuelle: ${document.location.href}`,
      );

      console.log('🔍 [VERBOSE DEBUG] Environment variables:', envDebugInfo);

      const authToken = clientConfig.AUTH_TOKEN;
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🎯 Token final sélectionné: ${authToken ? 'PRÉSENT (' + authToken.substring(0, 20) + '...)' : 'ABSENT'}`,
      );

      if (authToken) {
        setAuthToken(authToken);
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [SUCCESS] ✅ ${translations.tokenLoadedFromEnv}.`,
        );
        setTokenStatus(true);
        fetchAndDisplayToolCount();
        setInitStage('auth_token_success');
      } else {
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🍪 Recherche dans les cookies...`,
        );

        // Try to get JWT from cookie as fallback
        const cookieName = 'agenticforge_jwt=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        let jwtToken = null;

        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🍪 Cookies disponibles: ${decodedCookie ? decodedCookie.substring(0, 100) + '...' : 'AUCUN'}`,
        );

        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(cookieName) === 0) {
            jwtToken = c.substring(cookieName.length, c.length);
            break;
          }
        }

        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🍪 Token trouvé dans cookies: ${jwtToken ? 'OUI (' + jwtToken.substring(0, 20) + '...)' : 'NON'}`,
        );

        // Try to get token from localStorage as another fallback
        if (!jwtToken) {
          jwtToken = localStorage.getItem('backendAuthToken');
          addDebugLog(
            `[${new Date().toLocaleTimeString()}] [VERBOSE] 💾 Token trouvé dans localStorage: ${jwtToken ? 'OUI (' + jwtToken.substring(0, 20) + '...)' : 'NON'}`,
          );
        }

        if (jwtToken) {
          setAuthToken(jwtToken);
          addDebugLog(
            `[${new Date().toLocaleTimeString()}] [SUCCESS] ✅ ${translations.tokenLoadedFromCookie}.`,
          );
          setTokenStatus(true);
          fetchAndDisplayToolCount();
          setInitStage('auth_token_success');
        } else {
          // No token found - user needs to authenticate via OAuth page
          addDebugLog(
            `[${new Date().toLocaleTimeString()}] [INFO] ℹ️ Aucun token trouvé. L'utilisateur doit s'authentifier via la page OAuth.`,
          );
          setTokenStatus(false);
          setInitStage('auth_token_needed');
        }
      }

      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [VERBOSE] 🔐 === FIN INITIALISATION TOKEN ===`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setInitError(`Erreur lors de l'initialisation du token: ${errorMessage}`);
      setInitStage('auth_token_error');
      addDebugLog(
        `[${new Date().toLocaleTimeString()}] [ERROR] 🚨 ERREUR TOKEN: ${errorMessage}`,
      );

      addMessage({
        type: 'error',
        content: `🚨 ERREUR CRITIQUE D'INITIALISATION\n\n❌ ${errorMessage}\n\n🔍 Étape: Initialisation du token d'authentification\n\n💡 Veuillez recharger la page ou contacter le support.`,
      });
    }
  }, [
    addDebugLog,
    setAuthToken,
    setTokenStatus,
    fetchAndDisplayToolCount,
    translations,
    addMessage,
  ]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted || hasInitialized) return;

      setHasInitialized(true);

      try {
        setInitStage('starting');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🚀 === DÉBUT INITIALISATION COMPLÈTE ===`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [INFO] ${translations.interfaceInitialized}.`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🌐 URL de la page: ${window.location.href}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 📱 User Agent: ${navigator.userAgent}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🕰️ Timestamp: ${new Date().toISOString()}`,
        );

        // Step 1: Initialize session
        setInitStage('session_init');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 📋 Étape 1/5: Initialisation de la session`,
        );
        initializeSession();

        // Step 2: Initialize auth token
        setInitStage('auth_init');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🔐 Étape 2/5: Initialisation du token`,
        );
        initializeAuthToken();

        // Step 3: Check server health
        setInitStage('server_check');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🏥 Étape 3/5: Vérification du serveur`,
        );
        await checkServerHealth();

        if (!mounted) return;

        // Step 4: Initialize messages
        setInitStage('messages_init');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 💬 Étape 4/6: Initialisation des messages`,
        );
        await useStore.getState().initializeSessionAndMessages();

        // Step 5: Fetch LLM Keys
        setInitStage('llm_keys_init');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🔑 Étape 5/6: Récupération des clés LLM`,
        );
        try {
          await fetchKeys();
          addDebugLog(
            `[${new Date().toLocaleTimeString()}] [SUCCESS] ✅ Clés LLM récupérées avec succès`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          addDebugLog(
            `[${new Date().toLocaleTimeString()}] [WARNING] ⚠️ Erreur lors de la récupération des clés LLM: ${errorMessage}`,
          );
          // Don't fail initialization if LLM keys can't be fetched
        }

        // Step 6: Final loading delay
        setInitStage('final_loading');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] ⏳ Étape 6/6: Délai de chargement final`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!mounted) return;

        setInitStage('completed');
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [SUCCESS] ✅ Initialisation terminée avec succès !`,
        );
        addMessage({
          type: 'agent_response',
          content: translations.agentReady,
        });

        // Log final state summary
        const finalState = useStore.getState();
        const llmKeysState = useLLMKeysStore.getState();
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 📊 État final:`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] - Session ID: ${finalState.sessionId ? 'PRÉSENT' : 'ABSENT'}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] - Auth Token: ${finalState.authToken ? 'PRÉSENT' : 'ABSENT'}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] - Server Healthy: ${finalState.serverHealthy ? 'OUI' : 'NON'}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] - Messages Count: ${finalState.messages.length}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] - LLM Keys Count: ${llmKeysState.keys.length}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [VERBOSE] 🚀 === FIN INITIALISATION COMPLÈTE ===`,
        );

        if (initError) {
          addMessage({
            type: 'error',
            content: `⚠️ INITIALISATION TERMINÉE AVEC ERREURS\n\n❌ Erreur: ${initError}\n\n🔍 Étape finale: ${initStage}\n\n💡 L'application peut ne pas fonctionner correctement.`,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('🚨 Initialization error:', error);
        setInitError(`Erreur critique d'initialisation: ${errorMessage}`);
        setInitStage('failed');

        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [ERROR] 🚨 ERREUR CRITIQUE: ${errorMessage}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [ERROR] 📍 Étape qui a échoué: ${initStage}`,
        );
        addDebugLog(
          `[${new Date().toLocaleTimeString()}] [ERROR] 🔍 Stack trace: ${error instanceof Error ? error.stack : 'Non disponible'}`,
        );

        addMessage({
          type: 'error',
          content: `🚨 ERREUR CRITIQUE D'INITIALISATION\n\n❌ ${errorMessage}\n\n🔍 Étape qui a échoué: ${initStage}\n\n📋 Informations de débogage:\n- URL: ${window.location.href}\n- Timestamp: ${new Date().toISOString()}\n- User Agent: ${navigator.userAgent.substring(0, 100)}...\n\n💡 Actions recommandées:\n1. Rechargez la page (F5)\n2. Vérifiez la console du navigateur\n3. Vérifiez que le serveur backend fonctionne\n4. Contactez le support si le problème persiste`,
        });
      }
    };

    // Add a small delay to ensure UI is ready
    const initTimeout = setTimeout(() => {
      initialize();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
    };
  }, [
    addDebugLog,
    addMessage,
    checkServerHealth,
    initializeAuthToken,
    initializeSession,
    fetchKeys,
    translations.agentReady,
    translations.interfaceInitialized,
    hasInitialized,
    initError,
    initStage,
  ]);

  // Debug display component (only shows if there are critical errors)
  if (initError && initStage === 'failed') {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 9999,
          overflow: 'auto',
        }}
      >
        <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
          🚨 ERREUR CRITIQUE D'INITIALISATION
        </h2>
        <div style={{ marginBottom: '15px' }}>
          <strong>❌ Erreur:</strong> {initError}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>📍 Étape:</strong> {initStage}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>🕰️ Timestamp:</strong> {new Date().toISOString()}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <strong>🌐 URL:</strong> {window.location.href}
        </div>
        {Object.keys(debugInfo).length > 0 && (
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', color: '#ffd93d' }}>
              🔍 Informations de débogage
            </summary>
            <pre
              style={{
                marginTop: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            🔄 Recharger la page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff8787',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Vider le cache et recharger
          </button>
        </div>
      </div>
    );
  }

  return null; // This component doesn't render anything visible in normal operation
};
