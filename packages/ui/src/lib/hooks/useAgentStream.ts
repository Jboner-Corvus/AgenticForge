import { useCallback, useRef, useEffect } from 'react';
import { produce } from 'immer';
import { sendMessage, interrupt } from '../api';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { useCanvasStore } from '../../store/canvasStore'; // Import useCanvasStore
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
    | 'llm_error'
    | 'api_key_error'
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
    | 'cli_task_end'
    | 'chat_header_todo';
  content?: string;
  contentType?: 'html' | 'markdown' | 'url' | 'text';
  toolName?: string; // Added toolName here
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  message?: string;
  jobId?: string; // For CLI tasks
  data?: StreamMessageData;
}

// Define specific data structures for different message types
interface ToolStartData {
  name?: string;
  args?: Record<string, unknown>;
  content?: string;
  canvas?: {
    content: string;
    contentType: 'html' | 'markdown' | 'url' | 'text';
  };
}

interface BrowserData {
  url?: string;
  length?: number;
  message?: string;
}

interface TodoListData {
  type?: string;
  title?: string;
  timestamp?: number;
  todos?: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    category?: string;
  }>;
  stats?: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  };
}

// Union type for all possible data structures
type StreamMessageData = ToolStartData | BrowserData | TodoListData;

const isAgentToolResult = (message: ChatMessage | undefined): message is AgentToolResult => {
  return (
    message?.type === 'tool_result' &&
    typeof (message as AgentToolResult).result === 'object' &&
    (message as AgentToolResult).result !== null &&
    'output' in (message as AgentToolResult).result
  );
};

// Type guards for narrowing StreamMessageData union types
const isToolStartData = (data: StreamMessageData | undefined): data is ToolStartData => {
  if (!data) return false;
  return 'name' in data || 'args' in data || 'content' in data || 'canvas' in data;
};

const isBrowserData = (data: StreamMessageData | undefined): data is BrowserData => {
  if (!data) return false;
  return 'url' in data || 'length' in data || 'message' in data;
};

