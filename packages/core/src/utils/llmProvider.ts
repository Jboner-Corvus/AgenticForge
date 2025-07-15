// src/utils/llmProvider.ts (version corrigée et robuste)

import { config } from '../config.js';
import logger from '../logger.js';

export interface LLMContent {
  parts: { text: string }[];
  role: 'model' | 'user';
}

interface LLMProvider {
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string>;
}

class GeminiProvider implements LLMProvider {
  async getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
  ): Promise<string> {
    const log = logger.child({ module: 'GeminiProvider' });
    const maxRetries = 5;
    const initialDelay = 1000; // 1 seconde

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${config.LLM_MODEL_NAME}:generateContent?key=${config.LLM_API_KEY}`;

    const contents: LLMContent[] = [];

    // Handle system prompt by prepending it to the first user message
    // or creating a new user message if the history is empty.
    if (systemPrompt) {
      if (messages.length > 0 && messages[0].role === 'user') {
        messages[0].parts[0].text = `${systemPrompt}\n\n${messages[0].parts[0].text}`;
      } else {
        contents.push({ parts: [{ text: systemPrompt }], role: 'user' });
      }
    }
    contents.push(...messages);

    const body = JSON.stringify({ contents });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log.debug(
          { apiUrl, attempt, model: config.LLM_MODEL_NAME },
          'Sending request to Google Gemini API v1',
        );

        const response = await fetch(apiUrl, {
          body,
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          if (response.status >= 500 && attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            log.warn(
              `Gemini API request failed with status ${response.status}. Retrying in ${delay}ms...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          const errorBody = await response.text();
          const errorMessage = `Gemini API request failed with status ${response.status}: ${errorBody}`;
          log.error(
            { errorBody, status: response.status },
            errorMessage,
          );
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
      } catch (error) {
        log.error({ err: error }, 'Failed to get response from LLM');
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          log.warn(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return `{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM after multiple retries: ${errorMessage}"}}`;
        }
      }
    }
    return `{"tool": "error", "parameters": {"message": "LLM request failed after multiple retries."}}`;
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
