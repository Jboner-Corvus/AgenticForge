import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { llmResponseSchema, getResponseJsonSchema } from './responseSchema.js';

// Mock zod-to-json-schema
vi.mock('zod-to-json-schema', () => ({
  zodToJsonSchema: vi.fn().mockReturnValue({
    type: 'object',
    properties: {
      answer: { type: 'string', description: 'Final answer' },
      canvas: { type: 'object', description: 'Canvas output' },
      command: { type: 'object', description: 'Tool command' },
      thought: { type: 'string', description: 'Internal thought' },
    },
    additionalProperties: false,
  }),
}));

describe('Response Schema Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema Structure Validation', () => {
    it('should have correct top-level structure', () => {
      expect(llmResponseSchema).toBeDefined();
      expect(llmResponseSchema._def.typeName).toBe('ZodObject');
      expect(llmResponseSchema.shape).toHaveProperty('answer');
      expect(llmResponseSchema.shape).toHaveProperty('canvas');
      expect(llmResponseSchema.shape).toHaveProperty('command');
      expect(llmResponseSchema.shape).toHaveProperty('thought');
    });

    it('should make all fields optional', () => {
      expect(llmResponseSchema.shape.answer.isOptional()).toBe(true);
      expect(llmResponseSchema.shape.canvas.isOptional()).toBe(true);
      expect(llmResponseSchema.shape.command.isOptional()).toBe(true);
      expect(llmResponseSchema.shape.thought.isOptional()).toBe(true);
    });

    it('should have proper field types', () => {
      expect(llmResponseSchema.shape.answer._def.typeName).toBe('ZodOptional');
      expect(llmResponseSchema.shape.answer._def.innerType._def.typeName).toBe('ZodString');
      
      expect(llmResponseSchema.shape.canvas._def.typeName).toBe('ZodOptional');
      expect(llmResponseSchema.shape.canvas._def.innerType._def.typeName).toBe('ZodObject');
      
      expect(llmResponseSchema.shape.command._def.typeName).toBe('ZodOptional');
      expect(llmResponseSchema.shape.command._def.innerType._def.typeName).toBe('ZodObject');
      
      expect(llmResponseSchema.shape.thought._def.typeName).toBe('ZodOptional');
      expect(llmResponseSchema.shape.thought._def.innerType._def.typeName).toBe('ZodString');
    });
  });

  describe('Answer Field Validation', () => {
    it('should accept valid answer strings', () => {
      const validAnswers = [
        { answer: 'Hello, world!' },
        { answer: 'This is a long answer with multiple sentences.' },
        { answer: '42' },
        { answer: '' }, // Empty string should be valid
      ];

      validAnswers.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject non-string answer values', () => {
      const invalidAnswers = [
        { answer: 42 },
        { answer: true },
        { answer: {} },
        { answer: [] },
        { answer: null },
      ];

      invalidAnswers.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should allow omitting answer field', () => {
      expect(() => llmResponseSchema.parse({})).not.toThrow();
      expect(() => llmResponseSchema.parse({ thought: 'thinking...' })).not.toThrow();
    });
  });

  describe('Canvas Field Validation', () => {
    it('should accept valid canvas objects', () => {
      const validCanvas = [
        {
          canvas: {
            content: '<h1>Hello</h1>',
            contentType: 'html',
          },
        },
        {
          canvas: {
            content: '# Markdown Header',
            contentType: 'markdown',
          },
        },
        {
          canvas: {
            content: 'Plain text content',
            contentType: 'text',
          },
        },
        {
          canvas: {
            content: 'https://example.com',
            contentType: 'url',
          },
        },
      ];

      validCanvas.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid canvas content types', () => {
      const invalidContentTypes = [
        { canvas: { content: 'test', contentType: 'pdf' } },
        { canvas: { content: 'test', contentType: 'json' } },
        { canvas: { content: 'test', contentType: 'xml' } },
        { canvas: { content: 'test', contentType: '' } },
      ];

      invalidContentTypes.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should reject canvas objects missing required fields', () => {
      const incompleteCanvas = [
        { canvas: { content: 'test' } }, // Missing contentType
        { canvas: { contentType: 'html' } }, // Missing content
        { canvas: {} }, // Missing both
      ];

      incompleteCanvas.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should reject non-string canvas content', () => {
      const invalidContent = [
        { canvas: { content: 123, contentType: 'text' } },
        { canvas: { content: {}, contentType: 'html' } },
        { canvas: { content: [], contentType: 'markdown' } },
        { canvas: { content: null, contentType: 'url' } },
      ];

      invalidContent.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });
  });

  describe('Command Field Validation', () => {
    it('should accept valid command objects', () => {
      const validCommands = [
        {
          command: {
            name: 'readFile',
            params: { path: '/test/file.txt' },
          },
        },
        {
          command: {
            name: 'writeFile',
            params: { path: '/test/output.txt', content: 'Hello' },
          },
        },
        {
          command: {
            name: 'simpleCommand',
          },
        },
        {
          command: {
            name: 'complexCommand',
            params: {
              nested: { deep: { value: 'test' } },
              array: [1, 2, 3],
              boolean: true,
              number: 42,
            },
          },
        },
      ];

      validCommands.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject commands with non-string names', () => {
      const invalidNames = [
        { command: { name: 123 } },
        { command: { name: {} } },
        { command: { name: [] } },
        { command: { name: null } },
        { command: { name: true } },
      ];

      invalidNames.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should reject commands missing name field', () => {
      const incompleteCommands = [
        { command: {} },
        { command: { params: { test: 'value' } } },
      ];

      incompleteCommands.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should accept commands without params', () => {
      expect(() =>
        llmResponseSchema.parse({
          command: { name: 'noParamsCommand' },
        })
      ).not.toThrow();
    });

    it('should accept various param types', () => {
      const paramsVariations = [
        { command: { name: 'test', params: {} } },
        { command: { name: 'test', params: { string: 'value' } } },
        { command: { name: 'test', params: { number: 42 } } },
        { command: { name: 'test', params: { boolean: true } } },
        { command: { name: 'test', params: { array: [1, 'two', true] } } },
        { command: { name: 'test', params: { object: { nested: 'value' } } } },
      ];

      paramsVariations.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('Thought Field Validation', () => {
    it('should accept valid thought strings', () => {
      const validThoughts = [
        { thought: 'I need to analyze this problem.' },
        { thought: 'Let me think about the best approach...' },
        { thought: 'The user is asking for help with file operations.' },
        { thought: '' }, // Empty thought should be valid
        { thought: 'A very long thought that goes on and on and describes the reasoning process in great detail.' },
      ];

      validThoughts.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject non-string thought values', () => {
      const invalidThoughts = [
        { thought: 42 },
        { thought: true },
        { thought: {} },
        { thought: [] },
        { thought: null },
      ];

      invalidThoughts.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });
  });

  describe('Combined Field Validation', () => {
    it('should accept objects with multiple valid fields', () => {
      const combinedValid = [
        {
          thought: 'I need to read the file first',
          command: { name: 'readFile', params: { path: '/test.txt' } },
        },
        {
          canvas: { content: '<h1>Result</h1>', contentType: 'html' },
          answer: 'Here is the visualization',
        },
        {
          thought: 'Processing...',
          canvas: { content: 'Processing data...', contentType: 'text' },
          command: { name: 'process', params: {} },
        },
        {
          answer: 'Final answer',
          thought: 'This completes the task',
        },
      ];

      combinedValid.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).not.toThrow();
      });
    });

    it('should accept empty objects', () => {
      expect(() => llmResponseSchema.parse({})).not.toThrow();
    });

    it('should reject objects with invalid combinations', () => {
      const invalidCombinations = [
        {
          answer: 'Valid answer',
          command: { name: 123 }, // Invalid command name
        },
        {
          thought: 'Valid thought',
          canvas: { content: 'test' }, // Missing contentType
        },
        {
          canvas: { content: 'test', contentType: 'html' },
          answer: 42, // Invalid answer type
        },
      ];

      invalidCombinations.forEach((data) => {
        expect(() => llmResponseSchema.parse(data)).toThrow();
      });
    });

    it('should ignore unknown fields', () => {
      const dataWithUnknownFields = {
        answer: 'Valid answer',
        unknownField: 'This should be ignored',
        anotherUnknown: { nested: 'object' },
      };

      const result = llmResponseSchema.parse(dataWithUnknownFields);
      expect(result).toEqual({ answer: 'Valid answer' });
      expect(result).not.toHaveProperty('unknownField');
    });
  });

  describe('JSON Schema Generation', () => {
    it('should generate valid JSON schema', () => {
      const jsonSchema = getResponseJsonSchema();

      expect(jsonSchema).toBeDefined();
      expect((jsonSchema as any).type).toBe('object');
      expect((jsonSchema as any).properties).toBeDefined();
      expect((jsonSchema as any).additionalProperties).toBe(false);
    });

    it('should include all expected properties in JSON schema', () => {
      const jsonSchema = getResponseJsonSchema();

      expect((jsonSchema as any).properties).toHaveProperty('answer');
      expect((jsonSchema as any).properties).toHaveProperty('canvas');
      expect((jsonSchema as any).properties).toHaveProperty('command');
      expect((jsonSchema as any).properties).toHaveProperty('thought');
    });

    it('should call zodToJsonSchema with correct options', () => {
      const mockZodToJsonSchema = vi.mocked(require('zod-to-json-schema').zodToJsonSchema);
      
      getResponseJsonSchema();

      expect(mockZodToJsonSchema).toHaveBeenCalledWith(
        llmResponseSchema,
        { $refStrategy: 'none' }
      );
    });

    it('should be deterministic', () => {
      const schema1 = getResponseJsonSchema();
      const schema2 = getResponseJsonSchema();

      expect(schema1).toEqual(schema2);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical LLM responses', () => {
      const typicalResponses = [
        // Pure thought response
        {
          thought: 'The user wants me to help with file operations. I should check what files are available first.',
        },
        // Tool execution response
        {
          thought: 'I need to read the file to understand its contents.',
          command: { name: 'readFile', params: { path: '/data/input.txt' } },
        },
        // Canvas display response
        {
          thought: 'I should visualize this data for better understanding.',
          canvas: {
            content: '<div><h2>Data Visualization</h2><p>Chart goes here</p></div>',
            contentType: 'html',
          },
        },
        // Final answer response
        {
          answer: 'I have successfully processed your request. The file contains 150 lines of data with customer information.',
        },
        // Complex workflow response
        {
          thought: 'Now I have all the data, let me create a summary report.',
          canvas: {
            content: '# Summary Report\n\n- Total records: 150\n- Valid entries: 142\n- Errors: 8',
            contentType: 'markdown',
          },
          command: { name: 'saveReport', params: { filename: 'summary.md' } },
        },
      ];

      typicalResponses.forEach((response, index) => {
        expect(() => llmResponseSchema.parse(response), `Response ${index} should be valid`).not.toThrow();
      });
    });

    it('should reject malformed LLM responses', () => {
      const malformedResponses = [
        // Invalid command structure
        {
          command: 'readFile', // Should be object, not string
        },
        // Invalid canvas structure
        {
          canvas: 'Some HTML content', // Should be object with content and contentType
        },
        // Mixed invalid types
        {
          thought: ['thinking', 'more thinking'], // Should be string, not array
          answer: { text: 'answer' }, // Should be string, not object
        },
        // Invalid nested structures
        {
          command: {
            name: 'validName',
            params: 'invalid params', // Should be object, not string
          },
        },
      ];

      malformedResponses.forEach((response, index) => {
        expect(() => llmResponseSchema.parse(response), `Response ${index} should be invalid`).toThrow();
      });
    });

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        // Very long strings
        {
          thought: 'A'.repeat(10000),
          answer: 'B'.repeat(5000),
        },
        // Unicode and special characters
        {
          answer: '🚀 Success! The data contains émojis and spéciâl characters.',
          canvas: {
            content: '<p>Unicode test: 你好世界 🌍</p>',
            contentType: 'html',
          },
        },
        // Complex nested parameters
        {
          command: {
            name: 'complexOperation',
            params: {
              config: {
                nested: {
                  deep: {
                    value: 'deeply nested',
                    array: [1, 2, { inner: 'object' }],
                  },
                },
              },
              metadata: {
                timestamp: '2024-01-01T00:00:00Z',
                version: '1.0.0',
                tags: ['tag1', 'tag2'],
              },
            },
          },
        },
        // Empty strings and minimal objects
        {
          thought: '',
          canvas: { content: '', contentType: 'text' },
          command: { name: 'minimal' },
        },
      ];

      edgeCases.forEach((edgeCase, index) => {
        expect(() => llmResponseSchema.parse(edgeCase), `Edge case ${index} should be valid`).not.toThrow();
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large objects efficiently', () => {
      const largeObject = {
        command: {
          name: 'processLargeDataset',
          params: {
            data: Array.from({ length: 1000 }, (_, i) => ({
              id: i,
              value: `Item ${i}`,
              metadata: { created: Date.now(), index: i },
            })),
          },
        },
      };

      const start = Date.now();
      expect(() => llmResponseSchema.parse(largeObject)).not.toThrow();
      const end = Date.now();

      expect(end - start).toBeLessThan(100); // Should parse within 100ms
    });

    it('should not leak memory with repeated parsing', () => {
      const testObject = {
        thought: 'Repeated parsing test',
        command: { name: 'test', params: { iteration: 0 } },
      };

      // Parse the same structure many times
      for (let i = 0; i < 1000; i++) {
        testObject.command.params.iteration = i;
        expect(() => llmResponseSchema.parse(testObject)).not.toThrow();
      }
    });
  });
});