export interface UserMessage {
  type: 'user';
  content: string;
}

export interface AgentMessage {
  type: 'agent_response';
  content: string;
}

export interface ToolStartMessage {
  type: 'tool.start';
  data: {
    name: string;
    args: unknown;
  };
}

export interface ToolResultMessage {
  type: 'tool_result';
  toolName: string;
  result: unknown;
}

export interface ThoughtMessage {
  type: 'agent_thought';
  content: string;
}

export interface ErrorMessage {
  type: 'error';
  content: string;
}

export type ChatMessage =
  | UserMessage
  | AgentMessage
  | ToolStartMessage
  | ToolResultMessage
  | ThoughtMessage
  | ErrorMessage;