export const useAgentStream = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const responseCountRef = useRef<number>(0); // Compteur des réponses pour limiter à 5 étapes
  
  // 🚨 IMPORTANT: Obtenir le token d'authentification BACKEND (PAS un token LLM !)
  // Ce token sert à authentifier les requêtes vers l'API AgenticForge
  const backendAuthToken = useUIStore((state) => state.authToken);
  
  // Renommer pour plus de clarté - ce n'est PAS un token LLM
  const authToken = backendAuthToken;

  // Session store for messages
  const addMessage = useSessionStore((state) => state.addMessage);
  const sessionId = useSessionStore((state) => state.sessionId);
  const setSessionId = useSessionStore((state) => state.setSessionId);
  
  // UI store for other state
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const setJobId = useUIStore((state) => state.setJobId);
  const setMessageInputValue = useUIStore((state) => state.setMessageInputValue);
  const setAgentStatus = useUIStore((state) => state.setAgentStatus);
  const addDebugLog = useUIStore((state) => state.addDebugLog);
  const setAgentProgress = useUIStore((state) => state.setAgentProgress);
  const setBrowserStatus = useUIStore((state) => state.setBrowserStatus);
  const setActiveCliJobId = useUIStore((state) => state.setActiveCliJobId);
  const isProcessing = useUIStore((state) => state.isProcessing);
  const jobIdStore = useUIStore((state) => state.jobId);
  
  // Get addCanvasToHistory from canvas store
  const addCanvasToHistory = useCanvasStore((state) => state.addCanvasToHistory);

  const startAgent = useCallback(async (message: string) => {
    console.log('🔥🔥🔥 [DEBUG] startAgent called with message:', message);
    console.log('🔥🔥🔥 [DEBUG] authToken available:', !!authToken);
    console.log('🔥🔥🔥 [DEBUG] sessionId:', sessionId);
    console.log('🔥🔥🔥 [DEBUG] addMessage function:', typeof addMessage);
    console.log('🔐 [useAgentStream] authTokenFromStore:', backendAuthToken);
    console.log('🔐 [useAgentStream] authToken (final):', authToken);
    console.log('🔐 [useAgentStream] authToken type:', typeof authToken);
    console.log('🔐 [useAgentStream] authToken length:', authToken?.length);
    console.log('🔐 [useAgentStream] authToken first 30 chars:', authToken?.substring(0, 30));
    console.log('🆔 [useAgentStream] sessionId available:', !!sessionId);
    console.log('🆔 [useAgentStream] sessionId value:', sessionId);
    
    // 🚨 TOKEN BACKEND AUTHENTICATION LOGGING
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] 🔐 === ANALYSE TOKEN BACKEND ===`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] Backend Token: ${backendAuthToken ? `PRÉSENT (${backendAuthToken.substring(0, 30)}...)` : 'ABSENT'}`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] Final Auth Token: ${authToken ? `PRÉSENT (${authToken.substring(0, 30)}...)` : 'ABSENT'}`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] Token Length: ${authToken?.length || 0}`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] Session ID: ${sessionId}`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] IMPORTANT: Ceci est le token BACKEND, pas un token LLM !`);
    addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] === FIN ANALYSE TOKEN BACKEND ===`);
    
    if (!message.trim()) {
      console.warn('⚠️ [useAgentStream] Empty message, aborting');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [WARNING] Message vide, envoi annulé`);
      return;
    }

    if (!authToken) {
      console.error('❌ [useAgentStream] No backend authToken available');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Token d'authentification BACKEND manquant`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] IMPORTANT: Il faut un token AUTH_TOKEN pour accéder au backend AgenticForge`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Ce n'est PAS lié aux clés LLM - c'est pour l'authentification backend`);
      const errorMessage: NewChatMessage = {
        type: 'error',
        content: '🔐 ERREUR AUTHENTIFICATION BACKEND\n\nToken d\'authentification backend manquant (AUTH_TOKEN).\n\nℹ️ Ceci est différent des clés LLM - il s\'agit du token pour accéder au backend AgenticForge.\n\nVérifiez votre configuration AUTH_TOKEN.',
      };
      addMessage(errorMessage);
      return;
    }

    // Créer un sessionId si nécessaire
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      console.log('📝 [useAgentStream] Creating new sessionId');
      currentSessionId = crypto.randomUUID();
      setSessionId(currentSessionId);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Nouvelle session créée: ${currentSessionId}`);
    }

    console.log('🔥🔥🔥 [DEBUG] Starting agent process...');
    setIsProcessing(true);
    const userMessage: NewChatMessage = {
      type: 'user',
      content: message,
    };
    console.log('🔥🔥🔥 [DEBUG] About to call addMessage with:', userMessage);
    addMessage(userMessage);
    console.log('🔥🔥🔥 [DEBUG] addMessage called successfully');
    const goal = message;
    setMessageInputValue('');
    
    // Réinitialiser le compteur de réponses au début d'une nouvelle conversation
    responseCountRef.current = 0;
    
    addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🚀 Démarrage de l'agent avec le message: "${goal}"`);

    const handleClose = () => {
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] handleClose called. Current EventSource state: ${eventSourceRef.current?.readyState}`);
      
      setIsProcessing(false);
      setJobId(null);
      
      if (eventSourceRef.current) {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Closing EventSource connection`);
        eventSourceRef.current.close(); // Close the EventSource
        eventSourceRef.current = null;
      }
      
      setAgentStatus(null);
    };

    const handleError = (error: Error) => {
      console.error('❌ [useAgentStream] ERROR:', error);
      
      // Détecter les types d'erreurs spécifiques
      const errorMessage = error.message.toLowerCase();
      let chatMessage: NewChatMessage;
      
      if (errorMessage.includes('invalid_api_key') || errorMessage.includes('token expired') || errorMessage.includes('unauthorized')) {
        chatMessage = {
          type: 'error',
          content: `🔑 ERREUR CLÉ API: ${error.message}\n\n💡 Solution: Votre clé API est expirée ou invalide. Veuillez la renouveler dans le gestionnaire de clés LLM.`,
        };
        addDebugLog(`[${new Date().toLocaleTimeString()}] [API_KEY_ERROR] 🔑 ${error.message}`);
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('limit exceeded')) {
        chatMessage = {
          type: 'error',
          content: `📊 QUOTA DÉPASSÉ: ${error.message}\n\n💡 Solution: Attendez un moment ou changez de clé API.`,
        };
        addDebugLog(`[${new Date().toLocaleTimeString()}] [QUOTA_ERROR] 📊 ${error.message}`);
      } else if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        chatMessage = {
          type: 'error',
          content: `🌐 ERREUR RÉSEAU: ${error.message}\n\n💡 Solution: Vérifiez votre connexion internet et réessayez.`,
        };
        addDebugLog(`[${new Date().toLocaleTimeString()}] [NETWORK_ERROR] 🌐 ${error.message}`);
      } else {
        chatMessage = {
          type: 'error',
          content: `🚨 ERREUR AGENT: ${error.message}`,
        };
        addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] 🚨 ERREUR CRITIQUE: ${error.message}`);
      }
      
      addMessage(chatMessage);
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
      responseCountRef.current += 1;
      
      addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] Agent response (${responseCountRef.current}/5): ${content}`);
      
      const agentMessage: NewChatMessage = {
        type: 'agent_response',
        content,
      };
      addMessage(agentMessage);
      
      // Calculer le progrès basé sur le nombre d'étapes (20% par étape)
      const progressIncrement = Math.min(99, responseCountRef.current * 20);
      setAgentProgress(progressIncrement);
      
      // Arrêter après 5 étapes automatiquement
      if (responseCountRef.current >= 5) {
        addDebugLog(`[${new Date().toLocaleTimeString()}] [INFO] 🛑 Limite de 5 étapes atteinte - Arrêt automatique`);
        setTimeout(() => {
          handleClose();
          setAgentProgress(100);
          setIsProcessing(false);
          setAgentStatus(null);
        }, 1000);
      }
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
        
        // Détecter les erreurs d'API dans n'importe quel message
        const messageContent = data.content || data.message || JSON.stringify(data.result || {});
        if (messageContent && typeof messageContent === 'string') {
          const contentLower = messageContent.toLowerCase();
          if (contentLower.includes('invalid_api_key') || 
              contentLower.includes('invalid access token') || 
              contentLower.includes('token expired') ||
              contentLower.includes('unauthorized') ||
              contentLower.includes('authentication failed')) {
            console.warn('🔑 [useAgentStream] API key error detected in message content!');
            const apiErrorMessage: NewChatMessage = {
              type: 'error',
              content: `🔑 ERREUR CLÉ API DÉTECTÉE: ${messageContent}\n\n💡 Solution: Votre clé API semble expirée ou invalide. Veuillez la vérifier dans le gestionnaire de clés LLM.`,
            };
            addMessage(apiErrorMessage);
            addDebugLog(`[${new Date().toLocaleTimeString()}] [API_KEY_ERROR] 🔑 Erreur détectée: ${messageContent}`);
            setIsProcessing(false);
            return; // Ne pas traiter le message normalement
          }
        }

        switch (data.type) {
          case 'tool_stream':
            if (data.data && isToolStartData(data.data) && data.data.content) {
              useSessionStore.setState(produce((state: { messages: ChatMessage[] }) => {
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
                const streamToolName = data.toolName || (data.data as ToolStartData).name;
                const finalToolName = streamToolName || inferredToolName || 'unknown_tool';

                if (isAgentToolResult(lastMessage) && lastMessage.toolName === finalToolName) {
                  lastMessage.result.output += (data.data as ToolStartData).content ?? '';
                } else {
                  const newToolResult: ToolResultMessage = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'tool_result',
                    toolName: finalToolName,
                    result: { output: (data.data as ToolStartData).content ?? '' },
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
            if (data.data && isToolStartData(data.data)) {
              const toolName = (data.data as ToolStartData).name;
              const params = (data.data as ToolStartData).args;
              
              // Handle canvas output if present in tool args
              if (params && typeof params === 'object' && 'canvas' in params) {
                const canvas = params.canvas as { content: string; contentType: 'html' | 'markdown' | 'url' | 'text' };
                console.log('🎨 [useAgentStream] CANVAS OUTPUT received!');
                console.log('🎨 [useAgentStream] Canvas content type:', canvas.contentType);
                console.log('🎨 [useAgentStream] Canvas content length:', canvas.content.length);
                
                // Filter out agent thoughts from canvas content
                let shouldAddToCanvas = true;
                try {
                  const parsed = JSON.parse(canvas.content);
                  if (parsed.thought || parsed.command || parsed.interaction) {
                    console.warn('🚫 [useAgentStream] Filtered out agent thought/interaction from canvas in tool.start');
                    shouldAddToCanvas = false;
                  }
                } catch {
                  // Check for agent thought patterns in text content
                  if (canvas.content.includes('"thought"') || 
                      canvas.content.includes('thinking:') ||
                      canvas.content.includes('réflexion:') ||
                      (canvas.content.includes('{') && canvas.content.includes('"command"'))) {
                    console.warn('🚫 [useAgentStream] Filtered out agent thought/interaction from canvas in tool.start');
                    shouldAddToCanvas = false;
                  }
                }
                
                if (shouldAddToCanvas) {
                  addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas reçu ! Type: ${canvas.contentType}, Taille: ${canvas.content.length}`);
                
                  // Add canvas to history instead of just setting content
                  const canvasTitle = `Canvas ${new Date().toLocaleTimeString()}`;
                  addCanvasToHistory(canvasTitle, canvas.content, canvas.contentType);
                  
                  console.log('🎨 [useAgentStream] Canvas content updated in store!');
                  addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas mis à jour dans le store et rendu visible!`);
                } else {
                  // For agent thoughts/interactions, add them to chat instead of canvas
                  console.log('💭 [useAgentStream] Agent thought/interaction from tool.start redirected to chat');
                  addDebugLog(`[${new Date().toLocaleTimeString()}] [CHAT] 💭 Pensée/interaction agent de tool.start redirigée vers le chat`);
                  
                  const thoughtMessage: NewChatMessage = {
                    type: 'agent_thought',
                    content: canvas.content,
                  };
                  addMessage(thoughtMessage);
                }
              }
              
              if (toolName && params) {
                handleToolCall(toolName, params as Record<string, unknown>); // Cast params to correct type
              }
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
          case 'llm_error':
            if (data.message) {
              console.error('🚨 [useAgentStream] LLM ERROR:', data.message);
              const llmErrorMessage: NewChatMessage = {
                type: 'error',
                content: `🚨 ERREUR LLM: ${data.message}`,
              };
              addMessage(llmErrorMessage);
              addDebugLog(`[${new Date().toLocaleTimeString()}] [LLM_ERROR] 🚨 ${data.message}`);
              setIsProcessing(false);
            }
            break;
          case 'api_key_error':
            if (data.message) {
              console.error('🔑 [useAgentStream] API KEY ERROR:', data.message);
              const apiKeyErrorMessage: NewChatMessage = {
                type: 'error',
                content: `🔑 ERREUR CLÉ API: ${data.message}\n\n💡 Solution: Vérifiez vos clés API dans le gestionnaire de clés LLM.`,
              };
              addMessage(apiKeyErrorMessage);
              addDebugLog(`[${new Date().toLocaleTimeString()}] [API_KEY_ERROR] 🔑 ${data.message}`);
              setIsProcessing(false);
            }
            break;
          case 'quota_exceeded':
              if (data.message) handleError(new Error(data.message));
              break;
          case 'browser.navigating':
            if (data.data && isBrowserData(data.data)) {
              setBrowserStatus(`Navigating to ${(data.data as BrowserData).url}`);
            }
            break;
          case 'browser.page.created':
            setBrowserStatus('Page created');
            break;
          case 'browser.page.loaded':
            if (data.data && isBrowserData(data.data)) {
              setBrowserStatus(`Page loaded: ${(data.data as BrowserData).url}`);
            }
            break;
          case 'browser.content.extracted':
            if (data.data && isBrowserData(data.data)) {
              setBrowserStatus(`Content extracted: ${(data.data as BrowserData).length} bytes`);
            }
            break;
          case 'browser.error':
            if (data.data && isBrowserData(data.data)) {
              setBrowserStatus(`Error: ${(data.data as BrowserData).message}`);
            }
            break;
          case 'browser.closed':
            setBrowserStatus('Browser closed');
            break;
          case 'agent_canvas_output':
            if (data.content && data.contentType) {
              // Filter out debugging information and agent thoughts from canvas
              const filteredContent = data.content;
              let shouldDisplay = true;
              
              // Check if content contains debugging JSON with "thought" field or agent interactions
              try {
                const parsed = JSON.parse(data.content);
                if (parsed.thought || parsed.command || parsed.interaction) {
                  console.warn('🚫 [useAgentStream] Filtered out agent thought/interaction from canvas - keeping in chat only');
                  shouldDisplay = false;
                }
              } catch {
                // Not JSON, check for debugging patterns and agent thought patterns in text content
                if (data.content.includes('"thought"') || 
                    data.content.includes('```json') ||
                    data.content.includes('thinking:') ||
                    data.content.includes('réflexion:') ||
                    (data.content.includes('{') && data.content.includes('"command"'))) {
                  console.warn('🚫 [useAgentStream] Filtered out agent thought/interaction from canvas - keeping in chat only');
                  shouldDisplay = false;
                }
              }
              
              if (shouldDisplay) {
                // Only add to canvas if it's actual canvas content, not agent thoughts
                const canvasTitle = `Canvas ${new Date().toLocaleTimeString()}`;
                addCanvasToHistory(canvasTitle, filteredContent, data.contentType);
                
                console.log('🎨 [useAgentStream] Canvas updated from agent_canvas_output!');
                addDebugLog(`[${new Date().toLocaleTimeString()}] [CANVAS] 🎨 Canvas mis à jour! Type: ${data.contentType}, Taille: ${filteredContent.length}`);
                addDebugLog(`[DISPLAY_OUTPUT] Type: ${data.contentType}, Content length: ${filteredContent.length}`);
              } else {
                // For agent thoughts/interactions, add them to chat instead of canvas
                console.log('💭 [useAgentStream] Agent thought/interaction redirected to chat');
                addDebugLog(`[${new Date().toLocaleTimeString()}] [CHAT] 💭 Pensée/interaction agent redirigée vers le chat au lieu du canvas`);
                
                const thoughtMessage: NewChatMessage = {
                  type: 'agent_thought',
                  content: filteredContent,
                };
                addMessage(thoughtMessage);
              }
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
          case 'chat_header_todo':
            console.log('📝 [useAgentStream] CHAT_HEADER_TODO message received!');
            addDebugLog(`[${new Date().toLocaleTimeString()}] [TODO] 📝 Todo list received for chat header !`);
            // Forward the todo list data to chat header components via postMessage
            if (data.data) {
              window.postMessage({ type: 'chat_header_todo', data: data.data }, '*');
              console.log('📤 [useAgentStream] Todo list forwarded to chat header components');
            }
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
      
      // 🚨 BACKEND AUTH: Log exactly what we're sending to backend
      console.log('🚨 [BACKEND-AUTH] About to call sendMessage with:');
      console.log('🚨 [BACKEND-AUTH] goal:', goal);
      console.log('🚨 [BACKEND-AUTH] backend authToken:', authToken);
      console.log('🚨 [BACKEND-AUTH] sessionId:', sessionId);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] 🚨 ENVOI VERS BACKEND - Token: ${authToken?.substring(0, 30)}... Session: ${sessionId}`);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [BACKEND-AUTH] NOTE: Les clés LLM sont gérées séparément par le backend`);
      
      const { jobId, eventSource } = await sendMessage(
        goal,
        authToken,
        currentSessionId,
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
            if (isProcessing) {
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
    authToken, // Backend auth token (not LLM key!)
    backendAuthToken, // Same as authToken, for clarity
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
    isProcessing,
    setSessionId
  ]);

  const interruptAgent = useCallback(async () => {
    const jobId = jobIdStore;
    if (jobId && eventSourceRef.current) {
      await interrupt(jobId, authToken, sessionId || 'unknown');
      eventSourceRef.current.close(); // Close EventSource directly
      eventSourceRef.current = null;
      setIsProcessing(false);
      setJobId(null);
    }
  }, [setIsProcessing, setJobId, jobIdStore, authToken, sessionId]);

  // Cleanup effect pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log('🧹 [useAgentStream] Cleaning up EventSource on unmount');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Effect pour nettoyer les connexions en cas de changement de session
  useEffect(() => {
    const cleanup = () => {
      if (eventSourceRef.current && eventSourceRef.current.readyState !== 2) {
        console.log('🧹 [useAgentStream] Cleaning up active EventSource for session change');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsProcessing(false);
      }
    };

    // Cleanup si changement de session
    const currentSessionId = sessionId;
    return () => {
      if (currentSessionId !== sessionId) {
        cleanup();
      }
    };
  }, [sessionId, setIsProcessing]);

  return {
    startAgent,
    interruptAgent,
  };
};
