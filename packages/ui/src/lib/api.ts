import { clientConfig } from '../config.js';

/**
 * Récupère l'historique de la conversation pour la session actuelle.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<Array<unknown>>} Un tableau de messages.
 */
export async function getHistory(authToken: null | string, sessionId: null | string): Promise<Array<unknown>> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/history`, {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error(`Erreur lors de la récupération de l'historique`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur de récupération de l'historique:`, error);
    throw error;
  }
}

/**
 * Récupère le statut d'un job en cours.
 * @param {string} jobId L'ID du job.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<unknown>} L'état actuel du job.
 */
export async function getJobStatus(jobId: string, authToken: null | string, sessionId: null | string): Promise<unknown> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/status/${jobId}`, {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error(`Erreur lors de la récupération du statut`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur de statut du job:`, error);
    throw error;
  }
}

/**
 * Récupère la liste des outils disponibles.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<Array<unknown>>} Un tableau d'outils.
 */
export async function getTools(authToken: null | string, sessionId: null | string): Promise<Array<unknown>> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/tools`, {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error(`Erreur lors de la récupération des outils`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur de récupération des outils:`, error);
    throw error;
  }
}

/**
 * Envoie un message au backend et gère le streaming des événements.
 * @param {string} prompt Le message de l'utilisateur.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @param {(event: MessageEvent) => void} onMessage Callback pour gérer les messages streamés.
 * @returns {Promise<string>} Le jobId de la tâche.
 */
export async function sendMessage(
  prompt: string,
  authToken: null | string,
  sessionId: null | string,
  onMessage: (event: MessageEvent) => void,
  onError: (error: Event) => void,
): Promise<string> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/chat`, {
      body: JSON.stringify({ prompt }),
      headers: getAuthHeaders(authToken, sessionId),
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur du serveur`);
    }

    const { jobId } = await response.json();

    // Establish SSE connection for streaming updates
    const eventSource = new EventSource(`${clientConfig.VITE_APP_API_BASE_URL}/api/chat/stream/${jobId}`);

    eventSource.onmessage = onMessage;

    eventSource.onerror = (error) => {
      console.error(`EventSource failed:`, error);
      onError(error);
      eventSource.close();
    };

    return jobId;
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message ou de la connexion SSE:`, error);
    throw error;
  }
}

/**
 * Teste la santé du serveur.
 * @returns {Promise<boolean>} True si le serveur est sain, false sinon.
 */
export async function testServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error(`Erreur lors de la vérification de la santé du serveur:`, error);
    return false;
  }
}

/**
 * Interrompt un job en cours.
 * @param {string} jobId L'ID du job à interrompre.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<void>}
 */
export async function interrupt(jobId: string, authToken: null | string, sessionId: null | string): Promise<void> {
  try {
    const response = await fetch(`${clientConfig.VITE_APP_API_BASE_URL}/api/interrupt/${jobId}`, {
      method: 'POST',
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de l'interruption du job`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'interruption du job:`, error);
    throw error;
  }
}

function getAuthHeaders(
  authToken: string | null,
  sessionId: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }
  if (sessionId) {
    headers['X-Session-ID'] = String(sessionId);
  }
  return headers;
}