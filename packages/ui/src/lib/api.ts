// packages/ui/src/lib/api.ts

// Get base URL from environment variable or default to relative path for proxy
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Récupère le token d'authentification backend valide.
 * Priorité: paramètre fourni > localStorage > variable d'environnement
 */
function getBackendAuthToken(providedToken?: string | null): string | null {
  // 1. Utiliser le token fourni en paramètre
  if (providedToken) {
    return providedToken;
  }
  
  // 2. Essayer localStorage (token utilisateur sauvegardé)
  try {
    const storedToken = localStorage.getItem('backendAuthToken');
    if (storedToken) {
      return storedToken;
    }
  } catch (error) {
    console.warn('🔐 [getBackendAuthToken] Failed to get token from localStorage:', error);
  }
  
  // 3. Fallback sur la variable d'environnement (pour le développement)
  const envToken = import.meta.env.VITE_AUTH_TOKEN || import.meta.env.AUTH_TOKEN;
  if (envToken) {
    return envToken;
  }
  
  return null;
}

/**
 * Construit les en-têtes d'authentification pour les requêtes API backend.
 * IMPORTANT: Ceci est pour l'authentification backend, PAS pour les clés LLM!
 */
function getAuthHeaders(
  authToken: string | null,
  sessionId: string | null,
): Record<string, string> {
  console.log('🔐 [getAuthHeaders] === CONSTRUCTION HEADERS BACKEND ===');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Récupérer le token backend (PAS un token LLM !)
  const backendToken = getBackendAuthToken(authToken);
  
  if (backendToken) {
    headers['Authorization'] = 'Bearer ' + backendToken;
    console.log('✅ [getAuthHeaders] Backend token utilisé:', backendToken.substring(0, 30) + '...');
  } else {
    console.log('❌ [getAuthHeaders] Aucun token backend trouvé - requête non authentifiée');
    console.warn('🚨 [getAuthHeaders] ATTENTION: Backend authentication manquante! Vérifiez votre token AUTH_TOKEN.');
  }

  if (sessionId) {
    headers['X-Session-ID'] = String(sessionId);
  }
  
  console.log('🔐 [getAuthHeaders] HEADERS BACKEND FINAUX:');
  console.log('🔐 [getAuthHeaders] - Authorization:', headers['Authorization'] ? 'PRÉSENT' : 'ABSENT');
  console.log('🔐 [getAuthHeaders] - X-Session-ID:', headers['X-Session-ID'] || 'ABSENT');
  console.log('🔐 [getAuthHeaders] === FIN CONSTRUCTION HEADERS BACKEND ===');
  
  return headers;
}

/**
 * Construit une URL complète pour les requêtes API.
 */
function buildApiUrl(endpoint: string): string {
  // Remove leading slash from endpoint if it exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Handle different cases for BASE_URL
  if (!BASE_URL || BASE_URL === '/') {
    // If base URL is empty or root, just return the endpoint with leading slash
    return `/${cleanEndpoint}`;
  } else {
    // Ensure base URL ends with a slash if it's not empty
    const formattedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
    return `${formattedBaseUrl}${cleanEndpoint}`;
  }
}

/**
 * Envoie un message au backend et gère le streaming des événements.
 */
