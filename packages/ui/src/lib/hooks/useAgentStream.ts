import { useCallback } from 'react';

import { produce } from 'immer';

import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';
import { generateUUID } from '../utils/uuid';

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
    addDisplayItem({ content: messageInputValue, sender: 'user', type: 'agent_response', timestamp: new Date().toISOString() });
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
      onError: (error: Error) => {
        addDisplayItem({
          content: `An error occurred: ${error.message}`,
          sender: 'assistant',
          type: 'agent_response',
          timestamp: new Date().toISOString(),
        });
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ${error.message}`);
        setIsProcessing(false);
      },
      onMessage: (message: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent response: ${message}`);
        useStore.setState(produce(state => {
          const lastItem = state.displayItems[state.displayItems.length - 1];
          // S'assurer que le dernier item existe, est une réponse de l'agent et vient de l'assistant
          if (lastItem && lastItem.type === 'agent_response' && lastItem.sender === 'assistant') {
            // Mettre à jour le contenu du dernier item
            lastItem.content += message;
          } else {
            // Sinon, créer un nouvel item
            state.displayItems.push({ content: message, sender: 'assistant', type: 'agent_response', id: generateUUID(), timestamp: new Date().toISOString() });
          }
        }));
        setAgentProgress(Math.min(99, useStore.getState().agentProgress + 5));
      },
      onThought: (thought: string) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent thought: ${thought}`);
        addDisplayItem({ content: thought, type: 'agent_thought', timestamp: new Date().toISOString() });
      },
      onToolCall: (
        toolName: string,
        params: Record<string, unknown>,
      ) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool call: ${toolName} with params ${JSON.stringify(params)}`);
        setAgentStatus(`Executing tool: ${toolName}...`);
        addDisplayItem({ params, toolName, type: 'tool_call', timestamp: new Date().toISOString() });
      },
      onToolResult: (
        toolName: string,
        result: Record<string, unknown>,
      ) => {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Tool result for ${toolName}: ${JSON.stringify(result)}`);
        setAgentStatus(null);
        setToolStatus('');
        addDisplayItem({ result, toolName, type: 'tool_result', timestamp: new Date().toISOString() });
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'tool_stream') {
          const { content } = data.data; // type est 'stdout' ou 'stderr'
          
          // Logique pour ajouter le contenu au dernier message
          const { displayItems } = useStore.getState();
          const lastItem = displayItems[displayItems.length - 1];

          // Crée ou met à jour un item de type "tool_result"
          if (lastItem && lastItem.type === 'tool_result' && lastItem.toolName === 'executeShellCommand') {
              useStore.setState(produce(state => {
                  const currentResult = (lastItem.result as { output: string }).output || '';
                  state.displayItems[state.displayItems.length - 1] = {
                      ...lastItem,
                      result: { output: currentResult + content },
                  };
              }));
          } else {
              // Si c'est le premier morceau, créez un nouvel item
              addDisplayItem({
                  toolName: 'executeShellCommand',
                  type: 'tool_result',
                  result: { output: content },
                  timestamp: new Date().toISOString(),
              });
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
        (error) => callbacks.onError(error as unknown as Error),
      );
      setJobId(jobId);
      // setStreamCloseFunc(() => close);
    } catch (error) {
      callbacks.onError(error as Error);
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
