import { useCallback } from 'react';
import { useStore } from '../store';
import { sendMessage } from '../api';

export const useAgentStream = () => {
  const {
    authToken,
    sessionId,
    // jobId,
    setJobId,
    setStreamCloseFunc,
    setIsProcessing,
    addDisplayItem,
    setMessageInputValue,
    messageInputValue,
  } = useStore();

  const startAgent = useCallback(async () => {
    if (!messageInputValue.trim()) return;

    setIsProcessing(true);
    addDisplayItem({ type: 'agent_response', content: messageInputValue, sender: 'user' });
    const goal = messageInputValue;
    setMessageInputValue('');

    const callbacks = {
      onThought: (thought: string) => {
        addDisplayItem({ type: 'agent_thought', content: thought });
      },
      onToolCall: (toolName: string, params: any) => {
        addDisplayItem({ type: 'tool_call', toolName, params });
      },
      onToolResult: (toolName: string, result: any) => {
        addDisplayItem({ type: 'tool_result', toolName, result });
      },
      onMessage: (message: string) => {
        addDisplayItem({ type: 'agent_response', content: message, sender: 'assistant' });
      },
      onError: (error: Error) => {
        addDisplayItem({ type: 'agent_response', content: `An error occurred: ${error.message}`, sender: 'assistant' });
        setIsProcessing(false);
      },
      onClose: () => {
        setIsProcessing(false);
        setJobId(null);
        setStreamCloseFunc(null);
      },
    };

    const onMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'thought') {
        callbacks.onThought(data.content);
      } else if (data.type === 'tool_call') {
        callbacks.onToolCall(data.toolName, data.params);
      } else if (data.type === 'tool_result') {
        callbacks.onToolResult(data.toolName, data.result);
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

  // const interruptAgent = useCallback(async () => {
  //   const { streamCloseFunc } = useStore.getState();
  //   if (jobId && streamCloseFunc) {
  //     await interrupt(jobId, authToken, sessionId);
  //     streamCloseFunc();
  //     setIsProcessing(false);
  //     setJobId(null);
  //     setStreamCloseFunc(null);
  //   }
  // }, [authToken, sessionId, jobId, setIsProcessing, setJobId, setStreamCloseFunc]);

  return {
    startAgent,
    // interruptAgent,
  };
};
