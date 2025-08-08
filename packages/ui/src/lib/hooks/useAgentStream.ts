import { useCallback, useRef } from 'react';
import { produce } from 'immer';
import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';
import { type NewChatMessage, type AgentToolResult, type ChatMessage, type ToolResultMessage } from '@/types/chat';

// Define the structure of messages coming from the stream
interface StreamMessage {
  id?: string; // Add id to StreamMessage
  type:
    | 'tool_stream'
    | 'agent_thought'
    | 'tool_call'
    | 'tool.start'
    | 'tool_result'
    | 'agent_response'
    | 'raw_llm_response'
    | 'error'
    | 'close'
    | 'quota_exceeded'
    | 'browser.navigating'
    | 'browser.page.created'
    | 'browser.page.loaded'
    | 'browser.content.extracted'
    | 'browser.error'
    | 'browser.closed'
    | 'agent_canvas_output'
    | 'agent_canvas_close'
    | 'cli_task_start'
    | 'cli_task_end';
  content?: string;
  contentType?: 'html' | 'markdown' | 'url' | 'text';
  toolName?: string; // Added toolName here
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  message?: string;
  jobId?: string; // For CLI tasks
  data?: {
    name?: string;
    args?: Record<string, unknown>;
    content?: string;
    url?: string;
    length?: number;
    message?: string;
  };
}

const isAgentToolResult = (message: ChatMessage | undefined): message is AgentToolResult => {
  return (
    message?.type === 'tool_result' &&
    typeof (message as AgentToolResult).result === 'object' &&
    (message as AgentToolResult).result !== null &&
    'output' in (message as AgentToolResult).result
  );
};

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
    setActiveCliJobId,
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
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] handleClose called. Current EventSource state: ${eventSourceRef.current?.readyState}`);
      // Force console log to debug
      if (window.console?.log) {
        window.console.log('handleClose called. Current EventSource state:', eventSourceRef.current?.readyState);
      }
      
      setIsProcessing(false);
      setJobId(null);
      
      if (eventSourceRef.current) {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Closing EventSource connection`);
        if (window.console?.log) {
          window.console.log('Closing EventSource connection');
        }
        eventSourceRef.current.close(); // Close the EventSource
        eventSourceRef.current = null;
      }
      
      setAgentStatus(null);
    };

    const handleError = (error: Error) => {
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: `An error occurred: ${error.message}`,
      };
      addMessage(errorMessage);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${error.message}`);
      console.error('Agent stream error:', error);
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
        result: { output: result },
      };
      addMessage(toolResultMessage);
    };

    const onMessage = (event: MessageEvent) => {
      try {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] Raw SSE message received: ${event.data}`);
        console.log('Raw SSE message received:', event.data);

        // Handle heartbeat messages
        if (event.data === 'heartbeat') {
          // Just ignore heartbeat messages
          addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] Heartbeat message received and ignored`);
          return;
        }

        const data: StreamMessage = JSON.parse(event.data) as StreamMessage;
        console.log('Parsed SSE message:', data);

        // Log all incoming messages for debugging
        addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] Received message type: ${data.type}`);

        switch (data.type) {
          case 'tool_stream':
            if (data.data?.content) {
              useStore.setState(produce((state: { messages: ChatMessage[] }) => {
                const lastMessage = state.messages[state.messages.length - 1];
                const getLastToolName = (messages: ChatMessage[]): string | undefined => {
                  for (let i = messages.length - 1; i >= 0; i--) {
                    const message = messages[i];
                    if (message.type === 'tool_call' || message.type === 'tool_result') {
                      return message.toolName;
                    }
                  }
                  return undefined;
                };
                const inferredToolName = getLastToolName(state.messages);

                // Prioritize toolName from the stream message itself
                const streamToolName = data.toolName || data.data?.name;
                const finalToolName = streamToolName || inferredToolName || 'unknown_tool';

                if (isAgentToolResult(lastMessage) && lastMessage.toolName === finalToolName) {
                  lastMessage.result.output += data.data?.content ?? '';
                } else {
                  const newToolResult: ToolResultMessage = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'tool_result',
                    toolName: finalToolName,
                    result: { output: data.data?.content ?? '' },
                  } as ToolResultMessage; // Explicitly cast to avoid type issues
                  state.messages.push(newToolResult);
                }
              }));
            }
            break;
          case 'agent_thought':
            if (data.content) handleThought(data.content);
            break;
          case 'tool_call': {
            // This case is now handled by 'tool.start' from the backend
            // The LLM's tool_call response is just an instruction, not a confirmation of execution start.
            break;
          }
          case 'tool.start': { // New case for backend's tool.start event
            const toolName = data.data?.name;
            const params = data.data?.args;
            if (toolName && params) {
              handleToolCall(toolName, params as Record<string, unknown>); // Cast params to correct type
            }
            break;
          }
          case 'tool_result': {
            if (data.toolName && data.result && data.toolName !== 'finish') {
              handleToolResult(data.toolName, data.result);
            }
            break;
          }
          case 'agent_response':
            if (data.content) {
              handleMessage(data.content);
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
          case 'agent_canvas_close':
            handleClose();
            break;
          case 'cli_task_start':
            if (data.jobId) {
              setActiveCliJobId(data.jobId);
            }
            break;
          case 'cli_task_end':
            setActiveCliJobId(null);
            break;
          case 'close':
            addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Received 'close' message from server`);
            console.log('Received close message from server');
            setTimeout(() => {
              handleClose();
              setAgentProgress(100);
            }, 500); // Add a small delay to allow UI to update
            break;
          default:
            // Handle unknown message types
            addDebugLog(`[${new Date().toLocaleTimeString()}] [WARN] Unknown message type received: ${data.type}`);
            console.warn('Unknown message type received:', data);
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Error processing SSE message: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    try {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Starting agent with message: ${goal}`);
      console.log('Starting agent with message:', goal);
      
      const { jobId, eventSource } = await sendMessage(
        goal,
        authToken,
        sessionId,
        onMessage,
        (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] EventSource error callback: ${errorMessage}`);
          console.error('EventSource error callback:', error);
          handleError(new Error(errorMessage));
        },
        addDebugLog // Pass the debug logger
      );
      console.log('EventSource created:', eventSource);
      console.log('EventSource URL:', eventSource.url);
      console.log('EventSource readyState:', eventSource.readyState);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] EventSource created with URL: ${eventSource.url}`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] EventSource initial readyState: ${eventSource.readyState}`);
      setJobId(jobId);
      eventSourceRef.current = eventSource; // Store EventSource instance
      
      // Monitor EventSource state changes
      setTimeout(() => {
        if (eventSourceRef.current) {
          addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] EventSource state after 1s: ${eventSourceRef.current.readyState}`);
          console.log('EventSource state after 1s:', eventSourceRef.current.readyState);
        }
      }, 1000);
    } catch (error) {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Failed to create EventSource: ${error instanceof Error ? error.message : String(error)}`);
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
    setActiveCliJobId,
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
