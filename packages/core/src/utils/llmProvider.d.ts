interface GeminiContent {
  parts: {
    text: string;
  }[];
  role: 'model' | 'user';
}
export declare function getLlmResponse(
  messages: GeminiContent[],
  systemPrompt?: string,
): Promise<string>;
export {};
//# sourceMappingURL=llmProvider.d.ts.map
