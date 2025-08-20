import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { getMasterPrompt } from './orchestrator.prompt.ts';
import type { AgentSession, Tool, Message } from '../../types.ts';

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(`
# System Prompt Template

You are an intelligent agent. Your response must be valid JSON with the following schema:

{{RESPONSE_JSON_SCHEMA}}

## Instructions:
- Use 'thought' for internal reasoning
- Use 'command' to execute tools
- Use 'canvas' for visual output
- Use 'answer' for final responses
`),
  existsSync: vi.fn().mockReturnValue(true),
  accessSync: vi.fn(),
  constants: { R_OK: 4 },
}));

vi.mock('path', () => ({
  default: {
    resolve: vi.fn().mockReturnValue('/mock/path/system.prompt.md'),
    dirname: vi.fn().mockReturnValue('/mock/path'),
  },
  resolve: vi.fn().mockReturnValue('/mock/path/system.prompt.md'),
  dirname: vi.fn().mockReturnValue('/mock/path'),
}));

vi.mock('url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mock/path/orchestrator.prompt.ts'),
}));

vi.mock('./responseSchema.ts', () => ({
  getResponseJsonSchema: vi.fn().mockReturnValue({
    type: 'object',
    properties: {
      thought: { type: 'string', description: 'Internal reasoning' },
      command: { type: 'object', description: 'Tool execution' },
      canvas: { type: 'object', description: 'Visual output' },
      answer: { type: 'string', description: 'Final response' },
    },
  }),
}));

