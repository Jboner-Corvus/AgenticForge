// public/js/api.js

const API_ENDPOINT = '/mcp';

/**
 * Envoie une requête générique à l'agent en utilisant le protocole MCP.
 * @param {string} method - La méthode MCP à appeler (ex: 'tools/list', 'tools/call').
 * @param {object} params - Les paramètres pour la méthode.
 * @param {string} token - Le Bearer Token pour l'authentification.
 * @param {string} sessionId - L'ID de session pour la continuité.
 * @returns {Promise<any>} - Le résultat de l'appel MCP.
 */
async function sendMcpRequest(method, params, token, sessionId) {
  if (!token || !sessionId) {
    const errorMessage = 'Le Bearer Token et le Session ID sont obligatoires.';
    console.error(`❌ [API] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    // LA CORRECTION CRUCIALE EST ICI !
    'mcp-session-id': sessionId,
  };

  const body = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: `mcp-${method.split('/')[1]}-${Date.now()}`,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API] La requête MCP a échoué`, { status: response.status, error: errorText, method });
      // Tente de parser l'erreur JSON, sinon retourne le texte brut
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Erreur API ${response.status}: ${errorJson.error.message || errorText}`);
      } catch (e) {
        throw new Error(`Erreur API ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    if (data.error) {
      console.error('❌ [API] Erreur dans la réponse MCP', data.error);
      throw new Error(`Erreur MCP (${data.error.code}): ${data.error.message}`);
    }
    return data.result;

  } catch (error) {
    console.error(`❌ [API] Exception dans sendMcpRequest pour la méthode '${method}'`, error);
    throw error;
  }
}

/**
 * Envoie un objectif à l'agent.
 * @param {string} goal - L'objectif de l'utilisateur.
 * @param {string} token - Le Bearer Token.
 * @param {string} sessionId - L'ID de session.
 * @returns {Promise<Object>} - Le résultat de l'exécution.
 */
export async function sendGoal(goal, token, sessionId) {
  return sendMcpRequest(
    'tools/call',
    { name: 'internal_goalHandler', arguments: { goal, sessionId } },
    token,
    sessionId
  );
}

/**
 * Récupère la liste et le nombre d'outils disponibles.
 * @param {string} token - Le Bearer Token.
 * @param {string} sessionId - L'ID de session.
 * @returns {Promise<Array<Object>>} - La liste des outils.
 */
export async function getTools(token, sessionId) {
    const result = await sendMcpRequest('tools/list', {}, token, sessionId);
    return result.tools || [];
}


/**
 * Teste la santé de la connexion au serveur web.
 * @returns {Promise<boolean>} - true si le serveur répond.
 */
export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (error) {
    console.error('❌ [API] Health check a échoué', error);
    return false;
  }
}