export async function sendMessage(
  prompt: string,
  authToken: null | string,
  sessionId: null | string,
  onMessage: (event: MessageEvent) => void,
  onError: (error: Event | Error) => void,
  addDebugLog?: (message: string) => void,
): Promise<{ jobId: string; eventSource: EventSource }> {
  try {
    console.log('🚀 [sendMessage] Starting request to /api/chat');
    console.log('📝 [sendMessage] Prompt length:', prompt.length);
    console.log('🔐 [sendMessage] AuthToken available:', !!authToken);
    console.log('🆔 [sendMessage] SessionId:', sessionId);
    
    const headers = getAuthHeaders(authToken, sessionId);
    console.log('📋 [sendMessage] Request headers:', Object.keys(headers));
    
    addDebugLog?.(`[API] 🚀 Envoi de la requête vers /api/chat avec prompt de ${prompt.length} caractères`);

    const response = await fetch(buildApiUrl('/api/chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });

    console.log('📡 [sendMessage] Response received!');
    console.log('📊 [sendMessage] Response status:', response.status);
    console.log('🏷️ [sendMessage] Response headers:', response.headers);
    
    addDebugLog?.(`[API] 📡 Réponse reçue avec status: ${response.status}`);

    if (!response.ok) {
      console.error('❌ [sendMessage] Response not OK!');
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ [sendMessage] Error data:', errorData);
      } catch (jsonError) {
        console.error('❌ [sendMessage] Failed to parse error response:', jsonError);
        errorData = { message: `HTTP ${response.status} ${response.statusText}` };
      }
      
      const errorMessage = errorData.message || `Erreur du serveur: ${response.status} ${response.statusText}`;
      console.error('🚨 [sendMessage] Final error:', errorMessage);
      addDebugLog?.(`[API] 🚨 ERREUR: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    let responseData;
    try {
      responseData = await response.json();
      console.log('✅ [sendMessage] Response data:', responseData);
    } catch (jsonError) {
      console.error('❌ [sendMessage] Failed to parse success response:', jsonError);
      addDebugLog?.(`[API] ❌ Impossible de parser la réponse JSON`);
      throw new Error('Invalid JSON response from server');
    }

    const { jobId } = responseData;
    if (!jobId) {
      console.error('❌ [sendMessage] No jobId in response!');
      addDebugLog?.(`[API] ❌ Aucun jobId dans la réponse !`);
      throw new Error('No job ID received from server');
    }
    
    console.log('🆔 [sendMessage] Job ID received:', jobId);
    addDebugLog?.(`[API] ✅ Job ID reçu: ${jobId}`);
    
    // Établit la connexion SSE pour les mises à jour en streaming
    // Add authentication token as query parameter since EventSource doesn't support headers
    const baseUrl = buildApiUrl(`/api/chat/stream/${jobId}`);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const eventSourceUrl = `${baseUrl}${separator}auth=${encodeURIComponent(authToken || '')}&sessionId=${encodeURIComponent(sessionId || '')}`;
    console.log('🔗 [sendMessage] Creating EventSource with URL:', eventSourceUrl);
    addDebugLog?.(`[SSE] 🔗 Création EventSource avec URL: ${eventSourceUrl}`);
    
    const eventSource = new EventSource(eventSourceUrl);
    console.log('📡 [sendMessage] EventSource instance created:', eventSource);

    eventSource.onmessage = (event) => {
      console.log('📨 [EventSource] Message received:', event.data);
      addDebugLog?.(`[SSE] 📨 Message EventSource reçu: ${event.data}`);
      onMessage(event);
    };
    
    eventSource.onerror = (error) => {
      console.error('🚨 [EventSource] ERROR occurred!');
      console.error('🚨 [EventSource] Error details:', error);
      console.error('📊 [EventSource] ReadyState:', eventSource.readyState);
      console.error('🌐 [EventSource] URL:', eventSource.url);
      console.error('🎯 [EventSource] EventSource object:', eventSource);
      
      const stateText = eventSource.readyState === 0 ? 'CONNECTING' : 
                       eventSource.readyState === 1 ? 'OPEN' : 'CLOSED';
      
      addDebugLog?.(`[SSE ERROR] 🚨 EventSource échec ! État: ${eventSource.readyState} (${stateText}), URL: ${eventSource.url}`);
      
      if (eventSource.readyState === 2) {
        console.error('💥 [EventSource] Connection permanently closed!');
        addDebugLog?.(`[SSE ERROR] 💥 Connexion EventSource fermée définitivement !`);
      }
      
      onError(error);
      // eventSource.close(); // Do not close here, let the hook manage it
    };

    // Add event listeners for debugging
    eventSource.onopen = () => {
      console.log('✅ [EventSource] Connection opened successfully!');
      console.log('📊 [EventSource] ReadyState:', eventSource.readyState);
      console.log('🌐 [EventSource] Connected to URL:', eventSource.url);
      addDebugLog?.(`[SSE] ✅ Connexion EventSource ouverte avec succès ! État: ${eventSource.readyState}`);
    };

    eventSource.addEventListener('close', () => {
      console.log('🔚 [EventSource] Close event received');
      addDebugLog?.(`[SSE] 🔚 Événement de fermeture EventSource reçu`);
    });

    // Monitor connection state
    setTimeout(() => {
      const state = eventSource.readyState;
      const stateText = state === 0 ? 'CONNECTING' : state === 1 ? 'OPEN' : 'CLOSED';
      console.log(`📊 [EventSource] State after 1s: ${state} (${stateText})`);
      addDebugLog?.(`[SSE] 📊 État EventSource après 1s: ${state} (${stateText})`);
      
      if (state === 2) {
        console.warn('⚠️ [EventSource] Connection closed after 1s - potential problem!');
        addDebugLog?.(`[SSE] ⚠️ Connexion fermée après 1s - problème potentiel !`);
      }
    }, 1000);

    console.log('🎯 [sendMessage] EventSource setup completed');
    addDebugLog?.(`[SSE] 🎯 Configuration EventSource terminée avec succès`);

    return { jobId, eventSource } as { jobId: string; eventSource: EventSource };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    addDebugLog?.(`[API ERROR] Error in sendMessage: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Récupère la liste des outils disponibles.
 */
import { type ChatMessage as Message } from '../types/chat.d';

export interface SessionData {
  id: string;
  name: string;
  messages: Message[];
  timestamp: number;
  activeLlmProvider?: string;
  status?: string;
}

export const getTools = async (authToken: string, sessionId: string) => {
  const response = await fetch(buildApiUrl('/api/tools'), {
    headers: getAuthHeaders(authToken, sessionId),
  });
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des outils: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Teste la santé du serveur.
 */
export async function testServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(buildApiUrl('/api/health'));
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors de la vérification de la santé du serveur:`, error);
    return false;
  }
}

/**
 * Interrompt un job en cours.
 */
export async function interrupt(jobId: string, authToken: null | string, sessionId: null | string): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/interrupt/${jobId}`), {
      method: 'POST',
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de l'interruption du job`);
    }
}



/**
 * Sauvegarde une session.
 */
export async function saveSessionApi(session: SessionData, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  const response = await fetch(buildApiUrl('/api/sessions/save'), {
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify(session),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la sauvegarde de la session`);
  }
}

/**
 * Charge une session.
 */
export async function loadSessionApi(id: string, authToken: string | null = null, sessionId: string | null = null): Promise<SessionData> {
  const response = await fetch(buildApiUrl(`/api/sessions/${id}`), {
    headers: getAuthHeaders(authToken, sessionId),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors du chargement de la session`);
  }
  return await response.json();
}

/**
 * Supprime une session.
 */
export async function deleteSessionApi(id: string, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/sessions/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(authToken, sessionId),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la suppression de la session`);
  }
}

/**
 * Renomme une session.
 */
export async function renameSessionApi(id: string, newName: string, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/sessions/${id}/rename`), {
    method: 'PUT',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ newName }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors du renommage de la session`);
  }
}

/**
 * Charge toutes les sessions.
 */
export async function loadAllSessionsApi(authToken: string | null = null, sessionId: string | null = null): Promise<SessionData[]> {
  const headers = getAuthHeaders(authToken, sessionId);
  
  const response = await fetch(buildApiUrl('/api/sessions'), {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors du chargement de toutes les sessions`);
  }
  return await response.json();
}

/**
 * Récupère les statistiques du leaderboard.
 */
export async function getLeaderboardStats(authToken: string | null = null, sessionId: string | null = null): Promise<{
  tokensSaved: number;
  successfulRuns: number;
  sessionsCreated: number;
  apiKeysAdded: number;
}> {
  const headers = getAuthHeaders(authToken, sessionId);
  
  const response = await fetch(buildApiUrl('/api/leaderboard-stats'), {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des statistiques du leaderboard`);
  }
  return await response.json();
}

import { type LlmApiKey } from '../store/types';

/**
 * Ajoute une clé API LLM.
 */
export async function addLlmApiKeyApi(provider: string, key: string, baseUrl?: string, model?: string, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  // --- DEBOGAGE: Log uniquement si les données obligatoires sont manquantes ---
  if (!provider || !key) {
    console.warn("WARNING addLlmApiKeyApi: Missing provider or key!", { provider, key, baseUrl, model });
  }
  // --- FIN DEBOGAGE ---
  const response = await fetch(buildApiUrl('/api/llm-api-keys'), {
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ provider, key, baseUrl, model }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de l'ajout de la clé API LLM`);
  }
}

/**
 * Récupère la clé API maîtresse depuis les variables d'environnement.
 */
export async function getMasterLlmApiKeyApi(authToken: string | null = null, sessionId: string | null = null): Promise<LlmApiKey | null> {
  const headers = getAuthHeaders(authToken, sessionId);
  
  const response = await fetch(buildApiUrl('/api/llm-keys/master-key'), {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      // Master key not found, return null
      return null;
    }
    throw new Error(`Erreur lors de la récupération de la clé API maîtresse`);
  }
  
  const data = await response.json();
  
  // Check if master key exists
  if (!data.apiKey) {
    return null;
  }
  
  return {
    id: 'master-key',
    providerId: data.apiProvider,
    providerName: data.apiProvider,
    keyName: 'Master Key (.env)',
    keyValue: data.apiKey,
    isEncrypted: false,
    isActive: data.isActive,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    metadata: {
      environment: 'universal',
      tags: ['master']
    },
    usageStats: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    }
  };
}

