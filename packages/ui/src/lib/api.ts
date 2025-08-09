// packages/ui/src/lib/api.ts

/**
 * Construit les en-têtes d'authentification pour les requêtes API.
 */
function getAuthHeaders(
  authToken: string | null,
  sessionId: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Try to get JWT from cookie
  const cookieName = 'agenticforge_jwt=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cookieName) === 0) {
      const jwtToken = c.substring(cookieName.length, c.length);
      if (jwtToken) {
        headers['Authorization'] = 'Bearer ' + jwtToken;
      }
      break;
    }
  }

  // Try to get token from localStorage as fallback
  if (!headers['Authorization']) {
    const localStorageToken = localStorage.getItem('authToken');
    if (localStorageToken) {
      headers['Authorization'] = 'Bearer ' + localStorageToken;
    }
  }

  // Fallback to authToken if provided (e.g., for static API key)
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }

  if (sessionId) {
    headers['X-Session-ID'] = String(sessionId);
  }
  return headers;
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

    const response = await fetch('/api/chat', { // <-- URL Relative
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
    const eventSourceUrl = `/api/chat/stream/${jobId}`;
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
}

export const getTools = async (authToken: string, sessionId: string) => {
  const response = await fetch('/api/tools', { // <-- URL Relative
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
    const response = await fetch('/api/health'); // <-- URL Relative
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
    const response = await fetch(`/api/interrupt/${jobId}`, { // <-- URL Relative
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
export async function saveSessionApi(session: SessionData): Promise<void> {
  const response = await fetch('/api/sessions/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
export async function loadSessionApi(id: string): Promise<SessionData> {
  const response = await fetch(`/api/sessions/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors du chargement de la session`);
  }
  return await response.json();
}

/**
 * Supprime une session.
 */
export async function deleteSessionApi(id: string): Promise<void> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la suppression de la session`);
  }
}

/**
 * Renomme une session.
 */
export async function renameSessionApi(id: string, newName: string): Promise<void> {
  const response = await fetch(`/api/sessions/${id}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
export async function loadAllSessionsApi(): Promise<SessionData[]> {
  const response = await fetch('/api/sessions');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors du chargement de toutes les sessions`);
  }
  return await response.json();
}

/**
 * Récupère les statistiques du leaderboard.
 */
export async function getLeaderboardStats(): Promise<{
  tokensSaved: number;
  successfulRuns: number;
  sessionsCreated: number;
  apiKeysAdded: number;
}> {
  const response = await fetch('/api/leaderboard-stats');
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des statistiques du leaderboard`);
  }
  return await response.json();
}

interface LlmApiKey {
  provider: string;
  key: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Ajoute une clé API LLM.
 */
export async function addLlmApiKeyApi(provider: string, key: string, baseUrl?: string, model?: string): Promise<void> {
  // --- DEBOGAGE: Log uniquement si les données obligatoires sont manquantes ---
  if (!provider || !key) {
    console.warn("WARNING addLlmApiKeyApi: Missing provider or key!", { provider, key, baseUrl, model });
  }
  // --- FIN DEBOGAGE ---
  const response = await fetch('/api/llm-api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, key, baseUrl, model }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de l'ajout de la clé API LLM`);
  }
}

/**
 * Récupère toutes les clés API LLM.
 */
export async function getLlmApiKeysApi(): Promise<LlmApiKey[]> {
  const response = await fetch('/api/llm-api-keys');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la récupération des clés API LLM`);
  }
  return await response.json();
}

/**
 * Supprime une clé API LLM par index.
 */
export async function removeLlmApiKeyApi(index: number): Promise<void> {
  const response = await fetch(`/api/llm-api-keys/${index}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la suppression de la clé API LLM`);
  }
}

/**
 * Met à jour une clé API LLM par index.
 */
export async function editLlmApiKeyApi(index: number, provider: string, key: string, baseUrl?: string, model?: string): Promise<void> {
  const response = await fetch(`/api/llm-api-keys/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch('/api/session/llm-provider', {
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ providerName }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur lors de la définition du fournisseur LLM actif`);
  }
}