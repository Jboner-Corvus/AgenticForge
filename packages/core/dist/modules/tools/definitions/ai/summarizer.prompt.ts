const PROMPT_TEMPLATE = `Please provide a concise summary of the following text.
Focus on the key points and main conclusions.
The summary should be approximately 1/4 of the original text length.

Original Text:
---
%s
---

Summary:`;
const getSummarizerPrompt = (textToSummarize: string) => {
  // NOTE: Direct string replacement. For production, consider:
  // 1. Input sanitization to prevent prompt injection if `textToSummarize` comes from untrusted sources.
  // 2. Handling very long texts to stay within LLM token limits (e.g., truncation, chunking).
  return PROMPT_TEMPLATE.replace('%s', textToSummarize);
};

export { getSummarizerPrompt };