/**
 * Récupère toutes les clés API LLM.
 */
export async function getLlmApiKeysApi(authToken: string | null = null, sessionId: string | null = null): Promise<LlmApiKey[]> {
  const headers = getAuthHeaders(authToken, sessionId);
  
  const response = await fetch(buildApiUrl('/api/llm-api-keys'), {
    method: 'GET',
    headers
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la récupération des clés API LLM`);
  }
  return await response.json();
}

/**
 * Supprime une clé API LLM par index.
 */
export async function removeLlmApiKeyApi(index: number, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/llm-api-keys/${index}`), {
    method: 'DELETE',
    headers: getAuthHeaders(authToken, sessionId),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la suppression de la clé API LLM`);
  }
}

/**
 * Met à jour une clé API LLM par index.
 */
export async function editLlmApiKeyApi(index: number, provider: string, key: string, baseUrl?: string, model?: string, authToken: string | null = null, sessionId: string | null = null): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/llm-api-keys/${index}`), {
    method: 'PUT',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ provider, key, baseUrl, model }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la mise à jour de la clé API LLM`);
  }
}

/**
 * Définit le fournisseur LLM actif pour la session.
 */
export async function setActiveLlmProviderApi(providerName: string, authToken: null | string, sessionId: null | string): Promise<void> {
  const response = await fetch(buildApiUrl('/api/session/llm-provider'), {
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ providerName }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la définition du fournisseur LLM actif`);
  }
}

/**
 * Teste une clé API LLM auprès du backend.
 */
export async function testLlmApiKey(
  provider: string,
  apiKey: string,
  baseUrl: string | undefined,
  authToken: string | null,
  sessionId: string | null,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(buildApiUrl('/api/llm-keys/test'), {
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ provider, apiKey, baseUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status}` }));
    throw new Error(errorData.message || `Erreur lors du test de la clé API LLM`);
  }

  return await response.json();
}