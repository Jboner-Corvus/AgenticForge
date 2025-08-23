import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  writeFile
} from "../../../../chunk-PVI3LVZ2.js";
import {
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  getLoggerInstance
} from "../../../../chunk-5JE7E5SU.js";
import {
  config
} from "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/writeFile.tool.test.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
vi.mock("../../../../config.ts", async () => {
  return {
    config: {
      WORKSPACE_PATH: "/mock-workspace"
    }
  };
});
vi.mock("fs", async () => {
  const vitest = await import("../../../../dist-WHHVNEQB.js");
  return {
    promises: {
      mkdir: vitest.vi.fn(() => Promise.resolve()),
      readFile: vitest.vi.fn(() => Promise.resolve("existing content")),
      stat: vitest.vi.fn(() => Promise.resolve({ isFile: () => true })),
      writeFile: vitest.vi.fn(() => Promise.resolve())
    }
  };
});
var mockLogger = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
};
vi.mock("../../../../logger.ts", () => ({
  getLoggerInstance: vi.fn(() => mockLogger)
}));
describe("writeFileTool", () => {
  let mockCtx;
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      llm: {},
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {},
      streamContent: vi.fn(),
      taskQueue: {}
    };
  });
  it("should write content to a new file", async () => {
    vi.mocked(fs.stat).mockImplementationOnce(
      () => Promise.reject({ code: "ENOENT" })
    );
    const filePath = "newfile.txt";
    const content = "Hello, new file!";
    const result = await writeFile.execute(
      { content, path: filePath },
      mockCtx
    );
    globalExpect(fs.mkdir).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, path.dirname(filePath)),
      { recursive: true }
    );
    globalExpect(fs.writeFile).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, filePath),
      content,
      "utf-8"
    );
    globalExpect(result).toEqual({
      message: `Successfully wrote content to ${filePath}.`
    });
  });
  it("should overwrite content in an existing file", async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce("old content");
    const filePath = "existingfile.txt";
    const content = "New content for existing file.";
    const result = await writeFile.execute(
      { content, path: filePath },
      mockCtx
    );
    globalExpect(fs.writeFile).toHaveBeenCalledWith(
      path.join(config.WORKSPACE_PATH, filePath),
      content,
      "utf-8"
    );
    globalExpect(result).toEqual({
      message: `Successfully wrote content to ${filePath}.`
    });
  });
  it("should not write if content is identical", async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce("existing content");
    const filePath = "samecontent.txt";
    const content = "existing content";
    const result = await writeFile.execute(
      { content, path: filePath },
      mockCtx
    );
    globalExpect(fs.writeFile).not.toHaveBeenCalled();
    globalExpect(result).toEqual({
      message: `File ${filePath} already contains the desired content. No changes made.`
    });
  });
  it("should return an error if file writing fails", async () => {
    vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error("Disk full"));
    const filePath = "errorfile.txt";
    const content = "Some content";
    const result = await writeFile.execute(
      { content, path: filePath },
      mockCtx
    );
    globalExpect(typeof result).toBe("object");
    if (typeof result === "object" && result !== null && "erreur" in result) {
      globalExpect(result.erreur).toContain("Disk full");
    } else {
      throw new Error("Expected an object with an erreur property.");
    }
    globalExpect(getLoggerInstance().error).toHaveBeenCalled();
  });
});
