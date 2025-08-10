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
    sessionId,
    setIsProcessing,
    setJobId,
    setMessageInputValue,
    setAgentStatus,
    addDebugLog,
    setAgentProgress,
    setBrowserStatus,
    setActiveCliJobId,
    addCanvasToHistory,
  } = useStore();

  const startAgent = useCallback(async (message: string) => {
    console.log('🚀 [useAgentStream] startAgent called');
    console.log('📝 [useAgentStream] message:', message);
    console.log('🔐 [useAgentStream] authToken available:', !!authToken);
    console.log('🆔 [useAgentStream] sessionId available:', !!sessionId);
    
    if (!message.trim()) {
      console.warn('⚠️ [useAgentStream] Empty message, aborting');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [WARNING] Message vide, envoi annulé`);
      return;
    }

    if (!authToken) {
      console.error('❌ [useAgentStream] No authToken available');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Token d'authentification manquant`);
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: 'Token d\'authentification manquant. Veuillez vous reconnecter.',
      };
      addMessage(errorMessage);
      return;
    }

    if (!sessionId) {
      console.error('❌ [useAgentStream] No sessionId available');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] ID de session manquant`);
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: 'ID de session manquant. Veuillez recharger la page.',
      };
      addMessage(errorMessage);
      return;
    }

    console.log('✅ [useAgentStream] Starting agent process...');
    setIsProcessing(true);
    const userMessage: NewChatMessage = {
      type: 'user',
      content: message,
    };
    addMessage(userMessage);
    const goal = message;
    setMessageInputValue('');
    
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🚀 Démarrage de l'agent avec le message: "${goal}"`);

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
      console.error('❌ [useAgentStream] ERROR:', error);
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: `🚨 ERREUR AGENT: ${error.message}`,
      };
      addMessage(errorMessage);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] 🚨 ERREUR CRITIQUE: ${error.message}`);
      console.error('🔥 Agent stream error details:', {
        error,
        message: error.message,
        stack: error.stack,
        authToken: !!authToken,
        sessionId: !!sessionId,
        eventSourceState: eventSourceRef.current?.readyState,
      });
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
        console.log('📨 [useAgentStream] Raw SSE message received:', event.data);
        addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] 📨 Message SSE reçu: ${event.data}`);

        // Handle heartbeat messages
        if (event.data === 'heartbeat' || event.data.includes('heartbeat')) {
          console.log('💓 [useAgentStream] Heartbeat received');
          addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] 💓 Heartbeat reçu et ignoré`);
          return;
        }

        let data: StreamMessage;
        try {
          data = JSON.parse(event.data) as StreamMessage;
        } catch (parseError) {
          console.error('❌ [useAgentStream] Failed to parse SSE message:', parseError);
          console.error('❌ [useAgentStream] Raw data was:', event.data);
          addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] 🚨 Impossible de parser le message SSE: ${event.data}`);
          return;
        }

        console.log('📋 [useAgentStream] Parsed SSE message:', data);
        console.log(`🏷️ [useAgentStream] Message type: ${data.type}`);
        
        // Log all incoming messages for debugging
        addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] 🏷️ Type de message reçu: ${data.type}`);

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
            
            // Handle canvas output if present in tool args
            if (params && typeof params === 'object' && 'canvas' in params) {
              const canvas = params.canvas as { content: string; contentType: 'html' | 'markdown' | 'url' | 'text' };
              console.log('🎨 [useAgentStream] CANVAS OUTPUT received!');
              console.log('🎨 [useAgentStream] Canvas content type:', canvas.contentType);
              console.log('🎨 [useAgentStream] Canvas content length:', canvas.content.length);
              
              addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas reçu ! Type: ${canvas.contentType}, Taille: ${canvas.content.length}`);
              
              // Add canvas to history instead of just setting content
              const canvasTitle = `Canvas ${new Date().toLocaleTimeString()}`;
              addCanvasToHistory(canvasTitle, canvas.content, canvas.contentType);
              
              console.log('🎨 [useAgentStream] Canvas content updated in store!');
              addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas mis à jour dans le store et rendu visible!`);
              
              // Send canvas output message
              const canvasMessage: NewChatMessage = {
                type: 'agent_canvas_output',
                content: canvas.content,
                contentType: canvas.contentType,
              };
              addMessage(canvasMessage);
            }
            
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
            console.log('🤖 [useAgentStream] AGENT_RESPONSE received!');
            console.log('🤖 [useAgentStream] Content:', data.content);
            addDebugLog(`[${new Date().toLocaleTimeString()}] [STREAM] 🤖 RÉPONSE AGENT reçue !`);
            if (data.content) {
              console.log('✅ [useAgentStream] Processing agent response...');
              addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] 🎉 Traitement de la réponse agent: "${data.content.substring(0, 100)}..."`);
              handleMessage(data.content);
            } else {
              console.warn('⚠️ [useAgentStream] Agent response has no content!');
              addDebugLog(`[${new Date().toLocaleTimeString()}] [WARNING] 🚨 Réponse agent sans contenu !`);
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
              // Add canvas to history instead of just setting content
              const canvasTitle = `Canvas ${new Date().toLocaleTimeString()}`;
              addCanvasToHistory(canvasTitle, data.content, data.contentType);
              
              console.log('🎨 [useAgentStream] Canvas updated from agent_canvas_output!');
              addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas mis à jour! Type: ${data.contentType}, Taille: ${data.content.length}`);
              
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
      console.log('🔄 [useAgentStream] Calling sendMessage...');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🔄 Appel de sendMessage pour: ${goal}`);
      
      const { jobId, eventSource } = await sendMessage(
        goal,
        authToken,
        sessionId,
        onMessage,
        (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('🚨 [useAgentStream] EventSource error callback:', error);
          addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] 🚨 EventSource error callback: ${errorMessage}`);
          handleError(new Error(errorMessage));
        },
        addDebugLog // Pass the debug logger
      );
      
      console.log('✅ [useAgentStream] EventSource created successfully!');
      console.log('🆔 [useAgentStream] Job ID:', jobId);
      console.log('🌐 [useAgentStream] EventSource URL:', eventSource.url);
      console.log('📊 [useAgentStream] EventSource readyState:', eventSource.readyState);
      console.log('🎯 [useAgentStream] EventSource object:', eventSource);
      
      addDebugLog(`[${new Date().toLocaleTimeString()}] [SUCCESS] ✅ EventSource créé avec succès !`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🆔 Job ID: ${jobId}`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🌐 URL EventSource: ${eventSource.url}`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 📊 État initial EventSource: ${eventSource.readyState}`);
      
      setJobId(jobId);
      eventSourceRef.current = eventSource; // Store EventSource instance
      
      // Monitor EventSource state changes with more detailed logging
      const monitorInterval = setInterval(() => {
        if (eventSourceRef.current) {
          const state = eventSourceRef.current.readyState;
          const stateText = state === 0 ? 'CONNECTING' : state === 1 ? 'OPEN' : 'CLOSED';
          console.log(`📊 [useAgentStream] EventSource state check: ${state} (${stateText})`);
          addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 📊 État EventSource: ${state} (${stateText})`);
          
          if (state === 2) { // CLOSED
            console.warn('⚠️ [useAgentStream] EventSource closed unexpectedly!');
            addDebugLog(`[${new Date().toLocaleTimeString()}] [WARNING] ⚠️ EventSource fermé de manière inattendue !`);
            clearInterval(monitorInterval);
            
            // Attempt to reconnect if we're still processing
            if (useStore.getState().isProcessing) {
              console.log('🔄 [useAgentStream] Attempting to reconnect...');
              addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🔄 Tentative de reconnexion...`);
              setTimeout(() => startAgent('Reconnection attempt'), 3000);
            }
          }
        } else {
          console.warn('⚠️ [useAgentStream] EventSource reference lost!');
          clearInterval(monitorInterval);
        }
      }, 2000);
      
      // Clear monitoring after 30 seconds
      setTimeout(() => {
        clearInterval(monitorInterval);
        console.log('🔄 [useAgentStream] Stopped monitoring EventSource state');
      }, 30000);
      
    } catch (error) {
      console.error('🚨 [useAgentStream] CRITICAL ERROR during sendMessage:', error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] 🚨 ERREUR CRITIQUE lors de sendMessage: ${error instanceof Error ? error.message : String(error)}`);
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    addCanvasToHistory,
    authToken,
    sessionId,
    addMessage,
    setIsProcessing,
    setJobId,
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
