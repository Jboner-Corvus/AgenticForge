// public/js/api.js

// L'URL de l'API pointe maintenant directement vers l'endpoint MCP que nous allons exposer.
const API_STREAM_URL = '/mcp'; // MODIFIÉ
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

  // MODIFIÉ : Construire le corps de la requête au format FastMCP pour appeler un outil.
  const body = {
    jsonrpc: '2.0',
    method: 'tool/call',
    params: {
      name: 'internal_goalHandler', // Le nom de l'outil interne qui démarre la boucle de l'agent
      arguments: {
        goal: goal,
        sessionId: sessionId || '', // Le paramètre `sessionId` est attendu par votre outil
      },
    },
    id: `mcp-${Date.now()}`, // Un ID de requête unique
  };

  const response = await fetch(API_STREAM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body), // Envoyer le corps de requête formaté
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Affiche le corps de l'erreur pour un meilleur débogage
    console.error("Corps de l'erreur de l'API:", errorBody);
    throw new Error(`Erreur API ${response.status}: ${errorBody}`);
  }

  return response.json();
}

/**
 * Récupère le nombre d'outils détectés depuis le serveur.
 * @returns {Promise<number>} Le nombre d'outils.
 */
export async function getToolCount() {
  // Cette partie ne change pas car elle ne semble pas utiliser FastMCP
  const response = await fetch(API_TOOLS_COUNT_URL);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Erreur API ${response.status}: ${errorBody}`);
    return 'Erreur';
  }

  const data = await response.json();
  return data.toolCount;
}
