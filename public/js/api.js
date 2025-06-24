// ===== public/js/api.js (Correction Finale de la Casse) =====

async function sendMcpRequest(method, params, authToken, sessionId) {
  if (!sessionId) {
    throw new Error("Erreur interne: Tentative d'appel API sans Session ID.");
  }

  const response = await fetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      // --- CORRECTION DÉFINITIVE ---
      // On s'assure que le nom de l'en-tête est en minuscules.
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

// Les autres fonctions restent identiques
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
  return result.content[0];
}

export async function getTools(authToken, sessionId) {
  const result = await sendMcpRequest('tools/list', {}, authToken, sessionId);
  return result.tools || [];
}

export async function testServerHealth() {
  try {
    const response = await fetch('/health');
    return response.ok;
  } catch (e) {
    return false;
  }
}