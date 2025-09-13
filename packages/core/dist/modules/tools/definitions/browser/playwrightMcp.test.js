import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  playwrightClickTool,
  playwrightNavigateTool
} from "../../../../chunk-XKUVRLWK.js";
import "../../../../chunk-CCOK3BPH.js";
import {
  beforeEach,
  describe,
  globalExpect,
  it,
  vi
} from "../../../../chunk-AQKYZ7X3.js";
import "../../../../chunk-KQDCL5B7.js";
import "../../../../chunk-AGIO4OHP.js";
import "../../../../chunk-6VZJ5SGS.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/browser/playwrightMcp.test.ts
init_esm_shims();
vi.mock("../../../../logger.ts", () => ({
  getLogger: () => ({
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  })
}));
vi.mock("@playwright/mcp", () => ({
  createConnection: vi.fn().mockResolvedValue({
    // Mock MCP server methods would go here
  })
}));
describe("Playwright MCP Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("playwrightNavigateTool", () => {
    it("should have correct name and description", () => {
      globalExpect(playwrightNavigateTool.name).toBe("playwright_navigate");
      globalExpect(playwrightNavigateTool.description).toContain("Navigate to a URL");
    });
    it("should have correct parameters schema", () => {
      const params = playwrightNavigateTool.parameters;
      globalExpect(params).toBeDefined();
      const validParams = { url: "https://example.com" };
      const result = params.safeParse(validParams);
      globalExpect(result.success).toBe(true);
      const invalidParams = { url: "not-a-url" };
      const invalidResult = params.safeParse(invalidParams);
      globalExpect(invalidResult.success).toBe(false);
    });
    it("should have executable function", () => {
      globalExpect(typeof playwrightNavigateTool.execute).toBe("function");
    });
  });
  describe("playwrightClickTool", () => {
    it("should have correct name and description", () => {
      globalExpect(playwrightClickTool.name).toBe("playwright_click");
      globalExpect(playwrightClickTool.description).toContain("Click on an element");
    });
    it("should have correct parameters schema", () => {
      const params = playwrightClickTool.parameters;
      globalExpect(params).toBeDefined();
      const validParams = { selector: ".button" };
      const result = params.safeParse(validParams);
      globalExpect(result.success).toBe(true);
      const validParamsWithButton = {
        selector: ".button",
        button: "right"
      };
      const resultWithButton = params.safeParse(validParamsWithButton);
      globalExpect(resultWithButton.success).toBe(true);
    });
  });
  describe("Tool Integration", () => {
    it("should export all required tools", async () => {
      const { playwrightMcpTools } = await import("./playwrightMcp.tool.js");
      globalExpect(playwrightMcpTools).toBeDefined();
      globalExpect(Array.isArray(playwrightMcpTools)).toBe(true);
      globalExpect(playwrightMcpTools.length).toBeGreaterThan(0);
      playwrightMcpTools.forEach((tool) => {
        globalExpect(tool.name).toBeDefined();
        globalExpect(tool.description).toBeDefined();
        globalExpect(tool.parameters).toBeDefined();
        globalExpect(tool.execute).toBeDefined();
        globalExpect(typeof tool.execute).toBe("function");
      });
    });
  });
});
