// FICHIER : src/prompts/orchestrator.prompt.ts
import type { Tool, AgentSession, Message } from '../types.js';
import { format } from 'util';

// ... (PREAMBULE inchangé) ...
const PREAMBULE = `You are Agentic-MCP (Prometheus Mode), a fully autonomous AI assistant...`;
const TOOLS_SECTION_HEADER = '## Available Tools:';
const HISTORY_SECTION_HEADER = '## Conversation History:';

const formatToolForPrompt = (tool: Tool): string => {
  // CORRIGÉ : La propriété est 'parameters' et contient le schéma Zod.
  if (!tool.parameters || !tool.parameters.shape) {
    return `### ${tool.name}\nDescription: ${tool.description}\nParameters: None\n`;
  }
  const params = JSON.stringify(tool.parameters.shape, null, 2);
  return `### ${tool.name}\nDescription: ${tool.description}\nParameters (JSON Schema):\n${params}\n`;
};

export const getMasterPrompt = (
  session: AgentSession,
  tools: Tool[],
): string => {
  const formattedTools = tools.map(formatToolForPrompt).join('\n');
  const toolsSection = `${TOOLS_SECTION_HEADER}\n${formattedTools}`;

  const formattedHistory = (session.data.history || [])
    .map((h: Message) => `${h.role.toUpperCase()}:\n${h.content}`)
    .join('\n\n');
  const historySection = `${HISTORY_SECTION_HEADER}\n${formattedHistory}`;

  return `${format(
    PREAMBULE,
    new Date().toISOString(),
  )}\n\n${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};