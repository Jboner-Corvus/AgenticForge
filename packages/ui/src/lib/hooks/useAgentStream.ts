import { useCallback } from 'react';

import { sendMessage, interrupt } from '../api';
import { useStore } from '../store';

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
    addDebugLog, // <-- 1. AJOUTEZ CECI
  } = useStore();

  const startAgent = useCallback(async () => {
    if (!messageInputValue.trim()) return;

    setIsProcessing(true);
    addDisplayItem({ content: messageInputValue, sender: 'user', type: 'agent_response' });
    const goal = messageInputValue;
    setMessageInputValue('');

    const callbacks = {
      onClose: () => {
        setIsProcessing(false);
        setJobId(null);
        setStreamCloseFunc(null);
      },
      onError: (error: Error) => {
        addDisplayItem({
          content: `An error occurred: ${error.message}`,
          sender: 'assistant',
          type: 'agent_response',
        });
        setIsProcessing(false);
      },
      onMessage: (message: string) => {
        const { displayItems } = useStore.getState();
        const lastItem = displayItems[displayItems.length - 1];
        if (
          lastItem &&
          lastItem.type === 'agent_response' &&
          lastItem.sender === 'assistant'
        ) {
          // Mettre à jour le dernier message au lieu d'en ajouter un nouveau
          const newDisplayItems = [...displayItems];
          newDisplayItems[displayItems.length - 1] = {
            ...lastItem,
            content: lastItem.content + message,
          };
          useStore.setState({ displayItems: newDisplayItems });
        } else {
          addDisplayItem({
            content: message,
            sender: 'assistant',
            type: 'agent_response',
          });
        }
      },
      onThought: (thought: string) => {
        addDisplayItem({ content: thought, type: 'agent_thought' });
      },
      onToolCall: (
        toolName: string,
        params: Record<string, unknown>,
      ) => {
        addDisplayItem({ params, toolName, type: 'tool_call' });
      },
      onToolResult: (
        toolName: string,
        result: Record<string, unknown>,
      ) => {
        addDisplayItem({ result, toolName, type: 'tool_result' });
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent_thought') { // This was changed from 'thought'
        callbacks.onThought(data.content);
      } else if (data.type === 'tool_call') {
        callbacks.onToolCall(data.toolName, data.params);
      } else if (data.type === 'tool_result') {
        if (data.toolName === 'finish') {
          // The backend sends the final response in the 'result' field
          // for the 'finish' tool. We need to extract it.
          const finalResponse = (data.result as string);
          if (finalResponse) {
             callbacks.onMessage(finalResponse);
          }
        } else {
          callbacks.onToolResult(data.toolName, data.result);
        }
      } else if (data.type === 'agent_response') {
        callbacks.onMessage(data.content);
      } else if (data.type === 'raw_llm_response') {
        addDebugLog(`[LLM_RAW] ${data.content}`);
      } else if (data.type === 'error') {
        callbacks.onError(new Error(data.message));
      } else if (data.type === 'close') {
        callbacks.onClose();
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
    addDebugLog, // <-- 2. AJOUTEZ CECI AUX DÉPENDANCES
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
