/**
 * src/utils/llmProvider.ts
 *
 * Centralise les appels au modèle de langage (LLM).
 * Abstrait la logique pour communiquer avec différentes APIs (Ollama, OpenAI, etc.).
 */
import { config } from '../config.js';
import logger from '../logger.js';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Pour l'instant, on se concentre sur une structure compatible Ollama.
// On pourrait facilement étendre cela pour supporter d'autres fournisseurs.
export async function getLlmResponse(prompt: string, systemPrompt?: string): Promise<string> {
  const log = logger.child({ module: 'LLMProvider' });

  // Utilise l'URL de base si elle est définie (pour Ollama, etc.)
  const apiUrl = config.LLM_API_BASE_URL
    ? `${config.LLM_API_BASE_URL}/api/chat`
    : 'https://api.openai.com/v1/chat/completions'; // Fallback pour OpenAI

  const messages: LLMMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  // Le prompt de l'orchestrateur contient déjà l'historique, donc on le passe en tant que 'user'
  messages.push({ role: 'user', content: prompt });

  const body = JSON.stringify({
    model: config.LLM_MODEL_NAME,
    messages: messages,
    stream: false, // On ne streame pas la réponse du LLM à l'orchestrateur
  });

  try {
    log.debug({ apiUrl, model: config.LLM_MODEL_NAME }, 'Sending request to LLM');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.LLM_API_KEY}`,
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    log.debug({ response: data }, 'Received response from LLM');

    // La structure de la réponse varie selon le fournisseur
    const content = data.choices?.[0]?.message?.content || data.message?.content;

    if (!content) {
      throw new Error('Invalid response structure from LLM API');
    }

    return content.trim();
  } catch (error) {
    log.error({ err: error }, 'Failed to get response from LLM');
    // Renvoie une erreur formatée que l'agent peut interpréter
    return `<tool_code>{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}</tool_code>`;
  }
}
