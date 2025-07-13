import { useCallback } from 'react';

import { produce } from 'immer';

import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';
import { generateUUID } from '../utils/uuid';
import { DisplayableItem, UserMessage, AgentToolResult } from '../types';

interface ToolStreamMessage {
  type: 'tool_stream';
  data: {
    content: string;
  };
}

interface AgentThoughtMessage {
  type: 'agent_thought';
  content: string;
}

interface ToolCallMessage {
  type: 'tool_call';
  toolName: string;
  params: Record<string, unknown>;
}

interface ToolResultMessage {
  type: 'tool_result';
  toolName: string;
  result: Record<string, unknown>;
}

interface AgentResponseMessage {
  type: 'agent_response';
  content: string;
}

interface RawLlmResponseMessage {
  type: 'raw_llm_response';
  content: string;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

interface ToolStartMessage {
  type: 'tool.start';
  data: {
    name: string;
    args: Record<string, unknown>;
  };
}

interface CloseMessage {
  type: 'close';
}

interface QuotaExceededMessage {
  type: 'quota_exceeded';
  message: string;
}

type AgentMessage =
  | ToolStreamMessage
  | AgentThoughtMessage
  | ToolCallMessage
  | ToolResultMessage
  | AgentResponseMessage
  | RawLlmResponseMessage
  | ErrorMessage
  | ToolStartMessage
  | CloseMessage
  | QuotaExceededMessage;

export const useAgentStream = () => {
  const {
    addDisplayItem,
    authToken,
    messageInputValue,
    sessionId,
    setIsProcessing,
    // jobId,
    setJobId,
    setMessageInputValue,
    setStreamCloseFunc,
    setAgentStatus,
    setToolStatus,
    addDebugLog,
    setAgentProgress,
  } = useStore();

  const startAgent = useCallback(async () => {
    if (!messageInputValue.trim()) return;

    setIsProcessing(true);
    addDisplayItem({ content: messageInputValue, sender: 'user', type: 'user_message', timestamp: new Date().toISOString() } as UserMessage);
    const goal = messageInputValue;
    setMessageInputValue('');

    const callbacks = {
      onClose: () => {
        setIsProcessing(false);
        setJobId(null);
        setStreamCloseFunc(null);
        setAgentStatus(null);
        setToolStatus('');
      },
      onError: (error: unknown) => { // Changed type to unknown
        addDisplayItem({
          content: `An error occurred: ${(error as Error).message}`,
          sender: 'assistant',
          type: 'agent_response',
          timestamp: new Date().toISOString(),
        } as DisplayableItem); // Added cast
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${(error as Error).message}`);
        setIsProcessing(false);
      },
      onMessage: (message: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent response: ${message}`);
        useStore.setState(produce(state => {
          const lastItem: DisplayableItem | undefined = state.displayItems[state.displayItems.length - 1]; // Changed type to DisplayableItem
          // S'assurer que le dernier item existe, est une réponse de l'agent et vient de l'assistant
          if (lastItem && lastItem.type === 'agent_response' && lastItem.sender === 'assistant') {
            // Mettre à jour le contenu du dernier item
            lastItem.content += message;
          } else {
            // Sinon, créer un nouvel item
            state.displayItems.push({ content: message, sender: 'assistant', type: 'agent_response', id: generateUUID(), timestamp: new Date().toISOString() } as DisplayableItem); // Added cast
          }
        }));
        setAgentProgress(Math.min(99, useStore.getState().agentProgress + 5));
      },
      onThought: (thought: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent thought: ${thought}`);
        addDisplayItem({ content: thought, type: 'agent_thought', timestamp: new Date().toISOString() } as DisplayableItem); // Added cast
      },
      onToolCall: (
        toolName: string,
        params: Record<string, unknown>,
      ) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool call: ${toolName} with params ${JSON.stringify(params)}`);
        setAgentStatus(`Executing tool: ${toolName}...`);
        addDisplayItem({ params, toolName, type: 'tool_call', timestamp: new Date().toISOString() } as DisplayableItem); // Added cast
      },
      onToolResult: (
        toolName: string,
        result: Record<string, unknown>,
      ) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool result for ${toolName}: ${JSON.stringify(result)}`);
        setAgentStatus(null);
        setToolStatus('');
        addDisplayItem({ result, toolName, type: 'tool_result', timestamp: new Date().toISOString() } as DisplayableItem); // Added cast
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data: AgentMessage = JSON.parse(event.data);
      if (data.type === 'tool_stream') {
          const { content } = data.data; // type est 'stdout' ou 'stderr'
          
          // Logique pour ajouter le contenu au dernier message
          const { displayItems } = useStore.getState();
          const lastItem: DisplayableItem | undefined = displayItems[displayItems.length - 1]; // Changed type to DisplayableItem

          // Crée ou met à jour un item de type "tool_result"
          if (lastItem && lastItem.type === 'tool_result' && lastItem.toolName === 'executeShellCommand') {
              useStore.setState(produce(state => {
                  const currentResult = (lastItem as AgentToolResult).result.output || '';
                  state.displayItems[state.displayItems.length - 1] = {
                      ...lastItem,
                      result: { output: currentResult + content },
                  } as DisplayableItem; // Added cast
              }));
          } else {
              // Si c'est le premier morceau, créez un nouvel item
              addDisplayItem({
                  toolName: 'executeShellCommand',
                  type: 'tool_result',
                  result: { output: content },
                  timestamp: new Date().toISOString(),
              } as DisplayableItem); // Added cast
          }

      } else if (data.type === 'agent_thought') { // This was changed from 'thought'
        callbacks.onThought(data.content);
      } else if (data.type === 'tool_call') {
        callbacks.onToolCall(data.toolName, data.params);
      } else if (data.type === 'tool_result') {
        if (data.toolName === 'finish') {
          // The backend sends the final response in the 'result' field
          // for the 'finish' tool. We need to extract it.
        } else {
          callbacks.onToolResult(data.toolName, data.result);
        }
      } else if (data.type === 'agent_response') {
        callbacks.onMessage(data.content);
      } else if (data.type === 'raw_llm_response') {
        addDebugLog(`[LLM_RAW] ${data.content}`);
      } else if (data.type === 'error') {
        callbacks.onError(new Error(data.message));
      } else if (data.type === 'quota_exceeded') {
        callbacks.onError(new Error(data.message));
      } else if (data.type === 'tool.start') {
        callbacks.onToolCall(data.data.name, data.data.args);
      } else if (data.type === 'close') {
        callbacks.onClose();
        setAgentProgress(100);
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
      // setStreamCloseFunc(() => close);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    authToken,
    sessionId,
    addDisplayItem,
    setIsProcessing,
    setJobId,
    setStreamCloseFunc,
    messageInputValue,
    setMessageInputValue,
    setAgentStatus,
    setToolStatus,
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
