// ATTENTION : Ce fichier est critique pour le fonctionnement de l'agent.
// Il construit le prompt système qui instruit le LLM sur son comportement,
// les outils disponibles et le format de réponse attendu.
//
// TOUTE MODIFICATION ICI PEUT IMPACTER DIRECTEMENT LA PERFORMANCE ET LA FIABILITÉ DE L'AGENT.
//
// Spécifiquement, les instructions dans `system.prompt.md` et la manière dont les
// outils sont formatés dictent la structure JSON que le LLM doit retourner.
// Cette structure est validée par `llmResponseSchema` dans `packages/core/src/agent.ts`.
// Assurez-vous que les deux fichiers restent synchronisés.

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'util';

// FICHIER : src/prompts/orchestrator.prompt.ts
import type { AgentSession, Message, Tool } from '@/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptFilePath = path.resolve(__dirname, 'system.prompt.md');
const getPreamble = () => readFileSync(promptFilePath, 'utf-8').replace(/`/g, '\`');

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
    .map((h: Message) => `${h.role.toUpperCase()}:
${h.content}`)
    .join('

');
  const historySection = formattedHistory
    ? `${HISTORY_SECTION_HEADER}
${formattedHistory}`
    : '';

  return `${getPreamble()}

${workingContextSection}${toolsSection}

${historySection}

ASSISTANT's turn. Your response:`;
};
