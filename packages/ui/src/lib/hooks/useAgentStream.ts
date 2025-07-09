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
        addDisplayItem({ content: `An error occurred: ${error.message}`, sender: 'assistant', type: 'agent_response' });
        setIsProcessing(false);
      },
      onMessage: (message: string) => {
        addDisplayItem({ content: message, sender: 'assistant', type: 'agent_response' });
      },
      onThought: (thought: string) => {
        addDisplayItem({ content: thought, type: 'agent_thought' });
      },
      onToolCall: (toolName: string, params: Record<string, unknown>) => {
        addDisplayItem({ params, toolName, type: 'tool_call' });
      },
      onToolResult: (toolName: string, result: Record<string, unknown>) => {
        addDisplayItem({ result, toolName, type: 'tool_result' });
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'thought') {
        callbacks.onThought(data.content);
      } else if (data.type === 'tool_call') {
        callbacks.onToolCall(data.toolName, data.params);
      } else if (data.type === 'tool_result') {
        if (data.toolName === 'finish') {
          callbacks.onMessage(data.result.response);
        } else {
          callbacks.onToolResult(data.toolName, data.result);
        }
      } else if (data.type === 'agent_response') {
        callbacks.onMessage(data.content);
      } else if (data.type === 'error') {
        callbacks.onError(new Error(data.message));
      } else if (data.type === 'close') {
        callbacks.onClose();
      }
    };

    try {
      const jobId = await sendMessage(goal, authToken, sessionId, onMessage);
      setJobId(jobId);
      // setStreamCloseFunc(() => close);
    } catch (error) {
      callbacks.onError(error as Error);
    }
  }, [authToken, sessionId, addDisplayItem, setIsProcessing, setJobId, setStreamCloseFunc, messageInputValue, setMessageInputValue]);

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
