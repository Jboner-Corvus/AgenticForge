// packages/core/src/modules/agent/responseSchema.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const llmResponseSchema = z.object({
  answer: z
    .string()
    .optional()
    .describe(
      "The final answer to the user's request. Use this when you have completed the task and are ready to respond to the user.",
    ),
  canvas: z
    .object({
      content: z
        .string()
        .describe(
          'The content to display on the canvas. Can be HTML, Markdown, or just text.',
        ),
      contentType: z
        .enum(['html', 'markdown', 'text', 'url'])
        .describe('The content type of the canvas content.'),
    })
    .optional()
    .describe(
      'The canvas is a visual workspace. Use it to display rich content to the user, like charts, tables, or interactive elements.',
    ),
  command: z
    .object({
      name: z.string().describe('The name of the tool to execute.'),
      params: z
        .record(z.string(), z.any())
        .optional()
        .describe('The parameters for the tool, as a JSON object.'),
    })
    .optional()
    .describe('The command to execute. Use this to call a tool.'),
  thought: z
    .string()
    .optional()
    .describe(
      'Your internal monologue. Use it to reason about the task, process information, and plan your next steps. This is not shown to the user.',
    ),
});

export function getResponseJsonSchema() {
  return zodToJsonSchema(llmResponseSchema, {
    $refStrategy: 'none',
  });
}
