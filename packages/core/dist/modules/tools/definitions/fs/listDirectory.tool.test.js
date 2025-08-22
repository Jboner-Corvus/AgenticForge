import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  listFilesTool
} from "../../../../chunk-XUVI7ISY.js";
import {
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

// src/modules/tools/definitions/fs/listDirectory.tool.test.ts
init_esm_shims();
import { promises as fs } from "fs";
vi.mock("fs", () => ({
  promises: {
    readdir: vi.fn()
  }
}));
vi.mock("../../../../logger.ts", () => ({
  getLoggerInstance: vi.fn(() => ({
    child: vi.fn().mockReturnThis(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }))
}));
describe("listFilesTool", () => {
  const mockCtx = {
    llm: {},
    log: getLoggerInstance(),
    reportProgress: vi.fn(),
    session: {},
    streamContent: vi.fn(),
    taskQueue: {}
  };
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should list files in a directory", async () => {
    fs.readdir.mockResolvedValue([
      { isDirectory: () => false, name: "file1.txt" },
      { isDirectory: () => true, name: "dir1" }
    ]);
    const result = await listFilesTool.execute({ path: "." }, mockCtx);
    globalExpect(result).toContain("file1.txt");
    globalExpect(result).toContain("dir1/");
  });
});
