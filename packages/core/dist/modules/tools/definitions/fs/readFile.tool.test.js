import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  readFileTool
} from "../../../../chunk-HAJPCEAN.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  getLoggerInstance
} from "../../../../chunk-E5QXXMSG.js";
import "../../../../chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/readFile.tool.test.ts
init_esm_shims();
import { promises as fs } from "fs";
vi.mock("../../../../logger.ts", () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }))
}));
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    stat: vi.fn().mockResolvedValue({ size: 100 })
    // Mock stat to return a fake file size
  }
}));
describe("readFileTool", () => {
  const mockCtx = {
    llm: {},
    log: getLoggerInstance(),
    reportProgress: vi.fn(),
    session: {},
    streamContent: vi.fn(),
    taskQueue: {}
  };
  const mockFilePath = "test-file.txt";
  const mockFileContent = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(mockFileContent);
  });
  it("should read the entire content of a file", async () => {
    const result = await readFileTool.execute({ path: mockFilePath }, mockCtx);
    globalExpect(result).toBe(mockFileContent);
  });
});
