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
