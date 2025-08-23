import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  webSearchTool
} from "../../../../chunk-5LOOCZK3.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  getLoggerInstance
} from "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/search/webSearch.tool.test.ts
init_esm_shims();
var mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
};
vi.mock("../../../../logger", () => ({
  getLoggerInstance: vi.fn(() => mockLoggerInstance)
}));
vi.mock("puppeteer", () => {
  const mockPage = {
    evaluate: vi.fn(),
    goto: vi.fn(),
    screenshot: vi.fn()
  };
  const mockBrowser = {
    close: vi.fn(),
    newPage: vi.fn().mockResolvedValue(mockPage)
  };
  return {
    default: {
      launch: vi.fn().mockResolvedValue(mockBrowser)
    }
  };
});
describe("webSearchTool", () => {
  let mockCtx;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockRestore();
    mockCtx = {
      job: {
        data: { prompt: "test prompt" },
        id: "test-job-id",
        isFailed: vi.fn(),
        name: "test-job"
      },
      llm: {},
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {},
      streamContent: vi.fn(),
      taskQueue: {}
    };
  });
  it("should perform a web search and return a summary", async () => {
    const puppeteer = await import("puppeteer");
    const mockPage = {
      evaluate: vi.fn().mockResolvedValue([
        {
          description: "Result 1 description",
          title: "Result 1",
          url: "http://example.com/1"
        },
        {
          description: "Result 2 description",
          title: "Result 2",
          url: "http://example.com/2"
        }
      ]),
      goto: vi.fn(),
      screenshot: vi.fn().mockResolvedValue("mock-base64-screenshot")
    };
    const mockBrowser = {
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage)
    };
    vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);
    const query = "test search";
    const result = await webSearchTool.execute({ query }, mockCtx);
    globalExpect(mockLoggerInstance.info).toHaveBeenCalledWith(
      `Performing web search for: "${query}"`
    );
    globalExpect(result.screenshot).toBe("mock-base64-screenshot");
    globalExpect(result.summary).toContain("[Result 1](http://example.com/1)");
    globalExpect(result.summary).toContain("[Result 2](http://example.com/2)");
  });
  it("should return an error message if the browser launch fails", async () => {
    const errorMessage = "Browser launch failed";
    const puppeteer = await import("puppeteer");
    vi.mocked(puppeteer.default.launch).mockRejectedValue(
      new Error(errorMessage)
    );
    const query = "test search";
    const result = await webSearchTool.execute({ query }, mockCtx);
    globalExpect(result.screenshot).toBe("");
    globalExpect(result.summary).toContain(
      `An unexpected error occurred: ${errorMessage}`
    );
    globalExpect(mockLoggerInstance.error).toHaveBeenCalled();
  });
  it("should return an error message if the page navigation fails", async () => {
    const errorMessage = "Navigation failed";
    const puppeteer = await import("puppeteer");
    const mockPage = {
      evaluate: vi.fn(),
      goto: vi.fn().mockRejectedValue(new Error(errorMessage)),
      screenshot: vi.fn()
    };
    const mockBrowser = {
      close: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage)
    };
    vi.mocked(puppeteer.default.launch).mockResolvedValue(mockBrowser);
    const query = "test search";
    const result = await webSearchTool.execute({ query }, mockCtx);
    globalExpect(result.screenshot).toBe("");
    globalExpect(result.summary).toContain(
      `An unexpected error occurred: ${errorMessage}`
    );
    globalExpect(mockLoggerInstance.error).toHaveBeenCalled();
  });
});
