import { useEffect, useCallback } from 'react';
import { useCombinedStore } from '../../store';

export interface AuthError {
  url: string;
  status: number;
  timestamp: number;
  method: string;
}

export interface UseAuthInterceptorOptions {
  /** Callback appelé quand une erreur 401 est détectée */
  onAuthError?: (error: AuthError) => void;
  /** URLs à ignorer pour l'interception (par défaut: /health, /public) */
  ignoredUrls?: string[];
  /** Nombre maximum d'erreurs avant de déclencher l'alerte (par défaut: 1) */
  maxErrors?: number;
}

/**
 * Hook qui intercepte automatiquement les erreurs 401 et fournit
 * des méthodes pour gérer l'authentification de manière transparente.
 */
export const useAuthInterceptor = (options: UseAuthInterceptorOptions = {}) => {
  const {
    onAuthError,
    ignoredUrls = ['/health', '/public'],
    maxErrors = 1
  } = options;

  const { addDebugLog, authToken } = useCombinedStore();

  const shouldIgnoreUrl = useCallback((url: string) => {
    return ignoredUrls.some(ignored => url.includes(ignored));
  }, [ignoredUrls]);

  const handleAuthError = useCallback((error: AuthError) => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH_INTERCEPTOR] 401 détecté sur ${error.url} (${error.method})`);
    onAuthError?.(error);
  }, [addDebugLog, onAuthError]);

  // Intercepter les appels fetch globaux
  useEffect(() => {
    const originalFetch = window.fetch;
    let errorCount = 0;
    
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const response = await originalFetch(...args);
      
      // Reset error count on successful response
      if (response.ok) {
        errorCount = 0;
      }
      
      // Détecter les erreurs 401
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].toString() : (args[0] as Request).url;
        const method = typeof args[1] === 'object' && args[1]?.method ? args[1].method : 'GET';
        
        // Éviter les boucles infinies sur les endpoints publics
        if (!shouldIgnoreUrl(url)) {
          errorCount++;
          
          if (errorCount >= maxErrors) {
            const authError: AuthError = {
              url,
              status: response.status,
              timestamp: Date.now(),
              method
            };
            
            handleAuthError(authError);
            errorCount = 0; // Reset after triggering
          }
        }
      }
      
      return response;
    };

    // Nettoyer l'intercepteur lors du démontage
    return () => {
      window.fetch = originalFetch;
    };
  }, [shouldIgnoreUrl, handleAuthError, maxErrors]);

  // Méthodes utilitaires
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erreur validation token:', error);
      return false;
    }
  }, []);

  const getCurrentTokenStatus = useCallback(() => {
    if (!authToken) return 'missing';
    // Note: nous ne pouvons pas facilement déterminer si le token est valide sans faire une requête
    return 'unknown';
  }, [authToken]);

  return {
    validateToken,
    getCurrentTokenStatus,
    currentToken: authToken
  };
};

export default useAuthInterceptor;