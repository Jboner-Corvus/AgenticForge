// packages/core/src/llm-types.ts
export interface LLMContent {
  parts: { text: string }[];
  role: 'model' | 'user';
}
