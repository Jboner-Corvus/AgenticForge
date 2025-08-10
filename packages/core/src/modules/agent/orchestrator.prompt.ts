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

import { accessSync, constants, existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// FICHIER : src/prompts/orchestrator.prompt.ts
import type { AgentSession, Message, Tool } from '../../types.js';

import { getResponseJsonSchema } from './responseSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Corrige le chemin pour pointer vers le fichier source, que le code soit exécuté depuis /src ou /dist
const promptFilePath = path.resolve(__dirname, 'system.prompt.md');

// --- START DEBUG LOGS ---
console.log('DEBUG: __dirname:', __dirname);
console.log('DEBUG: promptFilePath:', promptFilePath);
console.log('DEBUG: File exists:', existsSync(promptFilePath));
try {
  accessSync(promptFilePath, constants.R_OK);
  console.log('DEBUG: File is readable.');
} catch (e: unknown) {
  if (e instanceof Error) {
    console.log('DEBUG: File is NOT readable. Error:', e.message);
  } else {
    console.log('DEBUG: File is NOT readable. Unknown error:', e);
  }
}
// --- END DEBUG LOGS ---

const PREAMBLE_CONTENT = readFileSync(promptFilePath, 'utf-8').replace(
  /`/g,
  '`',
);

const getPreamble = () => {
  const schema = JSON.stringify(getResponseJsonSchema(), null, 2);
  return PREAMBLE_CONTENT.replace('{{RESPONSE_JSON_SCHEMA}}', schema);
};

const TOOLS_SECTION_HEADER = '## Available Tools:';
const HISTORY_SECTION_HEADER = '## Conversation History:';
const WORKING_CONTEXT_HEADER = '## Working Context:';

const zodToJsonSchema = (_schema: any): any => {
  if (!_schema || !_schema._def || !_schema._def.typeName) {
    throw new Error(
      `Invalid Zod schema provided for JSON schema conversion: ${JSON.stringify(_schema)}`,
    );
  }

  const jsonSchema: any = {};

  // Add description if available
  if (_schema.description) {
    jsonSchema.description = _schema.description;
  }

  switch (_schema._def.typeName) {
    case 'ZodArray':
      jsonSchema.type = 'array';
      jsonSchema.items = zodToJsonSchema(_schema._def.type); // _schema._def.type holds the element _schema
      break;
    case 'ZodBoolean':
      jsonSchema.type = 'boolean';
      break;
    case 'ZodEnum':
      jsonSchema.type = 'string'; // Assuming string enums for simplicity
      jsonSchema.enum = _schema._def.values;
      break;
    case 'ZodLiteral': {
      const literalValue = _schema._def.value;
      jsonSchema.type = typeof literalValue;
      jsonSchema.const = literalValue;
      break;
    }
    case 'ZodNullable':
    case 'ZodOptional':
      // For optional/nullable types, we unwrap them and process their inner type
      // The optional/nullable status is handled by the 'required' array in ZodObject
      return zodToJsonSchema(_schema._def.innerType);
    case 'ZodNumber':
      jsonSchema.type = 'number';
      break;
    case 'ZodObject': {
      jsonSchema.type = 'object';
      jsonSchema.properties = {};
      jsonSchema.$schema = 'http://json-schema.org/draft-07/schema#';
      jsonSchema.additionalProperties = false;
      const required: string[] = [];
      for (const key in _schema.shape) {
        const field = _schema.shape[key];
        jsonSchema.properties[key] = zodToJsonSchema(field);
        // Check if the field is required (not optional, not nullable)
        if (!field.isOptional() && !field.isNullable()) {
          required.push(key);
        }
      }
      if (required.length > 0) {
        jsonSchema.required = required;
      }
      break;
    }
    case 'ZodString':
      jsonSchema.type = 'string';
      break;
    case 'ZodUnion':
      jsonSchema.anyOf = _schema._def.options.map((option: any) =>
        zodToJsonSchema(option),
      );
      break;
    case 'ZodEffects': {
      // Un ZodEffects enveloppe un autre schéma (ex: z.string().refine(...)).
      // On le déballe pour accéder au schéma sous-jacent.
      // Note: Cela ignore les effets (refine, transform) mais permet la conversion.
      return zodToJsonSchema(_schema._def.schema);
    }
    default:
      throw new Error(
        `Unsupported Zod type for JSON schema conversion: ${_schema._def.typeName}`,
      );
  }

  return jsonSchema;
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

const formatHistoryMessage = (message: Message): string => {
  let role: string;
  let content: string;

  switch (message.type) {
    case 'agent_canvas_output':
      role = 'ASSISTANT';
      content = `Canvas Output (${message.contentType}):
${message.content}`;
      break;
    case 'agent_response':
      role = 'ASSISTANT';
      content = message.content;
      break;
    case 'agent_thought':
      role = 'ASSISTANT';
      content = `Thought: ${message.content}`;
      break;
    case 'error':
      role = 'SYSTEM';
      content = `Error: ${message.content}`;
      break;
    case 'tool_call':
      role = 'ASSISTANT';
      content = `Tool Call: ${message.toolName}(${JSON.stringify(message.params, null, 2)})`;
      break;
    case 'tool_result':
      role = 'OBSERVATION';
      content = `Tool Result from ${message.toolName}: ${JSON.stringify(message.result, null, 2)}`;
      break;
    case 'user':
      role = 'USER';
      content = message.content;
      break;
    default:
      // This ensures we handle all message types, or TypeScript will complain.
      // @ts-expect-error - This is a guard for unhandled message types
      throw new Error(`Unknown message type: ${message.type}`);
  }

  // Truncate long content to avoid excessively long prompts
  const MAX_CONTENT_LENGTH = 5000;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = `${content.substring(0, MAX_CONTENT_LENGTH)}... (truncated)`;
  }

  return `${role}:\n${content}`;
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
    .map(formatHistoryMessage)
    .join('\n\n');
  const historySection =
    formattedHistory.length > 0
      ? `${HISTORY_SECTION_HEADER}\n${formattedHistory}`
      : '';

  return `${getPreamble()}\n\n${workingContextSection}${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};
