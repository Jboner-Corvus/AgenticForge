export type AgentThought = { type: 'agent_thought'; content: string; };
export type AgentToolCall = { type: 'tool_call'; toolName: string; params: any; };
export type AgentToolResult = { type: 'tool_result'; toolName: string; result: any; };
export type AgentMessage = { type: 'agent_response'; content: string; sender: 'user' | 'assistant'; };
export type JobCompleted = { type: 'job_completed'; };
export type JobFailed = { type: 'job_failed'; };

export type DisplayableItem = AgentThought | AgentToolCall | AgentToolResult | AgentMessage | JobCompleted | JobFailed;
