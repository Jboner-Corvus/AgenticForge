function getAuthHeaders(authToken: string | null, sessionId: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }
  return headers;
}

/**
 * Envoie un message au backend et gère le streaming des événements.
 * @param {string} prompt Le message de l'utilisateur.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @param {(event: MessageEvent) => void} onMessage Callback pour gérer les messages streamés.
 * @returns {Promise<string>} Le jobId de la tâche.
 */
export async function sendMessage(prompt: string, authToken: string | null, sessionId: string | null, onMessage: (event: MessageEvent) => void): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: getAuthHeaders(authToken, sessionId),
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur du serveur');
    }

    const { jobId } = await response.json();

    // Establish SSE connection for streaming updates
    const eventSource = new EventSource(`/api/chat/stream/${jobId}`);

    eventSource.onmessage = onMessage;

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return jobId;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message ou de la connexion SSE:", error);
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
export async function getJobStatus(jobId: string, authToken: string | null, sessionId: string | null): Promise<unknown> {
  try {
    const response = await fetch(`/api/status/${jobId}`, {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error("Erreur lors de la récupération du statut");
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de statut du job:', error);
    throw error;
  }
}

/**
 * Récupère l'historique de la conversation pour la session actuelle.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<Array<unknown>>} Un tableau de messages.
 */
export async function getHistory(authToken: string | null, sessionId: string | null): Promise<Array<unknown>> {
  try {
    const response = await fetch('/api/history', {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error("Erreur lors de la récupération de l'historique");
    }
    return await response.json();
  } catch (error) {
    console.error("Erreur de récupération de l'historique:", error);
    throw error;
  }
}

/**
 * Teste la santé du serveur.
 * @returns {Promise<boolean>} True si le serveur est sain, false sinon.
 */
export async function testServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la vérification de la santé du serveur:', error);
    return false;
  }
}

/**
 * Récupère la liste des outils disponibles.
 * @param {string | null} authToken Le token d'authentification.
 * @param {string | null} sessionId L'ID de session.
 * @returns {Promise<Array<unknown>>} Un tableau d'outils.
 */
export async function getTools(authToken: string | null, sessionId: string | null): Promise<Array<unknown>> {
  try {
    const response = await fetch('/api/tools', {
      headers: getAuthHeaders(authToken, sessionId),
    });
    if (!response.ok) {
      await response.json();
      throw new Error('Erreur lors de la récupération des outils');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de récupération des outils:', error);
    throw error;
  }
}