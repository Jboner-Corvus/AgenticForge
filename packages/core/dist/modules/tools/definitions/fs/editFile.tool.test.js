import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  editFileTool
} from "../../../../chunk-NB5T7N4F.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import {
  getLogger
} from "../../../../chunk-5JE7E5SU.js";
import {
  config
} from "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/fs/editFile.tool.test.ts
init_esm_shims();
import { promises as fs } from "fs";
import path from "path";
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn()
  }
}));
vi.mock("../../../../logger.ts", async () => {
  const actual = await vi.importActual(
    "../../../../logger.ts"
  );
  return {
    ...actual,
    getLogger: vi.fn(() => ({
      child: vi.fn().mockReturnThis(),
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    }))
  };
});
describe("editFileTool", () => {
  const mockCtx = {
    llm: {},
    log: getLogger(),
    reportProgress: vi.fn(),
    session: {},
    streamContent: vi.fn(),
    taskQueue: {}
  };
  const mockFilePath = "test-file.txt";
  const mockWorkspaceDir = config.WORKSPACE_PATH;
  const mockAbsolutePath = path.resolve(mockWorkspaceDir, mockFilePath);
  beforeEach(() => {
    vi.clearAllMocks();
    fs.readFile.mockResolvedValue("original content");
    fs.writeFile.mockResolvedValue(void 0);
  });
  it("should replace content in a file (string replacement)", async () => {
    const args = {
      content_to_replace: "original",
      is_regex: false,
      new_content: "new",
      path: mockFilePath
    };
    fs.readFile.mockResolvedValueOnce("original content");
    const result = await editFileTool.execute(args, mockCtx);
    globalExpect(fs.writeFile).toHaveBeenCalledWith(
      mockAbsolutePath,
      "new content",
      "utf-8"
    );
    globalExpect(result).toEqual({
      message: `Successfully edited content in ${mockFilePath}.`,
      modified_content: "new content",
      original_content: "original content",
      success: true
    });
  });
  it("should replace content in a file (regex replacement)", async () => {
    const args = {
      content_to_replace: "o(ri)ginal",
      is_regex: true,
      new_content: "n$1w",
      path: mockFilePath
    };
    fs.readFile.mockResolvedValueOnce("original content");
    const result = await editFileTool.execute(args, mockCtx);
    globalExpect(fs.writeFile).toHaveBeenCalledWith(
      mockAbsolutePath,
      "nriw content",
      "utf-8"
    );
    globalExpect(result).toEqual({
      message: `Successfully edited content in ${mockFilePath}.`,
      modified_content: "nriw content",
      original_content: "original content",
      success: true
    });
  });
  it("should return success if no changes are needed", async () => {
    const args = {
      content_to_replace: "non-existent",
      is_regex: false,
      new_content: "new",
      path: mockFilePath
    };
    fs.readFile.mockResolvedValueOnce("original content");
    const result = await editFileTool.execute(args, mockCtx);
    globalExpect(fs.writeFile).not.toHaveBeenCalled();
    globalExpect(result).toEqual({
      message: `No changes were needed in ${mockFilePath}. The content was already correct.`,
      success: true
    });
  });
  it("should return an error if file not found", async () => {
    const args = {
      content_to_replace: "a",
      is_regex: false,
      new_content: "b",
      path: "non-existent.txt"
    };
    fs.readFile.mockRejectedValueOnce({ code: "ENOENT" });
    const result = await editFileTool.execute(args, mockCtx);
    globalExpect(result).toHaveProperty("erreur");
    globalExpect(
      typeof result === "object" && result !== null && "erreur" in result ? result.erreur : result
    ).toContain("File not found");
  });
  it("should return an error for other file system errors", async () => {
    const args = {
      content_to_replace: "a",
      is_regex: false,
      new_content: "b",
      path: mockFilePath
    };
    fs.readFile.mockRejectedValueOnce(new Error("Permission denied"));
    const result = await editFileTool.execute(args, mockCtx);
    globalExpect(result).toHaveProperty("erreur");
    globalExpect(
      typeof result === "object" && result !== null && "erreur" in result ? result.erreur : result
    ).toContain("Permission denied");
  });
});
