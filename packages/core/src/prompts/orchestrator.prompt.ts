import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'util';

// FICHIER : src/prompts/orchestrator.prompt.ts
import type { AgentSession, Message, Tool } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptFilePath = path.resolve(__dirname, 'system.prompt.txt');
const PREAMBULE = readFileSync(promptFilePath, 'utf-8');

const TOOLS_SECTION_HEADER = '## Available Tools:';
const HISTORY_SECTION_HEADER = '## Conversation History:';
const WORKING_CONTEXT_HEADER = '## Working Context:';

const formatToolForPrompt = (tool: Tool): string => {
  // CORRIGÉ : La propriété est 'parameters' et contient le schéma Zod.
  if (!tool.parameters || !('shape' in tool.parameters)) {
    return `### ${tool.name}\nDescription: ${tool.description}\nParameters: None\n`;
  }
  const params = JSON.stringify(tool.parameters.shape, null, 2);
  return `### ${tool.name}\nDescription: ${tool.description}\nParameters (JSON Schema):\n${params}\n`;
};

export const getMasterPrompt = (
  session: AgentSession,
  tools: Tool[],
): string => {
  let workingContextSection = '';
  if (session.data.workingContext) {
    workingContextSection = `${WORKING_CONTEXT_HEADER}\n${JSON.stringify(
      session.data.workingContext,
      null,
      2,
    )}\n\n`;
  }

  const formattedTools = tools.map(formatToolForPrompt).join('\n');
  const toolsSection = `${TOOLS_SECTION_HEADER}\n${formattedTools}`;

  const formattedHistory = (session.data.history || [])
    .map((h: Message) => `${h.role.toUpperCase()}:\n${h.content}`)
    .join('\n\n');
  const historySection = `${HISTORY_SECTION_HEADER}\n${formattedHistory}`;

  return `${format(
    PREAMBULE,
    new Date().toISOString(),
  )}\n\n${workingContextSection}${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};
