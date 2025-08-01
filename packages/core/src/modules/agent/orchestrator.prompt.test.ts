import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { AgentSession, Tool } from '../../types';
import { getMasterPrompt } from './orchestrator.prompt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptFilePath = path.resolve(__dirname, 'system.prompt.md');
const PREAMBULE = readFileSync(promptFilePath, 'utf-8').replace(/`/g, '`');

describe('getMasterPrompt', () => {
  const mockSession: AgentSession = {
    data: {
      history: [
        {
          content: 'Hello',
          id: '1',
          timestamp: Date.now(),
          type: 'user',
        },
        {
          content: 'Hi there!',
          id: '2',
          timestamp: Date.now(),
          type: 'agent_response',
        },
      ],
      id: 'test-session-id',
      identities: [],
      name: 'Test Session',
      timestamp: Date.now(),
      workingContext: { currentFile: 'example.txt', lastAction: 'mock-action' },
    },
    id: 'test-session-id',
  };

  const mockTools: Tool[] = [
    {
      description: 'A tool for testing',
      execute: vi.fn(),
      name: 'testTool',
      parameters: z.object({
        param1: z.string().describe('Description for param1'),
        param2: z.number(),
      }),
    },
    {
      description: 'Another tool',
      execute: vi.fn(),
      name: 'anotherTool',
      parameters: z.object({}), // Tool with empty parameters
    },
    {
      description: 'Tool with no parameters',
      execute: vi.fn(),
      name: 'noParamsTool',
      parameters: z.object({}), // Tool with undefined parameters
    },
  ];

  it('should correctly format the master prompt with all sections', () => {
    const prompt = getMasterPrompt(mockSession, mockTools);

    // Check Preamble
    expect(prompt).toContain(PREAMBULE.split('\n')[0]);

    // Check Working Context
    expect(prompt).toContain('## Working Context:');
    expect(prompt).toContain(
      JSON.stringify(mockSession.data.workingContext, null, 2),
    );

    // Check Tools Section
    expect(prompt).toContain('## Available Tools:');
    expect(prompt).toContain('### testTool');
    expect(prompt).toContain('Description: A tool for testing');
    expect(prompt).toContain('Parameters (JSON Schema):');

    const jsonSchemaString = prompt
      .split('Parameters (JSON Schema):')[1]
      .split('###')[0]
      .trim();
    const expectedSchema = zodToJsonSchema(mockTools[0].parameters);
    expect(JSON.parse(jsonSchemaString)).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      ...expectedSchema,
    });

    expect(prompt).toContain('### anotherTool');
    expect(prompt).toContain('Description: Another tool');
    expect(prompt).toContain('Parameters: None');

    expect(prompt).toContain('### noParamsTool');
    expect(prompt).toContain('Description: Tool with no parameters');
    expect(prompt).toContain('Parameters: None');

    // Check History Section
    expect(prompt).toContain('## Conversation History:');
    expect(prompt).toContain('USER:\nHello');
    expect(prompt).toContain('ASSISTANT:\nHi there!');

    // Check Assistant's turn
    expect(prompt).toContain("ASSISTANT's turn. Your response:");
  });

  it('should correctly convert a Zod object with an array of objects to JSON schema', () => {
    const complexSchema = z.object({
      count: z.number().optional(),
      users: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        }),
      ),
    });

    const schema = zodToJsonSchema(complexSchema);
    expect(schema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      additionalProperties: false,
      properties: {
        count: { type: 'number' },
        users: {
          items: {
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
            type: 'object',
          },
          type: 'array',
        },
      },
      required: ['users'],
      type: 'object',
    });
  });

  it('should handle empty working context', () => {
    const sessionWithoutContext: AgentSession = {
      data: {
        history: [
          {
            content: 'Hello',
            id: '1',
            timestamp: Date.now(),
            type: 'user',
          },
        ],
        id: 'test-session-id-2',
        identities: [],
        name: 'Test Session 2',
        timestamp: Date.now(),
        workingContext: undefined,
      },
      id: 'test-session-id-2',
    };
    const prompt = getMasterPrompt(sessionWithoutContext, mockTools);
    expect(prompt).not.toContain('## Working Context:');
  });

  it('should handle empty history', () => {
    const sessionWithoutHistory: AgentSession = {
      data: {
        history: [],
        id: 'test-session-id-3',
        identities: [],
        name: 'Test Session 3',
        timestamp: Date.now(),
        workingContext: {
          currentFile: 'example.txt',
          lastAction: 'mock-action',
        },
      },
      id: 'test-session-id-3',
    };
    const prompt = getMasterPrompt(sessionWithoutHistory, mockTools);
    expect(prompt).not.toContain('## Conversation History:');
  });

  it('should handle no tools', () => {
    const prompt = getMasterPrompt(mockSession, []);
    expect(prompt).toContain('## Available Tools:');
    expect(prompt).not.toContain('###');
  });
});
