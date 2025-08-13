import { useCallback, useEffect } from 'react';

import { useLanguage } from '../lib/contexts/LanguageContext';
import { clientConfig } from '../config';
import { testServerHealth } from '../lib/api';
import { useCombinedStore as useStore } from '../store';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const AppInitializer = () => {
  const { translations } = useLanguage();
  const addDebugLog = useStore((state) => state.addDebugLog);
  const addMessage = useStore((state) => state.addMessage);
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
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.newSessionGenerated}: ${currentSessionId}`);
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.sessionRetrieved}: ${currentSessionId}`);
    }
    setSessionId(currentSessionId);
  }, [addDebugLog, setSessionId, translations]);

  const checkServerHealth = useCallback(async () => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.checkingServerHealth}`);
    try {
      const healthy = await testServerHealth();
      setServerHealthy(healthy);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [${healthy ? 'SUCCESS' : 'ERROR'}] ${translations.serverStatus}: ${healthy ? translations.serverOnline : translations.serverOffline}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${translations.serverHealthCheckFailed}: ${message}`);
    }
  }, [addDebugLog, setServerHealthy, translations.checkingServerHealth, translations.serverOffline, translations.serverOnline, translations.serverStatus, translations.serverHealthCheckFailed]);

  const initializeAuthToken = useCallback(() => {
    const viteAuthToken = clientConfig.VITE_AUTH_TOKEN || clientConfig.AUTH_TOKEN;

    if (viteAuthToken) {
      setAuthToken(viteAuthToken);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.tokenLoadedFromEnv}.`);
      setTokenStatus(true);
      fetchAndDisplayToolCount();
    } else {
      // Try to get JWT from cookie as fallback
      const cookieName = 'agenticforge_jwt=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      let jwtToken = null;
      for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
          jwtToken = c.substring(cookieName.length, c.length);
          break;
        }
      }
      
      // Try to get token from localStorage as another fallback
      if (!jwtToken) {
        jwtToken = localStorage.getItem('authToken');
      }
      
      if (jwtToken) {
        setAuthToken(jwtToken);
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.tokenLoadedFromCookie}.`);
        setTokenStatus(true);
        fetchAndDisplayToolCount();
      } else {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.noTokenFound}.`);
        setTokenStatus(false);
      }
    }
  }, [addDebugLog, setAuthToken, setTokenStatus, fetchAndDisplayToolCount, translations]);

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (!mounted) return;
      
      try {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] ${translations.interfaceInitialized}.`);
        initializeSession();
        initializeAuthToken();
        await checkServerHealth();
        
        if (!mounted) return;
        
        await useStore.getState().initializeSessionAndMessages();
        addMessage({ type: 'agent_response', content: translations.agentReady });
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
    
    return () => {
      mounted = false;
    };
  }, [addDebugLog, addMessage, checkServerHealth, initializeAuthToken, initializeSession, translations.agentReady, translations.interfaceInitialized]);

  return null; // This component doesn't render anything visible
};
