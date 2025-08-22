import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/ai/summarizer.prompt.ts
init_esm_shims();
var PROMPT_TEMPLATE = `Please provide a concise summary of the following text.
Focus on the key points and main conclusions.
The summary should be approximately 1/4 of the original text length.

Original Text:
---
%s
---

Summary:`;
var getSummarizerPrompt = (textToSummarize) => {
  return PROMPT_TEMPLATE.replace("%s", textToSummarize);
};

export {
  getSummarizerPrompt
};
