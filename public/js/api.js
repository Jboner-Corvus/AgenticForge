// public/js/api.js
const API_ENDPOINT = '/mcp';

async function sendMcpRequest(method, params, token, sessionId) {
  if (!token || !sessionId) {
    throw new Error('Le token ET le sessionId sont obligatoires pour toute requête API.');
  }

  // CORRECTION : On standardise le nom de l'en-tête en minuscules.
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-session-id': sessionId,
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
      } catch (e) {}
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

export async function sendGoal(goal, token, sessionId) {
  return sendMcpRequest(
    'tools/call',
    { name: 'internal_goalHandler', arguments: { goal } },
    token,
    sessionId
  );
}

export async function getTools(token, sessionId) {
  return sendMcpRequest('tools/list', {}, token, sessionId);
}

export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}