// public/js/api.js (version corrigée et fonctionnelle)

const API_ENDPOINT = '/mcp'; // Un seul endpoint pour toutes les communications

/**
 * Envoie un objectif à l'agent en utilisant un appel d'outil FastMCP.
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

  const body = {
    jsonrpc: '2.0',
    method: 'tool/call',
    params: {
      name: 'internal_goalHandler',
      arguments: {
        goal: goal,
        sessionId: sessionId || '',
      },
    },
    id: `mcp-goal-${Date.now()}`,
  };

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Corps de l'erreur de l'API:", errorBody);
    throw new Error(`Erreur API ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Erreur MCP: ${data.error.message}`);
  }
  return data.result;
}

/**
 * Récupère le nombre d'outils en utilisant la méthode FastMCP `tools/list`.
 * @param {string} token - Le Bearer Token pour l'authentification.
 * @param {string} sessionId - L'ID de session pour l'authentification. // CORRECTION : Ajout du paramètre
 * @returns {Promise<number | string>} Le nombre d'outils ou 'N/A' en cas d'erreur.
 */
export async function getToolCount(token, sessionId) { // CORRECTION : Ajout du paramètre
  if (!token) {
    console.warn('getToolCount skipped: no token provided.');
    return 0;
  }

  const body = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: `mcp-tools-${Date.now()}`,
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // CORRECTION : Ajout de l'en-tête de session s'il est fourni
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Erreur API (getToolCount) ${response.status}: ${errorBody}`,
      );
      // CORRECTION : Propager l'erreur pour que le message s'affiche dans l'UI
      throw new Error(`Erreur API ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error(`Erreur MCP (getToolCount): ${data.error.message}`);
      // CORRECTION : Propager l'erreur pour que le message s'affiche dans l'UI
      throw new Error(`Erreur MCP: ${JSON.stringify(data.error)}`);
    }

    return data.result?.tools?.length || 0;
  } catch (error) {
    console.error('Fetch error in getToolCount:', error);
    // CORRECTION : Relancer l'erreur pour que l'UI puisse la capturer
    throw error;
  }
}