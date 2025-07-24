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
  const addMessage = useStore((state) => state.addMessage);
  const setAuthToken = useStore((state) => state.setAuthToken);
  const setServerHealthy = useStore((state) => state.setServerHealthy);
  const setSessionId = useStore((state) => state.setSessionId);
  const setTokenStatus = useStore((state) => state.setTokenStatus);
  const fetchAndDisplayToolCount = useStore((state) => state.fetchAndDisplayToolCount);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const toggleHighContrastMode = useStore((state) => state.toggleHighContrastMode);

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
    const initialize = async () => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${fr.interfaceInitialized}.`);
      initializeSession();
      initializeAuthToken();
      await checkServerHealth();
      await useStore.getState().initializeSessionAndMessages();
      addMessage({ type: 'agent_response', content: fr.agentReady });

      // Apply dark mode and high contrast mode based on initial store state
      const isDarkMode = useStore.getState().isDarkMode;
      const storedDarkMode = localStorage.getItem('agenticForgeDarkMode');
      if (storedDarkMode === 'true' && !isDarkMode) {
        toggleDarkMode();
      } else if (storedDarkMode === 'false' && isDarkMode) {
        toggleDarkMode();
      }

      const isHighContrastMode = useStore.getState().isHighContrastMode;
      const storedHighContrastMode = localStorage.getItem('agenticForgeHighContrastMode');
      if (storedHighContrastMode === 'true' && !isHighContrastMode) {
        toggleHighContrastMode();
      } else if (storedHighContrastMode === 'false' && isHighContrastMode) {
        toggleHighContrastMode();
      }
    };

    initialize();
  }, [checkServerHealth, initializeAuthToken, initializeSession, addDebugLog, addMessage, toggleDarkMode, toggleHighContrastMode]);

  return null; // This component doesn't render anything visible
};
