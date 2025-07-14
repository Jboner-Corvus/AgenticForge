import { useCallback } from 'react';
import { produce } from 'immer';
import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';
import {  NewChatMessage,  AgentToolResult,  ChatMessage,} from '../../types/chat';

// Define the structure of messages coming from the stream
interface StreamMessage {
  type:
    | 'tool_stream'
    | 'agent_thought'
    | 'tool_call'
    | 'tool_result'
    | 'agent_response'
    | 'raw_llm_response'
    | 'error'
    | 'tool.start'
    | 'close'
    | 'quota_exceeded';
  content?: string;
  toolName?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  message?: string;
  data?: {
    name?: string;
    args?: Record<string, unknown>;
    content?: string;
  };
}

export const useAgentStream = () => {
  const {
    addMessage,
    authToken,
    messageInputValue,
    sessionId,
    setIsProcessing,
    setJobId,
    setMessageInputValue,
    setStreamCloseFunc,
    setAgentStatus,
    addDebugLog,
    setAgentProgress,
  } = useStore();

  const startAgent = useCallback(async () => {
    if (!messageInputValue.trim()) return;

    setIsProcessing(true);
    const userMessage: NewChatMessage = {
      type: 'user',
      content: messageInputValue,
    };
    addMessage(userMessage);
    const goal = messageInputValue;
    setMessageInputValue('');

    const callbacks = {
      onClose: () => {
        setIsProcessing(false);
        setJobId(null);
        setStreamCloseFunc(null);
        setAgentStatus(null);
      },
      onError: (error: Error) => {
        const errorMessage: NewChatMessage = {
          type: 'error',
          content: `An error occurred: ${error.message}`,
        };
        addMessage(errorMessage);
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${error.message}`);
        setIsProcessing(false);
      },
      onMessage: (content: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent response: ${content}`);
        useStore.setState(produce((state: { messages: ChatMessage[] }) => {
          const lastMessage = state.messages[state.messages.length - 1];
          if (lastMessage && lastMessage.type === 'agent_response') {
            lastMessage.content += content;
          } else {
            const agentMessage: NewChatMessage = {
              type: 'agent_response',
              content,
            };
            state.messages.push(agentMessage as ChatMessage);
          }
        }));
        setAgentProgress(Math.min(99, useStore.getState().agentProgress + 5));
      },
      onThought: (thought: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent thought: ${thought}`);
        const thoughtMessage: NewChatMessage = {
          type: 'agent_thought',
          content: thought,
        };
        addMessage(thoughtMessage);
      },
      onToolCall: (toolName: string, params: Record<string, unknown>) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool call: ${toolName} with params ${JSON.stringify(params)}`);
        setAgentStatus(`Executing tool: ${toolName}...`);
        const toolCallMessage: NewChatMessage = {
          type: 'tool_call',
          toolName,
          params,
        };
        addMessage(toolCallMessage);
      },
      onToolResult: (toolName: string, result: Record<string, unknown>) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool result for ${toolName}: ${JSON.stringify(result)}`);
        setAgentStatus(null);
        const toolResultMessage: NewChatMessage = {
          type: 'tool_result',
          toolName,
          result,
        };
        addMessage(toolResultMessage);
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data: StreamMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'tool_stream':
          if (data.data?.content) {
            useStore.setState(produce((state: { messages: ChatMessage[] }) => {
              const lastMessage = state.messages[state.messages.length - 1];
              if (lastMessage?.type === 'tool_result' && lastMessage.toolName === 'executeShellCommand') {
                const toolResult = lastMessage as AgentToolResult;
                toolResult.result.output += data.data?.content;
              } else {
                const newToolResult: NewChatMessage = {
                  type: 'tool_result',
                  toolName: 'executeShellCommand',
                  result: { output: data.data?.content },
                };
                addMessage(newToolResult);
              }
            }));
          }
          break;
        case 'agent_thought':
          if (data.content) callbacks.onThought(data.content);
          break;
        case 'tool_call':
          if (data.toolName && data.params) callbacks.onToolCall(data.toolName, data.params);
          break;
        case 'tool_result':
          if (data.toolName && data.result && data.toolName !== 'finish') {
            callbacks.onToolResult(data.toolName, data.result);
          }
          break;
        case 'agent_response':
          if (data.content) callbacks.onMessage(data.content);
          break;
        case 'raw_llm_response':
          if (data.content) addDebugLog(`[LLM_RAW] ${data.content}`);
          break;
        case 'error':
          if (data.message) callbacks.onError(new Error(data.message));
          break;
        case 'quota_exceeded':
            if (data.message) callbacks.onError(new Error(data.message));
            break;
        case 'tool.start':
          if (data.data?.name && data.data?.args) {
            callbacks.onToolCall(data.data.name, data.data.args);
          }
          break;
        case 'close':
          callbacks.onClose();
          setAgentProgress(100);
          break;
      }
    };

    try {
      const jobId = await sendMessage(
        goal,
        authToken,
        sessionId,
        onMessage,
        (error) => callbacks.onError(error instanceof Error ? error : new Error(String(error))),
      );
      setJobId(jobId);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    authToken,
    sessionId,
    addMessage,
    setIsProcessing,
    setJobId,
    setStreamCloseFunc,
    messageInputValue,
    setMessageInputValue,
    setAgentStatus,
    addDebugLog,
    setAgentProgress,
  ]);

  const interruptAgent = useCallback(async () => {
    const { streamCloseFunc, jobId, authToken, sessionId } = useStore.getState();
    if (jobId && streamCloseFunc) {
      await interrupt(jobId, authToken, sessionId);
      streamCloseFunc();
      setIsProcessing(false);
      setJobId(null);
      setStreamCloseFunc(null);
    }
  }, [setIsProcessing, setJobId, setStreamCloseFunc]);

  return {
    startAgent,
    interruptAgent,
  };
};
