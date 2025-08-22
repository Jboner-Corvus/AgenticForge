import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  agentResponseTool
} from "../../../../chunk-2NILJMLP.js";
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

// src/modules/tools/definitions/system/agentResponse.tool.test.ts
init_esm_shims();
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
describe("agentResponseTool", () => {
  const mockCtx = {
    llm: {},
    log: getLoggerInstance(),
    reportProgress: vi.fn(),
    session: {},
    streamContent: vi.fn(),
    taskQueue: {}
  };
  it("should return the response string", async () => {
    const response = "Hello, user!";
    const result = await agentResponseTool.execute({ response }, mockCtx);
    globalExpect(result).toBe(response);
    globalExpect(mockLoggerInstance.info).toHaveBeenCalledWith("Responding to user", {
      args: { response }
    });
  });
  it("should handle empty response string", async () => {
    const response = "";
    const result = await agentResponseTool.execute({ response }, mockCtx);
    globalExpect(result).toBe(response);
  });
});
