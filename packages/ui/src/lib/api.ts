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
  const name = 'agenticforge_jwt=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      const jwtToken = c.substring(name.length, c.length);
      if (jwtToken) {
        headers['Authorization'] = 'Bearer ' + jwtToken;
      }
      break;
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
): Promise<{ jobId: string; eventSource: EventSource }> {
  try {
    const response = await fetch('/api/chat', { // <-- URL Relative
      method: 'POST',
      headers: getAuthHeaders(authToken, sessionId),
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // NOTE: Ensure the backend always returns meaningful error messages
      // for better client-side debugging and user feedback.
      throw new Error(errorData.message || `Erreur du serveur: ${response.status} ${response.statusText}`);
    }

    const { jobId } = await response.json();
    
    // Établit la connexion SSE pour les mises à jour en streaming
    const eventSource = new EventSource(`/api/chat/stream/${jobId}`); // <-- URL Relative

    eventSource.onmessage = onMessage;
    eventSource.onerror = (error) => {
      console.error(`EventSource failed:`, error);
      onError(error);
      // eventSource.close(); // Do not close here, let the hook manage it
    };

    return { jobId, eventSource };
  } catch (error) {
    console.error('Error in sendMessage:', error);
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