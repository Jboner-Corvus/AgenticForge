/**
 * src/prompts/summarizer.prompt.ts
 *
 * Génère un prompt pour une tâche de résumé de texte.
 */

const PROMPT_TEMPLATE = `Please provide a concise summary of the following text.
Focus on the key points and main conclusions.
The summary should be approximately 1/4 of the original text length.

Original Text:
---
%s
---

Summary:`;

export const getSummarizerPrompt = (textToSummarize: string): string => {
  return PROMPT_TEMPLATE.replace('%s', textToSummarize);
};
