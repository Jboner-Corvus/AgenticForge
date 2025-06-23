// public/js/api.js

const API_ENDPOINT = '/mcp';

export async function sendGoal(goal, token, sessionId) {
  if (!token) {
    throw new Error('Le Bearer Token est manquant.');
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
      arguments: { goal: goal, sessionId: sessionId || '' },
    },
    id: `mcp-goal-${Date.now()}`,
  };

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`Erreur MCP: ${data.error.message}`);
  }
  return data.result;
}

export async function getToolCount(token, sessionId) {
  if (!token || !sessionId) {
    throw new Error('Token ou Session ID manquant pour getToolCount.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    // La ligne la plus importante pour corriger l'erreur
    'X-Session-ID': sessionId,
  };

  const body = {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: `mcp-tools-${Date.now()}`,
  };

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`Erreur MCP: ${JSON.stringify(data.error)}`);
  }
  return data.result?.tools?.length || 0;
}