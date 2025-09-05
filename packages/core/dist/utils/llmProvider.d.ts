interface GeminiContent {
  parts: {
    text: string;
  }[];
  role: 'model' | 'user';
}
declare function getLlmResponse(
  messages: GeminiContent[],
  systemPrompt?: string,
): Promise<string>;

export { getLlmResponse };
