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
  FinishToolSignal,
  finishTool
} from "../../../../chunk-CZQPSXPM.js";
import {
  getLoggerInstance
} from "../../../../chunk-E5QXXMSG.js";
import "../../../../chunk-6NLBXREQ.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/finish.tool.test.ts
init_esm_shims();
vi.mock("../../../../config", async () => {
  const actual = await vi.importActual("../../../../config");
  return {
    ...actual,
    config: {
      AGENT_MAX_ITERATIONS: 10,
      CODE_EXECUTION_TIMEOUT_MS: 6e4,
      CONTAINER_MEMORY_LIMIT: "2g",
      HISTORY_LOAD_LENGTH: 50,
      HISTORY_MAX_LENGTH: 1e3,
      HOST_PROJECT_PATH: "/usr/src/app",
      LLM_MODEL_NAME: "gemini-pro",
      LLM_PROVIDER: "gemini",
      LLM_PROVIDER_HIERARCHY: [
        "huggingface",
        "grok",
        "gemini",
        "openai",
        "mistral"
      ],
      LOG_LEVEL: "info",
      MAX_FILE_SIZE_BYTES: 10485760,
      PORT: 3001,
      POSTGRES_DB: "agenticforge",
      POSTGRES_HOST: "postgres",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "user",
      REDIS_DB: 0,
      REDIS_HOST: "localhost",
      REDIS_PORT: 6379,
      SESSION_EXPIRATION: 604800,
      WORKER_CONCURRENCY: 5,
      WORKSPACE_PATH: "/workspace"
    }
  };
});
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
describe("finishTool", () => {
  let mockCtx;
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {
      job: { id: "test-job-id" },
      llm: {},
      log: getLoggerInstance(),
      reportProgress: vi.fn(),
      session: {},
      streamContent: vi.fn(),
      taskQueue: {}
    };
    vi.spyOn(mockLoggerInstance, "info");
    vi.spyOn(mockLoggerInstance, "error");
  });
  it("should throw a FinishToolSignal with the final response when called with an object", async () => {
    const response = "Goal achieved!";
    await globalExpect(finishTool.execute({ response }, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response)
    );
    globalExpect(mockLoggerInstance.info).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`
    );
  });
  it("should throw a FinishToolSignal with the final response when called with a string", async () => {
    const response = "Direct goal achieved!";
    await globalExpect(finishTool.execute(response, mockCtx)).rejects.toThrow(
      new FinishToolSignal(response)
    );
    globalExpect(mockLoggerInstance.info).toHaveBeenCalledWith(
      `Goal accomplished: ${response}`
    );
  });
  it("should return an error message if args are invalid", async () => {
    const invalidArgs = null;
    await globalExpect(finishTool.execute(invalidArgs, mockCtx)).rejects.toThrow(
      "Invalid arguments provided to finishTool. A final answer is required."
    );
    globalExpect(mockCtx.log.error).toHaveBeenCalled();
  });
});
