import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  playwrightNavigateTool,
  playwrightClickTool,
} from './playwrightMcp.tool';

// Mock the logger
vi.mock('../../../../logger.ts', () => ({
  getLogger: () => ({
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  }),
}));

// Mock the MCP server
vi.mock('@playwright/mcp', () => ({
  createConnection: vi.fn().mockResolvedValue({
    // Mock MCP server methods would go here
  }),
}));

describe('Playwright MCP Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('playwrightNavigateTool', () => {
    it('should have correct name and description', () => {
      expect(playwrightNavigateTool.name).toBe('playwright_navigate');
      expect(playwrightNavigateTool.description).toContain('Navigate to a URL');
    });

    it('should have correct parameters schema', () => {
      const params = playwrightNavigateTool.parameters;
      expect(params).toBeDefined();

      // Test parameter validation
      const validParams = { url: 'https://example.com' };
      const result = params.safeParse(validParams);
      expect(result.success).toBe(true);

      const invalidParams = { url: 'not-a-url' };
      const invalidResult = params.safeParse(invalidParams);
      expect(invalidResult.success).toBe(false);
    });

    it('should have executable function', () => {
      expect(typeof playwrightNavigateTool.execute).toBe('function');
    });
  });

  describe('playwrightClickTool', () => {
    it('should have correct name and description', () => {
      expect(playwrightClickTool.name).toBe('playwright_click');
      expect(playwrightClickTool.description).toContain('Click on an element');
    });

    it('should have correct parameters schema', () => {
      const params = playwrightClickTool.parameters;
      expect(params).toBeDefined();

      // Test parameter validation
      const validParams = { selector: '.button' };
      const result = params.safeParse(validParams);
      expect(result.success).toBe(true);

      const validParamsWithButton = {
        selector: '.button',
        button: 'right' as const,
      };
      const resultWithButton = params.safeParse(validParamsWithButton);
      expect(resultWithButton.success).toBe(true);
    });
  });

  describe('Tool Integration', () => {
    it('should export all required tools', async () => {
      // Import the tools array dynamically
      const { playwrightMcpTools } = await import('./playwrightMcp.tool');

      expect(playwrightMcpTools).toBeDefined();
      expect(Array.isArray(playwrightMcpTools)).toBe(true);
      expect(playwrightMcpTools.length).toBeGreaterThan(0);

      // Check that each tool has required properties
      playwrightMcpTools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeDefined();
        expect(typeof tool.execute).toBe('function');
      });
    });
  });
});
