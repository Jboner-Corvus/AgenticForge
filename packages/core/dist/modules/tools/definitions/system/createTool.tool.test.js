import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  createToolTool
} from "../../../../chunk-AOV4DJOE.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import "../../../../chunk-E73UG3QD.js";
import {
  getLoggerInstance
} from "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/createTool.tool.test.ts
init_esm_shims();
import { promises as fs } from "fs";
vi.mock("fs", () => ({
  promises: {
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve())
  }
}));
vi.mock("../../../../utils/qualityGate", () => ({
  runQualityGate: vi.fn(() => Promise.resolve({ output: "", success: true }))
}));
var mockLoggerInstance = {
  child: vi.fn().mockReturnThis(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
};
vi.mock("../../../../logger.ts", () => ({
  getLoggerInstance: vi.fn(() => mockLoggerInstance)
}));
describe("createToolTool", () => {
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
  it("should create a new tool file and pass quality gates", async () => {
    const args = {
      description: "A test tool",
      execute_function: 'async (args, ctx) => { return "executed"; }',
      parameters: '{ "param1": "z.string()" }',
      tool_name: "test-tool"
    };
    const warnSpy = vi.spyOn(mockLoggerInstance, "warn");
    const result = await createToolTool.execute(args, mockCtx);
    globalExpect(warnSpy).toHaveBeenCalledWith("AGENT IS CREATING A NEW TOOL.", {
      tool: "test-tool"
    });
    globalExpect(fs.mkdir).toHaveBeenCalled();
    globalExpect(fs.writeFile).toHaveBeenCalled();
    globalExpect(result).toContain("Outil 'test-tool' g\xE9n\xE9r\xE9 avec sch\xE9mas Zod");
  });
});
