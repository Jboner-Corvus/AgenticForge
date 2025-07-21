export type AgentMessage = {
  content: string;
  sender: 'assistant' | 'user';
  type: 'agent_response';
  timestamp: string;
};
export type AgentThought = { content: string; type: 'agent_thought'; timestamp: string; };
export type AgentToolCall = {
  params: Record<string, unknown>;
  toolName: string;
  type: 'tool_call';
  timestamp: string;
};
export type AgentToolResult = (
  | { result: Record<string, unknown>; toolName: string; }
  | { result: { output: string }; toolName: 'executeShellCommand'; }
) & { type: 'tool_result'; timestamp: string; };
export type JobCompleted = { type: 'job_completed'; timestamp: string; };

export type JobFailed = { type: 'job_failed'; timestamp: string; };

export type UserMessage = {
  content: string;
  sender: 'user';
  type: 'user_message';
  timestamp: string;
};

export type NewDisplayableItem =
  | AgentMessage
  | AgentThought
  | AgentToolCall
  | AgentToolResult
  | JobCompleted
  | JobFailed
  | ToolList
  | UserMessage;

export type Tool = {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
};

export type ToolList = {
  type: 'tool_list';
  tools: Tool[];
  timestamp: string;
};

export type DisplayableItem = NewDisplayableItem & { id: string };

export type ChatMessage = DisplayableItem;
