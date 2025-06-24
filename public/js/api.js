// ===== public/js/api.js (Version Finale pour le Mode Inspector) =====

/**
 * Fonction de base pour communiquer avec le serveur FastMCP via le nouveau proxy.
 * Elle gère l'en-tête de session 'mcp-session-id' et la création de nouvelles sessions.
 * @param {string} method - La méthode MCP (ex: 'tools/list').
 * @param {object} params - Les paramètres pour la méthode.
 * @param {string} authToken - Le Bearer Token pour l'authentification.
 * @param {string | null} sessionId - L'ID de session actuel, peut être null pour la première requête.
 * @returns {Promise<any>} - La réponse du serveur.
 */
async function sendMcpRequest(method, params, authToken, sessionId) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // Le framework s'attend à cet en-tête spécifique pour identifier une session existante.
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const response = await fetch('/mcp', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `mcp-client-${Date.now()}`,
      method: method,
      params: params,
    }),
  });

  // --- GESTION DE LA NOUVELLE SESSION ---
  // Le proxy peut créer une nouvelle session et nous renvoyer l'ID.
  const newSessionId = response.headers.get('mcp-session-id');
  if (newSessionId && newSessionId !== sessionId) {
    console.log('Nouveau session ID reçu du serveur:', newSessionId);
    // On sauvegarde le nouvel ID de session.
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    // On recharge la page pour que toute l'interface utilise la nouvelle session.
    // C'est la manière la plus robuste de garantir la cohérence.
    window.location.reload();
    // On lève une erreur pour stopper l'exécution du code actuel, car la page va recharger.
    throw new Error('Nouvelle session créée. Rechargement de la page...');
  }

  if (!response.ok) {
    const errorBody = await response.text();
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
 * Envoie l'objectif de l'utilisateur au backend.
 * @param {string} goal - L'objectif.
 * @param {string} authToken - Le token d'authentification.
 * @param {string} sessionId - L'ID de session.
 * @returns {Promise<any>}
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
 * Récupère la liste des outils disponibles.
 * @param {string} authToken - Le token d'authentification.
 * @param {string} sessionId - L'ID de session.
 * @returns {Promise<Array>}
 */
export async function getTools(authToken, sessionId) {
  const result = await sendMcpRequest('tools/list', {}, authToken, sessionId);
  return result.tools || [];
}

/**
 * Teste la santé du serveur.
 * @returns {Promise<boolean>}
 */
export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (e) {
    return false;
  }
}
