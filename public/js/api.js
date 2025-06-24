// public/js/api.js (Version stricte avec contrat de session)

const API_ENDPOINT = '/mcp';

/**
 * Envoie un objectif à l'agent avec token et session ID OBLIGATOIRES
 * @param {string} goal - L'objectif de l'utilisateur
 * @param {string} token - Le Bearer Token (REQUIS)
 * @param {string} sessionId - L'ID de session (REQUIS)
 * @returns {Promise<Object>} - Résultat de l'exécution
 */
export async function sendGoal(goal, token, sessionId) {
  // VALIDATION STRICTE : Les deux paramètres sont obligatoires
  if (!token) {
    throw new Error("Le Bearer Token est obligatoire pour sendGoal().");
  }
  
  if (!sessionId) {
    throw new Error("Le Session ID est obligatoire pour sendGoal().");
  }

  console.log('🚀 [API] Sending goal with strict session contract', {
    goal: goal.substring(0, 50) + '...',
    hasToken: !!token,
    sessionId: sessionId.substring(0, 12) + '...'
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'mcp-session-id': sessionId, // CORRECTION : Utilisation du header standard de FastMCP
  };

  const body = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'internal_goalHandler',
      arguments: { 
        goal: goal, 
        sessionId: sessionId 
      },
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
      console.error('❌ [API] Goal request failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Analyser le type d'erreur pour donner un message spécifique
      if (response.status === 400 && errorText.includes('session')) {
        throw new Error('Session invalide ou expirée. Veuillez rafraîchir la page pour créer une nouvelle session.');
      } else if (response.status === 401) {
        throw new Error("Token d'authentification invalide. Veuillez vérifier votre Bearer Token.");
      } else {
        throw new Error(`Erreur API ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ [API] MCP Error in goal response', data.error);
      throw new Error(`Erreur MCP: ${data.error.message}`);
    }

    console.log('✅ [API] Goal executed successfully');
    return data.result;

  } catch (error) {
    console.error('❌ [API] Exception in sendGoal', error);
    throw error;
  }
}

/**
 * Récupère le nombre d'outils disponibles avec token et session ID OBLIGATOIRES
 * @param {string} token - Le Bearer Token (REQUIS)
 * @param {string} sessionId - L'ID de session (REQUIS)
 * @returns {Promise<number>} - Nombre d'outils disponibles
 */
export async function getToolCount(token, sessionId) {
  // VALIDATION STRICTE : Les deux paramètres sont obligatoires
  if (!token) {
    throw new Error("Le Bearer Token est obligatoire pour getToolCount().");
  }
  
  if (!sessionId) {
    throw new Error("Le Session ID est obligatoire pour getToolCount().");
  }

  console.log('🔧 [API] Getting tool count with strict session contract', {
    hasToken: !!token,
    sessionId: sessionId.substring(0, 12) + '...'
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'mcp-session-id': sessionId, // CORRECTION : Utilisation du header standard de FastMCP
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
      console.error('❌ [API] Tool count request failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // Analyser le type d'erreur
      if (response.status === 400 && errorText.includes('session')) {
        throw new Error("Session invalide pour récupérer les outils. Session ID requis.");
      } else if (response.status === 401) {
        throw new Error("Token d'authentification invalide pour récupérer les outils.");
      } else {
        throw new Error(`Erreur API ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ [API] MCP Error in tools list', data.error);
      throw new Error(`Erreur MCP: ${JSON.stringify(data.error)}`);
    }

    const toolCount = data.result?.tools?.length || 0;
    console.log('✅ [API] Tool count retrieved', { count: toolCount });
    
    return toolCount;

  } catch (error) {
    console.error('❌ [API] Exception in getToolCount', error);
    throw error;
  }
}

/**
 * Teste la santé de la connexion server
 * @returns {Promise<boolean>} - true si le serveur répond
 */
export async function testServerHealth() {
  try {
    console.log('🏥 [API] Testing server health...');
    
    const response = await fetch('/health');
    const isHealthy = response.ok;
    
    console.log(isHealthy ? '✅ [API] Server is healthy' : '❌ [API] Server health check failed', {
      status: response.status,
      statusText: response.statusText
    });
    
    return isHealthy;
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
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validation du token
  if (!token) {
    validation.isValid = false;
    validation.errors.push('Bearer Token manquant');
  } else if (token.length < 10) {
    validation.warnings.push('Bearer Token semble très court');
  }

  // Validation du session ID
  if (!sessionId) {
    validation.isValid = false;
    validation.errors.push('Session ID manquant');
  } else if (!sessionId.includes('-') || sessionId.length < 20) {
    validation.warnings.push('Session ID ne semble pas avoir le bon format');
  }

  console.log('🔍 [API] Session contract validation', validation);
  return validation;
}