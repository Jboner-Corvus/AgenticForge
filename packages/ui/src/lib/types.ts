export type AgentMessage = { content: string; sender: 'assistant' | 'user'; type: 'agent_response'; };
export type AgentThought = { content: string; type: 'agent_thought'; };
export type AgentToolCall = { params: Record<string, unknown>; toolName: string; type: 'tool_call'; };
export type AgentToolResult = { result: Record<string, unknown>; toolName: string; type: 'tool_result'; };
export type DisplayableItem = AgentMessage | AgentThought | AgentToolCall | AgentToolResult | JobCompleted | JobFailed;
export type JobCompleted = { type: 'job_completed'; };

export type JobFailed = { type: 'job_failed'; };
