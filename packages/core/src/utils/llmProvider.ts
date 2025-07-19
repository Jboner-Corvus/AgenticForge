import { config } from '../config.js';
import { LLMContent } from '../llm-types.js';
import logger from '../logger.js';

interface LLMProvider {
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string>;
}

class GeminiProvider implements LLMProvider {
  public async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'GeminiProvider' });

    if (!config.LLM_API_KEY) {
      const errorMessage = 'LLM_API_KEY is not configured.';
      log.error(errorMessage);
      return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${config.LLM_MODEL_NAME}:generateContent?key=${config.LLM_API_KEY}`;

    if (systemPrompt) {
      messages.unshift({
        parts: [{ text: systemPrompt }],
        role: 'user',
      });
    }

    const requestBody = {
      contents: messages,
    };

    const body = JSON.stringify(requestBody);

    const response = await fetch(apiUrl, {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
      log.error({ errorBody, status: response.status }, errorMessage);
      return `{"tool": "error", "parameters": {"message": "${errorMessage}"}}`;
    }

    const data = await response.json();

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      log.error(
        { response: data },
        'Invalid response structure from Gemini API',
      );
      return `{"tool": "error", "parameters": {"message": "Invalid response structure from Gemini API. The model may have returned an empty response."}}`;
    }
    return content.trim();
  }
}

let currentLlmProvider: LLMProvider;

switch (config.LLM_PROVIDER) {
  case 'gemini':
    currentLlmProvider = new GeminiProvider();
    break;
  default:
    logger.warn(
      `Unknown LLM_PROVIDER: ${config.LLM_PROVIDER}. Defaulting to GeminiProvider.`,
    );
    currentLlmProvider = new GeminiProvider();
    break;
}

export const llmProvider = currentLlmProvider;
