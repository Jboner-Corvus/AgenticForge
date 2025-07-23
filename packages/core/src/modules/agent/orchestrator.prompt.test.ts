import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { AgentSession, Tool } from '@/types';

import { getMasterPrompt } from './orchestrator.prompt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptFilePath = path.resolve(__dirname, 'system.prompt.md');
const PREAMBULE = readFileSync(promptFilePath, 'utf-8').replace(/`/g, '`');

describe('getMasterPrompt', () => {
  const mockSession: AgentSession = {
    data: {
      history: [
        { content: 'Hello', role: 'user' },
        { content: 'Hi there!', role: 'model' },
      ],
      id: 'test-session-id',
      identities: [],
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
    expect(prompt).toContain(PREAMBULE.split('\n')[0]); // Check first line of preamble

    // Check Working Context
    expect(prompt).toContain('## Working Context:');
    expect(prompt).toContain(JSON.stringify(mockSession.data.workingContext, null, 2));

    // Check Tools Section
    expect(prompt).toContain('## Available Tools:');
    expect(prompt).toContain('### testTool');
    expect(prompt).toContain('Description: A tool for testing');
    expect(prompt).toContain('Parameters (JSON Schema):');
    
    const jsonSchemaString = prompt.split('Parameters (JSON Schema):')[1].split('###')[0].trim();
    const jsonSchema = JSON.parse(jsonSchemaString);

    expect(jsonSchema).toEqual({
      properties: {
        param1: {
          description: "Description for param1",
          type: "string"
        },
        param2: {
          type: "number"
        }
      },
      type: "object"
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
    expect(prompt).toContain('MODEL:\nHi there!');

    // Check Assistant's turn
    expect(prompt).toContain("ASSISTANT's turn. Your response:");
  });

  it('should handle empty working context', () => {
    const sessionWithoutContext: AgentSession = {
      data: {
        history: [
          { content: 'Hello', role: 'user' },
        ],
        id: 'test-session-id-2',
        identities: [],
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
        workingContext: { currentFile: 'example.txt', lastAction: 'mock-action' },
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