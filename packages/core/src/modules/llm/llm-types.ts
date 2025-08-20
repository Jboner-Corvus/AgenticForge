import { LlmKeyErrorType } from './LlmKeyManager.ts';

export interface LlmApiKey {
  apiKey: string;
  apiModel: string;
  apiProvider: string;
  baseUrl?: string;
  errorCount: number;
  isDisabledUntil?: number;
  isPermanentlyDisabled?: boolean;
  lastUsed?: number;
}

export interface LLMContent {
  parts: { text: string }[];
  role: 'model' | 'tool' | 'user';
}

export interface ILlmProvider {
  getErrorType(statusCode: number, errorBody: string): LlmKeyErrorType;
  getLlmResponse(
    messages: LLMContent[],
    systemPrompt?: string,
    apiKey?: string,
    modelName?: string,
  ): Promise<string>;
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmError';
  }
}

export { LlmKeyErrorType };
