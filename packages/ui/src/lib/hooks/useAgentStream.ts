import { useCallback, useRef } from 'react';
import { produce } from 'immer';
import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';
import { type NewChatMessage, type AgentToolResult, type ChatMessage } from '@/types/chat';

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
    | 'quota_exceeded'
    | 'browser.navigating'
    | 'browser.page.created'
    | 'browser.page.loaded'
    | 'browser.content.extracted'
    | 'browser.error'
    | 'browser.closed'
    | 'agent_canvas_output';
  content?: string;
  contentType?: 'html' | 'markdown' | 'url' | 'text';
  toolName?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  message?: string;
  data?: {
    name?: string;
    args?: Record<string, unknown>;
    content?: string;
    url?: string;
    length?: number;
    message?: string;
  };
}

export const useAgentStream = () => {
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    addMessage,
    authToken,
    messageInputValue,
    sessionId,
    setIsProcessing,
    setJobId,
    setMessageInputValue,
    setAgentStatus,
    addDebugLog,
    setAgentProgress,
    setBrowserStatus,
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

    const handleClose = () => {
      setIsProcessing(false);
      setJobId(null);
      eventSourceRef.current?.close(); // Close the EventSource
      eventSourceRef.current = null;
      setAgentStatus(null);
    };

    const handleError = (error: Error) => {
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: `An error occurred: ${error.message}`,
      };
      addMessage(errorMessage);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${error.message}`);
      setIsProcessing(false);
      handleClose(); // Ensure EventSource is closed on error
    };

    const handleMessage = (content: string) => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent response: ${content}`);
      const agentMessage: NewChatMessage = {
        type: 'agent_response',
        content,
      };
      addMessage(agentMessage);
      setAgentProgress(Math.min(99, useStore.getState().agentProgress + 5));
    };

    const handleThought = (thought: string) => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent thought: ${thought}`);
      const thoughtMessage: NewChatMessage = {
        type: 'agent_thought',
        content: thought,
      };
      addMessage(thoughtMessage);
    };

    const handleToolCall = (toolName: string, params: Record<string, unknown>) => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool call: ${toolName} with params ${JSON.stringify(params)}`);
      setAgentStatus(`Executing tool: ${toolName}...`);
      const toolCallMessage: NewChatMessage = {
        type: 'tool_call',
        toolName,
        params,
      };
      addMessage(toolCallMessage);
    };

    const handleToolResult = (toolName: string, result: Record<string, unknown>) => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool result for ${toolName}: ${JSON.stringify(result)}`);
      setAgentStatus(null);
      const toolResultMessage: NewChatMessage = {
        type: 'tool_result',
        toolName,
        result,
      };
      addMessage(toolResultMessage);
    };

    const onMessage = (event: MessageEvent) => {
      const data: StreamMessage = JSON.parse(event.data) as StreamMessage;

      switch (data.type) {
        case 'tool_stream':
          if (data.data?.content) {
            useStore.setState(produce((state: { messages: ChatMessage[] }) => {
              const lastMessage = state.messages[state.messages.length - 1];
              if (lastMessage?.type === 'tool_result' && (lastMessage as AgentToolResult).toolName === 'executeShellCommand') {
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
          if (data.content) handleThought(data.content);
          break;
        case 'tool_call':
          if (data.toolName && data.params) handleToolCall(data.toolName, data.params);
          break;
        case 'tool_result':
          if (data.toolName && data.result && data.toolName !== 'finish') {
            handleToolResult(data.toolName, data.result);
          }
          break;
        case 'agent_response':
          if (data.content) {
            if (data.content === 'Agent displayed content on the canvas.') {
              handleClose();
            } else {
              handleMessage(data.content);
            }
          }
          break;
        case 'raw_llm_response':
          if (data.content) addDebugLog(`[LLM_RAW] ${data.content}`);
          break;
        case 'error':
          if (data.message) handleError(new Error(data.message));
          break;
        case 'quota_exceeded':
            if (data.message) handleError(new Error(data.message));
            break;
        case 'tool.start':
          if (data.data?.name && data.data?.args) {
            handleToolCall(data.data.name, data.data.args);
          }
          break;
        case 'browser.navigating':
          setBrowserStatus(`Navigating to ${data.data?.url}`);
          break;
        case 'browser.page.created':
          setBrowserStatus('Page created');
          break;
        case 'browser.page.loaded':
          setBrowserStatus(`Page loaded: ${data.data?.url}`);
          break;
        case 'browser.content.extracted':
          setBrowserStatus(`Content extracted: ${data.data?.length} bytes`);
          break;
        case 'browser.error':
          setBrowserStatus(`Error: ${data.data?.message}`);
          break;
        case 'browser.closed':
          setBrowserStatus('Browser closed');
          break;
        case 'agent_canvas_output':
          if (data.content && data.contentType) {
            const canvasOutputMessage: NewChatMessage = {
              type: 'agent_canvas_output',
              content: data.content,
              contentType: data.contentType,
            };
            addMessage(canvasOutputMessage);
            addDebugLog(`[DISPLAY_OUTPUT] Type: ${data.contentType}, Content length: ${data.content.length}`);
          }
          break;
        case 'close':
          setTimeout(() => {
            handleClose();
            setAgentProgress(100);
          }, 500); // Add a small delay to allow UI to update
          break;
      }
    };

    try {
      const { jobId, eventSource } = await sendMessage(
        goal,
        authToken,
        sessionId,
        onMessage,
        (error) => handleError(error instanceof Error ? error : new Error(String(error))),
      );
      setJobId(jobId);
      eventSourceRef.current = eventSource; // Store EventSource instance
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    authToken,
    sessionId,
    addMessage,
    setIsProcessing,
    setJobId,
    messageInputValue,
    setMessageInputValue,
    setAgentStatus,
    addDebugLog,
    setAgentProgress,
    setBrowserStatus,
  ]);

  const interruptAgent = useCallback(async () => {
    const { jobId, authToken, sessionId } = useStore.getState();
    if (jobId && eventSourceRef.current) {
      await interrupt(jobId, authToken, sessionId);
      eventSourceRef.current.close(); // Close EventSource directly
      eventSourceRef.current = null;
      useStore.getState().setIsProcessing(false);
      useStore.getState().setJobId(null);
    }
  }, []);

  return {
    startAgent,
    interruptAgent,
  };
};
