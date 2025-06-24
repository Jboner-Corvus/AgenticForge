// ===== public/js/api.js (Version Corrigée et Complète) =====

/**
 * Fonction de base pour communiquer avec le serveur FastMCP via le webServer.
 * Elle construit la requête au format JSON-RPC 2.0 attendu par le serveur.
 * * @param {string} method - La méthode MCP (ex: 'tools/list', 'tools/call').
 * @param {object} params - Les paramètres pour la méthode.
 * @param {string} authToken - Le Bearer Token pour l'authentification.
 * @param {string} sessionId - L'ID de session, qui sera placé dans l'en-tête.
 * @returns {Promise<any>} - La réponse du serveur.
 */
async function sendMcpRequest(method, params, authToken, sessionId) {
  // Le point critique : on vérifie que le sessionId existe avant d'envoyer.
  if (!sessionId) {
    throw new Error("Erreur interne: Tentative d'appel API sans Session ID.");
  }

  const response = await fetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      // C'est ici que l'en-tête de session est ajouté.
      'x-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `mcp-client-${Date.now()}`,
      method: method,
      params: params,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Tente de parser le JSON pour un message plus clair, sinon utilise le texte brut.
    try {
      const errorJson = JSON.parse(errorBody);
      throw new Error(
        `Erreur API ${response.status}: ${JSON.stringify(errorJson.error)}`,
      );
    } catch {
      throw new Error(
        `Erreur API ${response.status}: ${errorBody || response.statusText}`,
      );
    }
  }

  const jsonResponse = await response.json();
  if (jsonResponse.error) {
    throw new Error(`Erreur MCP: ${jsonResponse.error.message}`);
  }
  return jsonResponse.result;
}

/**
 * Envoie l'objectif de l'utilisateur au backend en appelant l'outil 'internal_goalHandler'.
 * @param {string} goal - L'objectif décrit par l'utilisateur.
 * @param {string} authToken - Le token d'authentification.
 * @param {string} sessionId - L'ID de la session en cours.
 * @returns {Promise<any>} - Le résultat de l'exécution de l'outil.
 */
export async function sendGoal(goal, authToken, sessionId) {
  const params = {
    name: 'internal_goalHandler',
    arguments: {
      goal: goal,
    },
  };
  const result = await sendMcpRequest(
    'tools/call',
    params,
    authToken,
    sessionId,
  );
  // La réponse de l'outil est un objet avec une propriété `content`.
  // Le premier élément de `content` est le texte de la réponse.
  return result.content[0];
}

/**
 * Récupère la liste des outils disponibles sur le serveur.
 * @param {string} authToken - Le token d'authentification.
 * @param {string} sessionId - L'ID de la session en cours.
 * @returns {Promise<Array>} - Un tableau des outils.
 */
export async function getTools(authToken, sessionId) {
  const result = await sendMcpRequest('tools/list', {}, authToken, sessionId);
  return result.tools || [];
}

/**
 * Teste la santé du serveur en appelant l'endpoint /health.
 * @returns {Promise<boolean>} - true si le serveur est en ligne, false sinon.
 */
export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (e) {
    return false;
  }
}
