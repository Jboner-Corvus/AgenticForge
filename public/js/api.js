// public/js/api.js

const API_ENDPOINT = '/mcp'; // REVENIR à l'endpoint par défaut

/**
 * Envoie un objectif à l'agent avec token et session ID OBLIGATOIRES
 * @param {string} goal - L'objectif de l'utilisateur
 * @param {string} token - Le Bearer Token (REQUIS)
 * @param {string} sessionId - L'ID de session (REQUIS)
 * @returns {Promise<Object>} - Résultat de l'exécution
 */
export async function sendGoal(goal, token, sessionId) {
  if (!token) throw new Error("Le Bearer Token est obligatoire pour sendGoal().");
  if (!sessionId) throw new Error("Le Session ID est obligatoire pour sendGoal().");

  console.log('🚀 [API] Sending goal with strict session contract', {
    goal: goal.substring(0, 50) + '...',
    sessionId: sessionId.substring(0, 12) + '...'
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'mcp-session-id': sessionId,
  };

  const body = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'internal_goalHandler',
      arguments: { goal: goal, sessionId: sessionId },
    },
    id: `mcp-goal-${Date.now()}`,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Goal request failed', { status: response.status, error: errorText });
      throw new Error(`Erreur API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(`Erreur MCP: ${data.error.message}`);
    return data.result;
  } catch (error) {
    console.error('❌ [API] Exception in sendGoal', error);
    throw error;
  }
}

/**
 * Récupère le nombre d'outils disponibles
 * @param {string} token - Le Bearer Token (REQUIS)
 * @param {string} sessionId - L'ID de session (REQUIS)
 * @returns {Promise<number>} - Nombre d'outils
 */
export async function getToolCount(token, sessionId) {
  if (!token) throw new Error("Le Bearer Token est obligatoire pour getToolCount().");
  if (!sessionId) throw new Error("Le Session ID est obligatoire pour getToolCount().");

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'mcp-session-id': sessionId,
  };

  const body = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: `mcp-tools-${Date.now()}`,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Tool count request failed', { status: response.status, error: errorText });
      throw new Error(`Erreur API ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(`Erreur MCP: ${JSON.stringify(data.error)}`);
    return data.result?.tools?.length || 0;
  } catch (error) {
    console.error('❌ [API] Exception in getToolCount', error);
    throw error;
  }
}

// ... le reste des fonctions (testServerHealth, validateSessionContract) reste inchangé
/**
 * Teste la santé de la connexion server
 * @returns {Promise<boolean>} - true si le serveur répond
 */
export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (error) {
    console.error('❌ [API] Health check exception', error);
    return false;
  }
}

/**
 * Valide qu'un token et un session ID sont présents et corrects
 * @param {string} token - Le Bearer Token à valider
 * @param {string} sessionId - Le Session ID à valider
 * @returns {Object} - Résultat de la validation
 */
export function validateSessionContract(token, sessionId) {
  const validation = { isValid: true, errors: [], warnings: [] };
  if (!token) {
    validation.isValid = false;
    validation.errors.push('Bearer Token manquant');
  }
  if (!sessionId) {
    validation.isValid = false;
    validation.errors.push('Session ID manquant');
  }
  return validation;
}