/**
 * src/prompts/orchestrator.prompt.ts
 *
 * Génère le prompt principal pour le LLM, lui donnant son rôle,
 * les outils disponibles, et l'historique de la conversation.
 * * VERSION PROMETHEUS : Le prompt inclut maintenant la capacité de
 * l'agent à créer ses propres outils.
 */
import type { Tool, AgentSession, Message } from '../types.js'; // CORRIGÉ : Ajout de l'import 'Message'
import { format } from 'util';

const getCurrentDate = () => new Date().toISOString();

// Le préambule reste inchangé
const PREAMBULE = `You are Agentic-MCP (Prometheus Mode), a fully autonomous AI assistant with the ultimate ability: you can write your own tools. Your purpose is to achieve user goals by any means necessary, including by expanding your own capabilities.

Today's date is: %s.

## CORE DIRECTIVE: SELF-IMPROVEMENT
If you determine that you lack a specific tool to accomplish a task, you MUST create it. Do not state that you cannot do something. Instead, create the tool that allows you to do it.

## TOOL CREATION FLOW:
1.  **PLAN THE TOOL**: Decide on a tool name, description, parameters (using Zod schema syntax as a string), and the TypeScript code for its 'execute' function.
2.  **CREATE THE TOOL**: Use the \`system_createTool\` to write the new tool's source code to the filesystem.
3.  **RELOAD YOURSELF**: Use the \`system_restartServer\` tool. This is CRUCIAL. It will restart your own process to load the new tool into your memory.
4.  **USE THE NEW TOOL**: After the restart, you can use the tool you just created to complete the original task.

## Standard Execution Flow:
1.  **Think**: Analyze the goal. If you have the tools, plan the steps. If not, plan the tool creation.
2.  **Act**: Choose ONE tool. This could be a standard tool OR one of your self-improvement tools.
3.  **Output**: Respond strictly in the required format.

## Response Format (MANDATORY):

<tool_code>
{
  "tool": "tool_name",
  "parameters": { ... }
}
</tool_code>

If the task is complete, use the "finish" tool.
`;

const TOOLS_SECTION_HEADER = '## Available Tools:';
const HISTORY_SECTION_HEADER = '## Conversation History:';

const formatToolForPrompt = (tool: Tool): string => {
  // CORRIGÉ : La propriété correcte pour le schéma Zod est 'schema', pas 'parameters'.
  if (!tool.schema || !tool.schema.shape) {
    return `### ${tool.name}\nDescription: ${tool.description}\nParameters: None\n`;
  }
  // 'shape' est une propriété des objets Zod qui contient la structure des clés.
  const params = JSON.stringify(tool.schema.shape, null, 2);
  return `### ${tool.name}\nDescription: ${tool.description}\nParameters (JSON Schema):\n${params}\n`;
};

// CORRIGÉ : La fonction accepte l'objet 'session' complet pour un accès correct à l'historique.
export const getMasterPrompt = (
  session: AgentSession,
  tools: Tool[],
): string => {
  const formattedTools = tools.map(formatToolForPrompt).join('\n');
  const toolsSection = `${TOOLS_SECTION_HEADER}\n${formattedTools}`;

  // CORRIGÉ : L'historique est dans 'session.data.history' et 'h' est maintenant typé comme 'Message'.
  const formattedHistory = (session.data.history || [])
    .map((h: Message) => `${h.role.toUpperCase()}:\n${h.content}`)
    .join('\n\n');
  const historySection = `${HISTORY_SECTION_HEADER}\n${formattedHistory}`;

  return `${format(
    PREAMBULE,
    getCurrentDate(),
  )}\n\n${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};