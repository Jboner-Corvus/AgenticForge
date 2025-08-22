import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  summarizeTool
} from "../../../../chunk-5OF3AFAD.js";
import "../../../../chunk-DE5MSL2E.js";
import {
  getLlmProvider
} from "../../../../chunk-ZEBJECHX.js";
import "../../../../chunk-SIBAPVHV.js";
import "../../../../chunk-E5QXXMSG.js";
import "../../../../chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/ai/summarize.tool.test.ts
init_esm_shims();
vi.mock("../../../../utils/llmProvider.ts", () => {
  const mockGetLlmResponse = vi.fn();
  return {
    getLlmProvider: vi.fn(() => ({
      getLlmResponse: mockGetLlmResponse
    }))
  };
});
var mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
};
var mockCtx = {
  llm: {},
  // Will be set in beforeEach
  log: mockLogger,
  reportProgress: vi.fn(),
  session: {},
  streamContent: vi.fn(),
  taskQueue: {}
};
describe("summarizeTool", () => {
  let mockGetLlmResponse;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLlmResponse = vi.fn();
    vi.mocked(getLlmProvider).mockReturnValue({
      getErrorType: vi.fn(),
      getLlmResponse: mockGetLlmResponse
    });
    mockCtx.llm = getLlmProvider("gemini");
  });
  it("should summarize the text successfully", async () => {
    vi.mocked(getLlmProvider("gemini").getLlmResponse).mockResolvedValue(
      "This is a summary."
    );
    const result = await summarizeTool.execute(
      { text: "Long text to summarize." },
      mockCtx
    );
    globalExpect(result).toEqual("This is a summary.");
    globalExpect(getLlmProvider("gemini").getLlmResponse).toHaveBeenCalled();
  });
  it("should return an error object if textToSummarize is an empty string", async () => {
    const result = await summarizeTool.execute({ text: "" }, mockCtx);
    globalExpect(result).toEqual({
      erreur: "Failed to summarize text: Input text for summarization is empty."
    });
    globalExpect(mockLogger.warn).toHaveBeenCalledWith(
      "Input text for summarization is empty."
    );
  });
  it("should return an error object if getLlmResponse returns an empty string or null", async () => {
    vi.mocked(getLlmProvider("gemini").getLlmResponse).mockResolvedValue("");
    let result = await summarizeTool.execute({ text: "Some text" }, mockCtx);
    globalExpect(result).toEqual({
      erreur: "Failed to summarize text: LLM returned empty response."
    });
    globalExpect(mockLogger.error).toHaveBeenCalledWith(
      "LLM returned empty response for summarization."
    );
    vi.mocked(getLlmProvider("gemini").getLlmResponse).mockResolvedValue("");
    result = await summarizeTool.execute({ text: "Some text" }, mockCtx);
    globalExpect(result).toEqual({
      erreur: "Failed to summarize text: LLM returned empty response."
    });
    globalExpect(mockLogger.error).toHaveBeenCalledWith(
      "LLM returned empty response for summarization."
    );
  });
});
