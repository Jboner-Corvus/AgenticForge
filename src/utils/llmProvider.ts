// src/utils/llmProvider.ts (version corrigée et robuste)

import { config } from '../config.js';
import logger from '../logger.js';

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getLlmResponse(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const log = logger.child({ module: 'LLMProvider' });

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${config.LLM_MODEL_NAME}:generateContent?key=${config.LLM_API_KEY}`;

  const contents: GeminiContent[] = [];
  if (systemPrompt) {
    prompt = `${systemPrompt}\n\n${prompt}`;
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const body = JSON.stringify({ contents });

  try {
    log.debug(
      { apiUrl, model: config.LLM_MODEL_NAME },
      'Sending request to Google Gemini API v1',
    );

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      log.error(
        { response: data },
        'Invalid response structure from Gemini API',
      );
      return `<tool_code>{"tool": "error", "parameters": {"message": "Invalid response structure from Gemini API. The model may have returned an empty response."}}</tool_code>`;
    }
    return content.trim();

  } catch (error) {
    log.error({ err: error }, 'Failed to get response from LLM');
    return `<tool_code>{"tool": "error", "parameters": {"message": "Failed to communicate with the LLM."}}</tool_code>`;
  }
}