import { Tool } from 'fastmcp';
import { Message } from '../../types.js';

interface AgentContext {
  objective: string;
  history: Message[];
  iterations: number;
  scratchpad: string[];
}

export function getOrchestratorPrompt(
  context: AgentContext,
  tools: Tool[],
): string {
  const toolDescriptions = tools
    .map((tool) => `- ${tool.name}: ${tool.description}`)
    .join('\n');

  const toolNames = tools.map((tool) => tool.name).join(', ');

  const historyContent = context.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join('\n');

  const scratchpadContent = context.scratchpad.join('\n');

  return `You are an autonomous agent designed to achieve the following objective:
${context.objective}

YouYou have access to the following tools:
${toolDescriptions}

To use a tool, you must respond with a JSON object in the following format:
{
  "thought": "Your thought process for the current step.",
  "command": {
    "name": "tool_name",
    "params": { "param1": "value1", "param2": "value2" }
  }
}

If you have achieved the objective or cannot proceed, respond with a JSON object containing only your final thought:
{
  "thought": "Your final answer or a statement that you cannot achieve the objective."
}

Your current history:
${historyContent}

Your scratchpad (intermediate thoughts and tool results):
${scratchpadContent}

Begin!
`;
}