describe('Orchestrator Prompt Tests', () => {
  let mockSession: AgentSession;
  let mockTools: Tool[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockSession = {
      id: 'test-session',
      data: {
        history: [],
        identities: [{ id: 'test-user', type: 'user' }],
        name: 'Advanced Test Session',
        timestamp: Date.now(),
        activeLlmProvider: 'openai',
      },
    };

    const readFileSchema = z.object({
      path: z.string(),
    });

    const writeFileSchema = z.object({
      path: z.string(),
      content: z.string(),
    });

    mockTools = [
      {
        name: 'readFile',
        description: 'Read content from a file',
        parameters: readFileSchema,
        execute: vi.fn(),
      },
      {
        name: 'writeFile',
        description: 'Write content to a file',
        parameters: writeFileSchema,
        execute: vi.fn(),
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Prompt Generation', () => {
    it('should generate a complete master prompt', () => {
      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('You are an intelligent agent');
      expect(prompt).toContain('## Available Tools:');
      expect(prompt).toContain('readFile');
      expect(prompt).toContain('writeFile');
      expect(prompt).toContain("ASSISTANT's turn. Your response:");
    });

    it('should include JSON schema in prompt', () => {
      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('"type": "object"');
      expect(prompt).toContain('"properties"');
      expect(prompt).not.toContain('{{RESPONSE_JSON_SCHEMA}}'); // Should be replaced
    });

    it('should format tools with descriptions and parameters', () => {
      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('### readFile');
      expect(prompt).toContain('Description: Read content from a file');
      expect(prompt).toContain('Parameters (JSON Schema):');
      expect(prompt).toContain('"path"');
    });

    it('should handle tools without parameters', () => {
      const emptySchema = z.object({});
      
      const toolWithoutParams: Tool = {
        name: 'simpleAction',
        description: 'A simple action with no parameters',
        parameters: emptySchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [toolWithoutParams]);

      expect(prompt).toContain('### simpleAction');
      expect(prompt).toContain('Parameters: None');
    });
  });

  describe('Conversation History Formatting', () => {
    it('should format user messages correctly', () => {
      mockSession.data.history = [
        {
          type: 'user',
          content: 'Hello, can you help me?',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('## Conversation History:');
      expect(prompt).toContain('USER:\nHello, can you help me?');
    });

    it('should format agent responses correctly', () => {
      mockSession.data.history = [
        {
          type: 'agent_response',
          content: 'Yes, I can help you!',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('ASSISTANT:\nYes, I can help you!');
    });

    it('should format agent thoughts correctly', () => {
      mockSession.data.history = [
        {
          type: 'agent_thought',
          content: 'I need to analyze this request',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('ASSISTANT:\nThought: I need to analyze this request');
    });

    it('should format tool calls correctly', () => {
      mockSession.data.history = [
        {
          type: 'tool_call',
          toolName: 'readFile',
          params: { path: '/test/file.txt' },
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('ASSISTANT:\nTool Call: readFile');
      expect(prompt).toContain('"/test/file.txt"');
    });

    it('should format tool results correctly', () => {
      mockSession.data.history = [
        {
          type: 'tool_result',
          toolName: 'readFile',
          result: { content: 'File content here' },
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('OBSERVATION:\nTool Result from readFile:');
      expect(prompt).toContain('File content here');
    });

    it('should format error messages correctly', () => {
      mockSession.data.history = [
        {
          type: 'error',
          content: 'File not found',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('SYSTEM:\nError: File not found');
    });

    it('should format canvas output correctly', () => {
      mockSession.data.history = [
        {
          type: 'agent_canvas_output',
          content: '<h1>Hello World</h1>',
          contentType: 'html',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('ASSISTANT:\nCanvas Output (html):');
      expect(prompt).toContain('<h1>Hello World</h1>');
    });

    it('should truncate very long messages', () => {
      const longContent = 'A'.repeat(6000); // Exceeds MAX_CONTENT_LENGTH
      mockSession.data.history = [
        {
          type: 'user',
          content: longContent,
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('... (truncated)');
      expect(prompt.length).toBeLessThan(longContent.length + 1000); // Should be much shorter
    });

    it('should handle empty history gracefully', () => {
      mockSession.data.history = [];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).not.toContain('## Conversation History:');
      expect(prompt).toContain("ASSISTANT's turn. Your response:");
    });

    it('should handle complex conversation flow', () => {
      mockSession.data.history = [
        { type: 'user', content: 'Read file.txt', id: '1', timestamp: Date.now() },
        { type: 'agent_thought', content: 'I need to read the file', id: '2', timestamp: Date.now() },
        { type: 'tool_call', toolName: 'readFile', params: { path: 'file.txt' }, id: '3', timestamp: Date.now() },
        { type: 'tool_result', toolName: 'readFile', result: 'File contents', id: '4', timestamp: Date.now() },
        { type: 'agent_response', content: 'Here is the file content', id: '5', timestamp: Date.now() },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('USER:\nRead file.txt');
      expect(prompt).toContain('ASSISTANT:\nThought: I need to read the file');
      expect(prompt).toContain('ASSISTANT:\nTool Call: readFile');
      expect(prompt).toContain('OBSERVATION:\nTool Result from readFile');
      expect(prompt).toContain('ASSISTANT:\nHere is the file content');
    });
  });

  describe('Working Context Integration', () => {
    it('should include working context when present', () => {
      mockSession.data.workingContext = {
        currentFile: '/home/user/test-project.ts',
        lastAction: 'development',
      };

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('## Working Context:');
      expect(prompt).toContain('/home/user/test-project.ts');
      expect(prompt).toContain('development');
    });

    it('should skip working context section when not present', () => {
      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).not.toContain('## Working Context:');
    });

    it('should format complex working context as JSON', () => {
      mockSession.data.workingContext = {
        currentFile: 'file1.txt',
        lastAction: 'debug mode enabled in version 1.0.0',
      };

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('## Working Context:');
      expect(prompt).toContain('file1.txt');
      expect(prompt).toContain('debug mode enabled');
    });
  });

  describe('Zod Schema Conversion', () => {
    it('should convert ZodString to JSON schema', () => {
      const prompt = getMasterPrompt(mockSession, mockTools);

      // Check that string parameters are properly converted
      expect(prompt).toContain('"type": "string"');
    });

    it('should handle ZodObject schemas', () => {
      const complexToolSchema = z.object({
        config: z.object({
          enabled: z.boolean(),
          count: z.number().optional(),
        }),
      });

      const complexTool: Tool = {
        name: 'complexTool',
        description: 'A tool with complex parameters',
        parameters: complexToolSchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [complexTool]);

      expect(prompt).toContain('complexTool');
      expect(prompt).toContain('"type": "object"');
    });

    it('should handle ZodArray schemas', () => {
      const arrayToolSchema = z.object({
        items: z.array(z.string()),
      });

      const arrayTool: Tool = {
        name: 'arrayTool',
        description: 'A tool with array parameters',
        parameters: arrayToolSchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [arrayTool]);

      expect(prompt).toContain('arrayTool');
      expect(prompt).toContain('"type": "array"');
    });

    it('should handle ZodEnum schemas', () => {
      const enumToolSchema = z.object({
        mode: z.enum(['read', 'write', 'append']),
      });

      const enumTool: Tool = {
        name: 'enumTool',
        description: 'A tool with enum parameters',
        parameters: enumToolSchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [enumTool]);

      expect(prompt).toContain('enumTool');
      expect(prompt).toContain('"enum"');
      expect(prompt).toContain('read');
      expect(prompt).toContain('write');
      expect(prompt).toContain('append');
    });

    it('should handle optional and nullable fields', () => {
      const optionalToolSchema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const optionalTool: Tool = {
        name: 'optionalTool',
        description: 'A tool with optional parameters',
        parameters: optionalToolSchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [optionalTool]);

      expect(prompt).toContain('optionalTool');
      expect(prompt).toContain('"required"');
    });
  });

  describe('Error Handling', () => {
    

    it('should handle invalid Zod schemas', () => {
      const invalidTool = {
        name: 'invalidTool',
        description: 'A tool with invalid schema',
        parameters: { this_is_not_a_zod_schema: true }, // not a Zod schema
        execute: vi.fn(),
      };

      // @ts-expect-error - testing invalid input
      expect(() => getMasterPrompt(mockSession, [invalidTool])).toThrow('Invalid Zod schema provided');
    });

    it('should handle unknown message types gracefully', () => {
      mockSession.data.history = [
        {
          type: 'unknown_type' as any,
          content: 'Unknown message',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      expect(() => getMasterPrompt(mockSession, mockTools)).toThrow('Unknown message type: unknown_type');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of tools efficiently', () => {
      const toolSchema = z.object({
        param: z.string(),
      });

      const manyTools: Tool[] = Array.from({ length: 100 }, (_, i) => ({
        name: `tool${i}`,
        description: `Tool number ${i}`,
        parameters: toolSchema,
        execute: vi.fn(),
      }));

      const start = Date.now();
      const prompt = getMasterPrompt(mockSession, manyTools);
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
      expect(prompt).toContain('tool0');
      expect(prompt).toContain('tool99');
    });

    it('should handle very long conversation history', () => {
      const longHistory: Message[] = Array.from({ length: 1000 }, (_, i) => ({
        type: 'user',
        content: `Message ${i}`,
        id: `${i}`,
        timestamp: Date.now() + i,
      }));

      mockSession.data.history = longHistory;

      const start = Date.now();
      const prompt = getMasterPrompt(mockSession, mockTools);
      const end = Date.now();

      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
      expect(prompt).toContain('Message 0');
      expect(prompt).toContain('Message 999');
    });

    it('should handle empty tool arrays', () => {
      const prompt = getMasterPrompt(mockSession, []);

      expect(prompt).toContain('## Available Tools:');
      expect(prompt).toContain("ASSISTANT's turn. Your response:");
    });

    it('should handle null/undefined session data', () => {
      const emptySession: AgentSession = {
        id: 'empty',
        data: {
          id: 'empty',
          history: undefined as any,
          activeLlmProvider: 'openai',
          identities: [{ id: 'test', type: 'user' }],
          name: 'empty',
          timestamp: Date.now(),
        },
      };

      const prompt = getMasterPrompt(emptySession, mockTools);

      expect(prompt).toContain("ASSISTANT's turn. Your response:");
    });

    it('should maintain consistent output format', () => {
      const prompt1 = getMasterPrompt(mockSession, mockTools);
      const prompt2 = getMasterPrompt(mockSession, mockTools);

      expect(prompt1).toBe(prompt2); // Should be deterministic
    });
  });

  describe('Security Considerations', () => {
    it('should handle malicious content in messages safely', () => {
      mockSession.data.history = [
        {
          type: 'user',
          content: '<script>alert("xss")</script>',
          id: '1',
          timestamp: Date.now(),
        },
      ] as Message[];

      const prompt = getMasterPrompt(mockSession, mockTools);

      expect(prompt).toContain('<script>alert("xss")</script>');
      // Content should be included as-is for the LLM to process
    });

    it('should handle very large payloads without memory issues', () => {
      const largeWorkingContext = {
        currentFile: 'large-dataset.json',
        lastAction: `Processed ${Array.from({ length: 10000 }, (_, i) => i).join(',')}`,
      };

      mockSession.data.workingContext = largeWorkingContext;

      expect(() => getMasterPrompt(mockSession, mockTools)).not.toThrow();
    });

    it('should handle special characters in tool names and descriptions', () => {
      const emptySchema = z.object({});
      
      const specialTool: Tool = {
        name: 'tool_with-special.chars@domain',
        description: 'A tool with special chars: <>/"\'',
        parameters: emptySchema,
        execute: vi.fn(),
      };

      const prompt = getMasterPrompt(mockSession, [specialTool]);

      expect(prompt).toContain('tool_with-special.chars@domain');
      expect(prompt).toContain("A tool with special chars: <>/\"'");
    });
  });
});