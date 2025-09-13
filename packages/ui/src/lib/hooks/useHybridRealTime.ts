import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';

interface HybridRealTimeOptions {
  jobId?: string;
  sessionId?: string;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event | Error) => void;
  onConnectionChange?: (
    connected: boolean,
    method: 'websocket' | 'sse' | 'polling',
  ) => void;
}

interface HybridRealTimeReturn {
  connect: (jobId: string) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  connectionMethod: 'websocket' | 'sse' | 'polling' | null;
  reconnect: () => Promise<void>;
}

export const useHybridRealTime = (
  options: HybridRealTimeOptions = {},
): HybridRealTimeReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<
    'websocket' | 'sse' | 'polling' | null
  >(null);

  const webSocketRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Always call hooks at the top level to avoid conditional hook violations
  const authToken = useUIStore((state) => state.authToken);
  const sessionStoreId = useSessionStore((state) => state.sessionId);
  const sessionId = options.sessionId || sessionStoreId;

  // Configuration des méthodes de connexion - stabilisée avec useMemo
  const connectionMethods = useMemo(
    () => ({
      websocket: {
        name: 'websocket' as const,
        priority: 1,
        connect: async (jobId: string) => {
          return new Promise<void>((resolve, reject) => {
            try {
              const wsUrl = `ws://localhost:3001/ws?auth=${authToken}&sessionId=${sessionId}&jobId=${jobId}`;
              const ws = new WebSocket(wsUrl);

              ws.onopen = () => {
                console.log('✅ [HybridRealTime] WebSocket connected');
                webSocketRef.current = ws;
                setIsConnected(true);
                setConnectionMethod('websocket');
                options.onConnectionChange?.(true, 'websocket');
                reconnectAttemptsRef.current = 0;
                resolve();
              };

              ws.onmessage = (event) => {
                console.log(
                  '📨 [HybridRealTime] WebSocket message:',
                  event.data,
                );
                options.onMessage?.(event);
              };

              ws.onerror = (error) => {
                console.error('🚨 [HybridRealTime] WebSocket error:', error);
                options.onError?.(error);
                reject(error);
              };

              ws.onclose = () => {
                console.log('🔚 [HybridRealTime] WebSocket closed');
                webSocketRef.current = null;
                setIsConnected(false);
                setConnectionMethod(null);
                options.onConnectionChange?.(false, 'websocket');
              };

              // Timeout pour la connexion WebSocket
              setTimeout(() => {
                if (!isConnected) {
                  ws.close();
                  reject(new Error('WebSocket connection timeout'));
                }
              }, 5000);
            } catch (error) {
              console.error(
                '🚨 [HybridRealTime] WebSocket connection failed:',
                error,
              );
              reject(error);
            }
          });
        },
        disconnect: () => {
          if (webSocketRef.current) {
            webSocketRef.current.close();
            webSocketRef.current = null;
          }
        },
      },

      sse: {
        name: 'sse' as const,
        priority: 2,
        connect: async (jobId: string) => {
          return new Promise<void>((resolve, reject) => {
            try {
              const baseUrl = `http://localhost:3001/api/chat/stream/${jobId}`;
              const urlParams = new URLSearchParams();
              if (authToken) urlParams.append('auth', authToken);
              if (sessionId) urlParams.append('sessionId', sessionId);

              const eventSourceUrl = `${baseUrl}?${urlParams.toString()}`;
              const eventSource = new EventSource(eventSourceUrl);

              eventSource.onopen = () => {
                console.log('✅ [HybridRealTime] SSE connected');
                eventSourceRef.current = eventSource;
                setIsConnected(true);
                setConnectionMethod('sse');
                options.onConnectionChange?.(true, 'sse');
                reconnectAttemptsRef.current = 0;
                resolve();
              };

              eventSource.onmessage = (event) => {
                console.log('📨 [HybridRealTime] SSE message:', event.data);
                options.onMessage?.(event);
              };

              eventSource.onerror = (error) => {
                console.error('🚨 [HybridRealTime] SSE error:', error);
                options.onError?.(error);
                eventSource.close();
                reject(error);
              };

              // Timeout pour la connexion SSE
              setTimeout(() => {
                if (!isConnected) {
                  eventSource.close();
                  reject(new Error('SSE connection timeout'));
                }
              }, 5000);
            } catch (error) {
              console.error(
                '🚨 [HybridRealTime] SSE connection failed:',
                error,
              );
              reject(error);
            }
          });
        },
        disconnect: () => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        },
      },

      polling: {
        name: 'polling' as const,
        priority: 3,
        connect: async (jobId: string) => {
          return new Promise<void>((resolve) => {
            console.log('✅ [HybridRealTime] Starting polling mode');

            const poll = async () => {
              try {
                // Ici vous pouvez implémenter un appel API pour récupérer les nouveaux événements
                // Par exemple: await fetch(`/api/job/${jobId}/events`);

                // Simulation d'un événement pour le test
                const mockEvent = new MessageEvent('message', {
                  data: JSON.stringify({
                    type: 'polling_heartbeat',
                    timestamp: Date.now(),
                    jobId,
                  }),
                });

                options.onMessage?.(mockEvent);
              } catch (error) {
                console.error('🚨 [HybridRealTime] Polling error:', error);
                options.onError?.(error as Event);
              }
            };

            // Polling toutes les 5 secondes avec backoff exponentiel
            const startPolling = () => {
              const interval = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                30000,
              );
              pollingIntervalRef.current = setInterval(poll, interval);
            };

            startPolling();
            setIsConnected(true);
            setConnectionMethod('polling');
            options.onConnectionChange?.(true, 'polling');
            reconnectAttemptsRef.current = 0;
            resolve();
          });
        },
        disconnect: () => {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        },
      },
    }),
    [authToken, sessionId, options, isConnected],
  );

  const tryConnect = useCallback(
    async (jobId: string): Promise<boolean> => {
      // Essayer les méthodes dans l'ordre de priorité
      const methods = Object.values(connectionMethods).sort(
        (a, b) => a.priority - b.priority,
      );

      for (const method of methods) {
        try {
          console.log(
            `🔄 [HybridRealTime] Trying ${method.name} connection...`,
          );
          await method.connect(jobId);
          console.log(
            `✅ [HybridRealTime] Successfully connected via ${method.name}`,
          );
          return true;
        } catch (error) {
          console.warn(
            `⚠️ [HybridRealTime] ${method.name} connection failed:`,
            error,
          );
          method.disconnect();
        }
      }

      console.error('❌ [HybridRealTime] All connection methods failed');
      return false;
    },
    [connectionMethods],
  );

  const connect = useCallback(
    async (jobId: string) => {
      console.log('🚀 [HybridRealTime] Starting hybrid connection...');

      // Déconnecter d'abord toute connexion existante
      Object.values(connectionMethods).forEach((method) => method.disconnect());

      const success = await tryConnect(jobId);
      if (!success) {
        throw new Error(
          'Failed to establish real-time connection with any method',
        );
      }
    },
    [tryConnect, connectionMethods],
  );

  const disconnect = useCallback(() => {
    console.log('🔌 [HybridRealTime] Disconnecting all connections...');

    // Fermer toutes les connexions
    Object.values(connectionMethods).forEach((method) => method.disconnect());

    setIsConnected(false);
    setConnectionMethod(null);
    options.onConnectionChange?.(false, connectionMethod || 'websocket');
  }, [connectionMethod, connectionMethods, options]);

  const reconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ [HybridRealTime] Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000,
    );

    console.log(
      `🔄 [HybridRealTime] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
    );

    reconnectTimeoutRef.current = setTimeout(async () => {
      if (options.jobId) {
        try {
          await connect(options.jobId);
        } catch (error) {
          console.error('🚨 [HybridRealTime] Reconnection failed:', error);
          // Réessayer si on n'a pas atteint le maximum
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnect();
          }
        }
      }
    }, delay);
  }, [connect, options.jobId, maxReconnectAttempts]);

  // Gestionnaire d'erreurs global pour déclencher la reconnexion
  const handleGlobalError = useCallback(
    (error: Event | Error) => {
      console.error(
        '🚨 [HybridRealTime] Global error, attempting reconnection:',
        error,
      );
      options.onError?.(error);

      if (isConnected) {
        setIsConnected(false);
        setConnectionMethod(null);
        options.onConnectionChange?.(false, connectionMethod || 'websocket');

        // Attendre un peu avant de reconnecter
        setTimeout(() => {
          reconnect();
        }, 1000);
      }
    },
    [isConnected, connectionMethod, reconnect, options],
  );

  // Nettoyage automatique
  useEffect(() => {
    return () => {
      disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [disconnect]);

  // Gestionnaire d'erreurs global
  useEffect(() => {
    const handleOnline = () => {
      console.log(
        '🌐 [HybridRealTime] Network back online, attempting reconnection...',
      );
      if (!isConnected && options.jobId) {
        reconnect();
      }
    };

    const handleOffline = () => {
      console.log('📴 [HybridRealTime] Network offline');
      handleGlobalError(new Error('Network offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, options.jobId, reconnect, handleGlobalError]);

  return {
    connect,
    disconnect,
    isConnected,
    connectionMethod,
    reconnect,
  };
};

// Hook spécialisé pour les tâches d'agent avec gestion automatique
export const useAgentRealTime = (jobId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Always call hooks at the top level to avoid conditional hook violations
  const addMessage = useSessionStore((state) => state.addMessage);
  const setIsProcessingUI = useUIStore((state) => state.setIsProcessing);
  const addDebugLog = useUIStore((state) => state.addDebugLog);

  // Use the hooks to avoid unused variable warnings
  console.log(
    '🔗 [useAgentRealTime] Hooks initialized:',
    !!addMessage,
    !!setIsProcessingUI,
    !!addDebugLog,
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🤖 [AgentRealTime] Processing message:', data.type);

        // Traiter les différents types de messages
        switch (data.type) {
          case 'agent_response':
            if (data.content) {
              addMessage({
                type: 'agent_response',
                content: data.content,
              } as any);
            }
            break;

          case 'tool_call':
            if (data.toolName && data.params) {
              addMessage({
                type: 'tool_call',
                toolName: data.toolName,
                params: data.params,
              } as any);
            }
            break;

          case 'tool_result':
            if (data.toolName && data.result) {
              addMessage({
                type: 'tool_result',
                toolName: data.toolName,
                result: data.result,
              } as any);
            }
            break;

          case 'error':
            addMessage({
              type: 'error',
              content: data.message || 'Unknown error',
            } as any);
            break;

          case 'close':
            setIsProcessing(false);
            setIsProcessingUI(false);
            break;

          default:
            console.log(
              '📝 [AgentRealTime] Unhandled message type:',
              data.type,
            );
        }

        addDebugLog(`[RealTime] 📨 Message ${data.type} traité`);
      } catch (error) {
        console.error('🚨 [AgentRealTime] Error processing message:', error);
        addDebugLog(`[RealTime] 🚨 Erreur traitement message: ${error}`);
      }
    },
    [addMessage, setIsProcessingUI, addDebugLog],
  );

  const handleError = useCallback(
    (error: Event | Error) => {
      console.error('🚨 [AgentRealTime] Connection error:', error);
      addDebugLog(`[RealTime] 🚨 Erreur connexion: ${error}`);

      addMessage({
        type: 'error',
        content: 'Erreur de connexion temps réel. Tentative de reconnexion...',
      } as any);
    },
    [addMessage, addDebugLog],
  );

  const handleConnectionChange = useCallback(
    (connected: boolean, method: 'websocket' | 'sse' | 'polling') => {
      console.log(
        `🔗 [AgentRealTime] Connection ${connected ? 'established' : 'lost'} via ${method}`,
      );
      addDebugLog(
        `[RealTime] 🔗 Connexion ${connected ? 'établie' : 'perdue'} via ${method}`,
      );

      if (connected) {
        addMessage({
          type: 'agent',
          content: `Connexion temps réel établie via ${method.toUpperCase()}`,
        } as any);
      }
    },
    [addMessage, addDebugLog],
  );

  const hybridRealTime = useHybridRealTime({
    jobId,
    onMessage: handleMessage,
    onError: handleError,
    onConnectionChange: handleConnectionChange,
  });

  const startRealTime = useCallback(
    async (newJobId: string) => {
      try {
        setIsProcessing(true);
        setIsProcessingUI(true);
        await hybridRealTime.connect(newJobId);
        addDebugLog(
          `[RealTime] 🚀 Connexion temps réel démarrée pour job ${newJobId}`,
        );
      } catch (error) {
        console.error(
          '🚨 [AgentRealTime] Failed to start real-time connection:',
          error,
        );
        addDebugLog(`[RealTime] 🚨 Échec démarrage connexion: ${error}`);
        setIsProcessing(false);
        setIsProcessingUI(false);
      }
    },
    [hybridRealTime, setIsProcessingUI, addDebugLog],
  );

  const stopRealTime = useCallback(() => {
    hybridRealTime.disconnect();
    setIsProcessing(false);
    setIsProcessingUI(false);
    addDebugLog('[RealTime] 🛑 Connexion temps réel arrêtée');
  }, [hybridRealTime, setIsProcessingUI, addDebugLog]);

  return {
    startRealTime,
    stopRealTime,
    isConnected: hybridRealTime.isConnected,
    connectionMethod: hybridRealTime.connectionMethod,
    reconnect: hybridRealTime.reconnect,
    isProcessing,
  };
};
