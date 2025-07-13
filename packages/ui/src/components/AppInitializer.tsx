import { useCallback, useEffect } from 'react';

import { fr } from '../constants/fr';
import { clientConfig } from '../config';
import { testServerHealth } from '../lib/api';
import { useStore } from '../lib/store';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const AppInitializer = () => {
  const addDebugLog = useStore((state) => state.addDebugLog);
  const addDisplayItem = useStore((state) => state.addDisplayItem);
  const setAuthToken = useStore((state) => state.setAuthToken);
  const setServerHealthy = useStore((state) => state.setServerHealthy);
  const setSessionId = useStore((state) => state.setSessionId);
  const setTokenStatus = useStore((state) => state.setTokenStatus);
  const fetchAndDisplayToolCount = useStore((state) => state.fetchAndDisplayToolCount);

  const initializeSession = useCallback(() => {
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.newSessionGenerated}: ${currentSessionId}`);
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.sessionRetrieved}: ${currentSessionId}`);
    }
    setSessionId(currentSessionId);
  }, [addDebugLog, setSessionId]);

  const checkServerHealth = useCallback(async () => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.checkingServerHealth}`);
    try {
      const healthy = await testServerHealth();
      setServerHealthy(healthy);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [${healthy ? 'SUCCESS' : 'ERROR'}] ${fr.serverStatus}: ${healthy ? fr.serverOnline : fr.serverOffline}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${fr.serverHealthCheckFailed}: ${message}`);
    }
  }, [addDebugLog, setServerHealthy]);

  const initializeAuthToken = useCallback(() => {
    const viteAuthToken = clientConfig.VITE_AUTH_TOKEN;

    if (viteAuthToken) {
      setAuthToken(viteAuthToken);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.tokenLoadedFromEnv}.`);
      setTokenStatus(true);
      fetchAndDisplayToolCount();
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.noTokenFound}.`);
      setTokenStatus(false);
    }
  }, [addDebugLog, setAuthToken, setTokenStatus, fetchAndDisplayToolCount]);

  useEffect(() => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.interfaceInitialized}.`);
    initializeSession();
    initializeAuthToken();
    checkServerHealth();
    addDisplayItem({
      content: fr.agentReady,
      sender: 'assistant',
      type: 'agent_response',
      timestamp: new Date().toISOString(),
    });
  }, [checkServerHealth, initializeAuthToken, initializeSession, addDebugLog, addDisplayItem]);

  return null; // This component doesn't render anything visible
};
