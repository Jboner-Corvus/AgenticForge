interface BaseMessage {
  id: string;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
}

export interface AgentResponseMessage extends BaseMessage {
  type: 'agent_response';
  content: string;
}

export interface ToolCallMessage extends BaseMessage {
  type: 'tool_call';
  toolName: string;
  params: Record<string, unknown>;
}

export interface ToolResultMessage extends BaseMessage {
  type: 'tool_result';
  toolName: string;
  result: unknown;
}

export interface AgentToolResult extends ToolResultMessage {
  result: {
    output: string;
  };
}

export interface ThoughtMessage extends BaseMessage {
  type: 'agent_thought';
  content: string;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  content: string;
}

export interface AgentCanvasOutputMessage extends BaseMessage {
  type: 'agent_canvas_output';
  content: string;
  contentType: 'html' | 'markdown' | 'url' | 'text';
}

export type ChatMessage =
  | UserMessage
  | AgentResponseMessage
  | ToolCallMessage
  | ToolResultMessage
  | AgentToolResult
  | ThoughtMessage
  | ErrorMessage
  | AgentCanvasOutputMessage;

export type NewChatMessage =  | { type: 'user'; content: string }  | { type: 'agent_response'; content: string }  | { type: 'tool_call'; toolName: string; params: Record<string, unknown> }  | { type: 'tool_result'; toolName: string; result: unknown }  | { type: 'agent_thought'; content: string }  | { type: 'error'; content: string }  | { type: 'agent_canvas_output'; content: string; contentType: 'html' | 'markdown' | 'url' | 'text' };