export interface LlmApiKey {
  errorCount?: number; // Number of consecutive errors for temporary errors
  isDisabledUntil?: number; // Timestamp until which key is disabled (for temporary errors)
  isPermanentlyDisabled?: boolean; // Flag for permanently disabled keys
  key: string;
  lastUsed?: number; // Timestamp of last use
  provider: string;
}

// packages/core/src/llm-types.ts
export interface LLMContent {
  parts: { text: string }[];
  role: 'model' | 'tool' | 'user';
}
