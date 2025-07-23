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

// FICHIER : src/prompts/orchestrator.prompt.ts
import type { AgentSession, Message, Tool } from '@/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptFilePath = path.resolve(__dirname, 'system.prompt.md');
const getPreamble = () =>
  readFileSync(promptFilePath, 'utf-8').replace(/`/g, '`');

const TOOLS_SECTION_HEADER = '## Available Tools:';
const HISTORY_SECTION_HEADER = '## Conversation History:';
const WORKING_CONTEXT_HEADER = '## Working Context:';

const zodToJsonSchema = (schema: any): any => {
  if (!schema || !schema.shape) {
    return {};
  }

  const properties: { [key: string]: any } = {};
  for (const key in schema.shape) {
    const field = schema.shape[key];
    const fieldSchema: { [key: string]: any } = {};

    // Determine type
    if (field._def.typeName === 'ZodString') {
      fieldSchema.type = 'string';
    } else if (field._def.typeName === 'ZodNumber') {
      fieldSchema.type = 'number';
    } else if (field._def.typeName === 'ZodBoolean') {
      fieldSchema.type = 'boolean';
    } else if (field._def.typeName === 'ZodObject') {
      // Recursively handle nested objects
      const nestedSchema = zodToJsonSchema(field);
      fieldSchema.type = nestedSchema.type;
      fieldSchema.properties = nestedSchema.properties;
    }

    // Add description if available
    if (field.description) {
      fieldSchema.description = field.description;
    }

    properties[key] = fieldSchema;
  }

  return {
    properties,
    type: 'object',
  };
};

const formatToolForPrompt = (tool: Tool): string => {
  if (
    !tool.parameters ||
    !('shape' in tool.parameters) ||
    Object.keys(tool.parameters.shape).length === 0
  ) {
    return `### ${tool.name}\nDescription: ${tool.description}\nParameters: None\n`;
  }
  const params = JSON.stringify(zodToJsonSchema(tool.parameters), null, 2);
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
  const historySection =
    formattedHistory.length > 0
      ? `${HISTORY_SECTION_HEADER}
${formattedHistory}`
      : '';

  return `${getPreamble()}\n\n${workingContextSection}${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};
