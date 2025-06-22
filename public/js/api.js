// public/js/api.js

const API_STREAM_URL = '/api/v1/agent/stream';
const API_TOOLS_COUNT_URL = '/api/v1/tools/count';

/**
 * Envoie un objectif à l'agent.
 * @param {string} goal - L'objectif de l'utilisateur.
 * @param {string} token - Le Bearer Token fourni par l'utilisateur.
 * @param {string | null} sessionId - L'ID de session, si existant.
 * @returns {Promise<any>} La réponse de l'API.
 */
export async function sendGoal(goal, token, sessionId) {
  if (!token) {
    throw new Error('Le Bearer Token est manquant. Veuillez le renseigner.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  const response = await fetch(API_STREAM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ goal }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erreur API ${response.status}: ${errorBody}`);
  }

  return response.json();
}

/**
 * Récupère le nombre d'outils détectés depuis le serveur.
 * @returns {Promise<number>} Le nombre d'outils.
 */
export async function getToolCount() {
  const response = await fetch(API_TOOLS_COUNT_URL);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Erreur API ${response.status}: ${errorBody}`);
    return 'Erreur';
  }

  const data = await response.json();
  return data.toolCount;
}
