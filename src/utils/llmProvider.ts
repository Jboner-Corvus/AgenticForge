// --- Fichier : src/utils/llmProvider.ts (Modifié pour Google Gemini) ---
import { config } from '../config.js';
import logger from '../logger.js';

// Interface pour le format de contenu de l'API Gemini
interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getLlmResponse(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const log = logger.child({ module: 'LLMProvider' });

  // Construit l'URL pour l'API Google Gemini
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.LLM_MODEL_NAME}:generateContent?key=${config.LLM_API_KEY}`;

  // Transformation des messages au format requis par Gemini
  const contents: GeminiContent[] = [];
  if (systemPrompt) {
    // Gemini gère les instructions système différemment. On peut les préfixer au prompt utilisateur.
    prompt = `${systemPrompt}\n\n${prompt}`;
  }

  // Le prompt de l'orchestrateur contient déjà l'historique, on le passe en tant que 'user'
  contents.push({
    role: 'user', // Pour Gemini, le rôle est 'user'
    parts: [{ text: prompt }],
  });

  const body = JSON.stringify({
    contents: contents,
    // On peut ajouter ici des safetySettings ou generationConfig si nécessaire
  });

  try {
    log.debug(
      { apiUrl, model: config.LLM_MODEL_NAME },
      'Sending request to Google Gemini API',
    );

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      log.error(
        { status: response.status, errorBody },
        'Gemini API request failed',
      );
      throw new Error(
        `Gemini API request failed with status ${response.status}: ${errorBody}`,
      );
    }

    const data = await response.json();
    log.debug('Received response from Gemini API');

    // La structure de la réponse de Gemini est différente
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      log.error(
        { response: data },
        'Invalid response structure from Gemini API',
      );
      throw new Error('Invalid response structure from Gemini API');
    }

    return content.trim();
  } catch (error) {
    log.error({ err: error }, 'Failed to get response from LLM');
    // Renvoie une erreur formatée que l'agent peut interpréter
    return `<tool_code>{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}</tool_code>`;
  }
}
