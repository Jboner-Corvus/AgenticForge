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
  if (authToken) {
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
  onError: (error: Event) => void,
): Promise<string> {
  const response = await fetch('/api/chat', { // <-- URL Relative
    method: 'POST',
    headers: getAuthHeaders(authToken, sessionId),
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Erreur du serveur`);
  }

  const { jobId } = await response.json();
  
  // Établit la connexion SSE pour les mises à jour en streaming
  const eventSource = new EventSource(`/api/chat/stream/${jobId}`); // <-- URL Relative

  eventSource.onmessage = onMessage;
  eventSource.onerror = (error) => {
    console.error(`EventSource failed:`, error);
    onError(error);
    eventSource.close();
  };

  return jobId;
}

/**
 * Récupère la liste des outils disponibles.
 */
export async function getTools(authToken: null | string, sessionId: null | string): Promise<Array<unknown>> {
  const response = await fetch('/api/tools', { // <-- URL Relative
    headers: getAuthHeaders(authToken, sessionId),
  });
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des outils`);
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