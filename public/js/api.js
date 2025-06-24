// public/js/api.js (Version avec en-tête de session)

const API_ENDPOINT = '/mcp';

// La fonction de validation n'est plus nécessaire ici car le serveur gère la présence de l'en-tête.

async function sendMcpRequest(method, params, token, sessionId) {
  if (!token || !sessionId) {
    const errorMessage = 'Le token ET le sessionId sont obligatoires pour toute requête API.';
    console.error(`❌ [API] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // CORRECTION : On ajoute notre en-tête personnalisé et non-conflictuel.
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Session-ID': sessionId,
  };

  const body = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: `mcp-${Date.now()}`,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erreur API ${response.status}: ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = `Erreur API ${response.status}: ${errorJson.error?.message || errorText}`;
      } catch (e) { /* Pas de JSON, on garde le texte brut */ }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Erreur MCP (${data.error.code}): ${data.error.message}`);
    }
    return data.result;

  } catch (error) {
    console.error(`❌ [API] Exception durant l'appel MCP '${method}'`, error);
    throw error;
  }
}

// CORRECTION : sendGoal n'a plus besoin d'inclure sessionId dans les arguments.
export async function sendGoal(goal, token, sessionId) {
  return sendMcpRequest(
    'tools/call',
    { name: 'internal_goalHandler', arguments: { goal } }, // Juste le 'goal'
    token,
    sessionId
  );
}

export async function getTools(token, sessionId) {
  const result = await sendMcpRequest('tools/list', {}, token, sessionId);
  return result.tools || [];
}

export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (error) {
    console.error('❌ [API] Health check a échoué', error);
    return false;
  }
}