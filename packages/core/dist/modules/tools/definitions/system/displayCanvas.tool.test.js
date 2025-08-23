import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  displayCanvasTool
} from "../../../../chunk-UN6Q5SXR.js";
import {
  sendToCanvas
} from "../../../../chunk-3B2NS2K5.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import "../../../../chunk-2TWFUMQU.js";
import "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/displayCanvas.tool.test.ts
init_esm_shims();
vi.mock("../../../../utils/canvasUtils.ts", () => ({
  closeCanvas: vi.fn(),
  sendToCanvas: vi.fn()
}));
describe("displayCanvasTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should have correct name and description", () => {
    globalExpect(displayCanvasTool.name).toBe("display_canvas");
    globalExpect(displayCanvasTool.description).toBe(
      "Affiche du contenu dans le canvas de l'interface utilisateur. Peut afficher du HTML, Markdown, du texte brut ou une URL. Tr\xE8s utile pour montrer des visualisations, des rapports, des graphiques, des animations, des jeux simples, etc."
    );
  });
  it("should have correct parameters schema", () => {
    const shape = displayCanvasTool.parameters._def.shape();
    globalExpect(shape.content._def.typeName).toBe("ZodString");
    globalExpect(shape.contentType._def.typeName).toBe("ZodOptional");
    globalExpect(shape.contentType._def.innerType._def.typeName).toBe("ZodEnum");
    globalExpect(shape.contentType._def.innerType._def.values).toEqual([
      "html",
      "markdown",
      "text",
      "url"
    ]);
    globalExpect(shape.title._def.typeName).toBe("ZodOptional");
    globalExpect(shape.title._def.innerType._def.typeName).toBe("ZodString");
    globalExpect(displayCanvasTool.parameters._def.typeName).toBe("ZodObject");
  });
  it("should send HTML content to canvas successfully", async () => {
    const mockJob = { id: "test-job-id" };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: "info",
      trace: vi.fn(),
      warn: vi.fn()
    };
    const content = "<h1>Test HTML</h1><p>This is a test</p>";
    const result = await displayCanvasTool.execute(
      { content, contentType: "html" },
      {
        job: {
          ...mockJob,
          data: { prompt: "test" },
          isFailed: async () => false,
          name: "test-job"
        },
        llm: {
          getErrorType: () => "UNKNOWN",
          getLlmResponse: async () => "test"
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: "test-session",
          timestamp: Date.now()
        },
        streamContent: vi.fn(),
        taskQueue: {}
      }
    );
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", content, "html");
    globalExpect(mockLog.info).toHaveBeenCalledWith(
      "Content sent to canvas for job test-job-id with type html"
    );
    globalExpect(result).toEqual({
      success: true
    });
  });
  it("should send Markdown content to canvas successfully", async () => {
    const mockJob = { id: "test-job-id" };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: "info",
      trace: vi.fn(),
      warn: vi.fn()
    };
    const content = "# Test Markdown\n\nThis is a test";
    const contentType = "markdown";
    const result = await displayCanvasTool.execute(
      { content, contentType },
      {
        job: {
          ...mockJob,
          data: { prompt: "test" },
          isFailed: async () => false,
          name: "test-job"
        },
        llm: {
          getErrorType: () => "UNKNOWN",
          getLlmResponse: async () => "test"
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: "test-session",
          timestamp: Date.now()
        },
        streamContent: vi.fn(),
        taskQueue: {}
      }
    );
    globalExpect(sendToCanvas).toHaveBeenCalledWith(
      "test-job-id",
      content,
      "markdown"
    );
    globalExpect(mockLog.info).toHaveBeenCalledWith(
      "Content sent to canvas for job test-job-id with type markdown"
    );
    globalExpect(result).toEqual({
      success: true
    });
  });
  it("should send content with title to canvas", async () => {
    const mockJob = { id: "test-job-id" };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: "info",
      trace: vi.fn(),
      warn: vi.fn()
    };
    const content = "<h1>Test HTML</h1><p>This is a test</p>";
    const title = "Test Title";
    const result = await displayCanvasTool.execute(
      { content, contentType: "html", title },
      {
        job: {
          ...mockJob,
          data: { prompt: "test" },
          isFailed: async () => false,
          name: "test-job"
        },
        llm: {
          getErrorType: () => "UNKNOWN",
          getLlmResponse: async () => "test"
        },
        log: mockLog,
        reportProgress: vi.fn(),
        session: {
          history: [],
          identities: [],
          name: "test-session",
          timestamp: Date.now()
        },
        streamContent: vi.fn(),
        taskQueue: {}
      }
    );
    globalExpect(sendToCanvas).toHaveBeenCalledWith("test-job-id", content, "html");
    globalExpect(mockLog.info).toHaveBeenCalledWith(
      "Displaying content with title: Test Title"
    );
    globalExpect(mockLog.info).toHaveBeenCalledWith(
      "Content sent to canvas for job test-job-id with type html"
    );
    globalExpect(result).toEqual({
      success: true
    });
  });
  it("should handle errors when sending to canvas fails", async () => {
    const mockJob = { id: "test-job-id" };
    const mockLog = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: "info",
      trace: vi.fn(),
      warn: vi.fn()
    };
    const content = "<h1>Test HTML</h1><p>This is a test</p>";
    sendToCanvas.mockImplementationOnce(() => {
      throw new Error("Canvas error");
    });
    await globalExpect(
      displayCanvasTool.execute(
        { content, contentType: "html" },
        {
          job: {
            ...mockJob,
            data: { prompt: "test" },
            isFailed: async () => false,
            name: "test-job"
          },
          llm: {
            getErrorType: () => "UNKNOWN",
            getLlmResponse: async () => "test"
          },
          log: mockLog,
          reportProgress: vi.fn(),
          session: {
            history: [],
            identities: [],
            name: "test-session",
            timestamp: Date.now()
          },
          streamContent: vi.fn(),
          taskQueue: {}
        }
      )
    ).rejects.toThrow("Failed to display content in canvas: Canvas error");
    globalExpect(mockLog.error).toHaveBeenCalled();
  });
});
