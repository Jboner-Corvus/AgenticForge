

import { useCallback, useEffect, useState } from 'react';

import { getTools, sendMessage, testServerHealth } from './lib/api';
import { ChatWindow } from './components/ChatWindow';

import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { ControlPanel } from './components/ControlPanel';
import { DebugPanel } from './components/DebugPanel';
import { Button } from './components/ui/button';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<null | string>(null);
  const [authToken, setAuthToken] = useState<null | string>(null);
  const [serverHealthy, setServerHealthy] = useState(false);
  const [debugPanelVisible, setDebugPanelVisible] = useState(true);
  const [toolCreationEnabled, setToolCreationEnabled] = useState(true);
  const [codeExecutionEnabled, setCodeExecutionEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [toolCount, setToolCount] = useState<number | string>(0);
  const [sessionStatus, setSessionStatus] = useState<'error' | 'unknown' | 'valid'>('unknown');
  const [tokenStatus, setTokenStatus] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState('');

  const updateSessionStatus = useCallback((status: 'error' | 'unknown' | 'valid') => {
    setSessionStatus(status);
  }, []);

  const fetchAndDisplayToolCount = useCallback(async () => {
    if (!authToken || !sessionId) return;
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [REQUEST] Récupération de la liste des outils...`]);
    try {
      const tools = await getTools(authToken, sessionId) as any[];
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SUCCESS] ${tools.length} outils trouvés.`]);
      setToolCount(tools.length);
      updateSessionStatus('valid');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Erreur getTools: ${message}`]);
      setToolCount('Erreur');
      updateSessionStatus('error');
    }
  }, [authToken, sessionId, updateSessionStatus]);

  const initializeSession = useCallback(() => {
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Nouvel ID de session généré: ${currentSessionId}`]);
    } else {
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ID de session récupéré: ${currentSessionId}`]);
    }
    setSessionId(currentSessionId);
  }, []);

  const checkServerHealth = useCallback(async () => {
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Vérification de la santé du serveur...`]);
    try {
      const healthy = await testServerHealth();
      setServerHealthy(healthy);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [${healthy ? 'SUCCESS' : 'ERROR'}] Statut du serveur: ${healthy ? 'En ligne' : 'Hors ligne'}`]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Échec de la vérification de la santé du serveur: ${message}`]);
    }
  }, []);

  const initializeAuthToken = useCallback(() => {
    const savedToken = localStorage.getItem('agenticForgeAuthToken');
    if (savedToken) {
      setAuthToken(savedToken);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Token chargé depuis localStorage.`]);
      setTokenStatus(true);
      fetchAndDisplayToolCount();
    } else {
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Aucun token trouvé en local.`]);
      setTokenStatus(false);
    }
  }, [fetchAndDisplayToolCount]);

  // Initialisation de la session et du token au chargement du composant
  useEffect(() => {
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Interface initialisée (useEffect).`]);
    initializeSession();
    initializeAuthToken();
    checkServerHealth();
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text: '🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.',
      sender: 'assistant',
    }]);
  }, [checkServerHealth, initializeAuthToken, initializeSession]);

  

  const handleSendMessage = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const goal = messageInputValue.trim();
    if (!goal || isProcessing || !authToken || !sessionId) return;

    setIsProcessing(true);
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text: goal,
      sender: 'user',
    }]);
    setMessageInputValue('');

    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [REQUEST] Envoi de l'objectif: "${goal}"`]);
    try {
      const jobId = await sendMessage(goal, authToken, sessionId, (event) => {
        const data = JSON.parse(event.data);
        setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SSE] Type: ${data.type}, Content: ${JSON.stringify(data.content)}`]);

        if (data.type === 'agent_thought') {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            text: `_Agent pense :_ ${data.content}`,
            sender: 'assistant',
          }]);
        } else if (data.type === 'tool_call') {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            text: `_Exécution de l'outil :_ **${data.content.toolName}** avec params: ${JSON.stringify(data.content.toolParams)}`,
            sender: 'assistant',
          }]);
        } else if (data.type === 'tool_result') {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            text: `_Résultat de l'outil :_ ${JSON.stringify(data.content)}`,
            sender: 'assistant',
          }]);
        } else if (data.type === 'agent_response') {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            text: data.content,
            sender: 'assistant',
          }]);
          setIsProcessing(false);
          fetchAndDisplayToolCount();
        } else if (data.type === 'job_completed' || data.type === 'job_failed') {
          setIsProcessing(false);
          fetchAndDisplayToolCount();
        }
      });
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SUCCESS] Job ID: ${jobId}. Démarrage du streaming SSE.`]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Erreur API ou SSE: ${message}`]);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: `❌ **Erreur d'exécution :**\n${message}`,
        sender: 'assistant',
      }]);
      updateSessionStatus('error');
      setIsProcessing(false);
    } finally {
      // The finally block might not be reached immediately due to SSE, 
      // so setIsProcessing(false) is handled in the SSE 'agent_response' or 'job_completed' event.
    }
  }, [isProcessing, authToken, sessionId, fetchAndDisplayToolCount, updateSessionStatus, messageInputValue]);

  const [tokenInputValue, setTokenInputValue] = useState<string>('');

  const handleSaveToken = useCallback(() => {
    const tokenValue = tokenInputValue.trim();
    setAuthToken(tokenValue);
    if (tokenValue) {
      localStorage.setItem('agenticForgeAuthToken', tokenValue);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: '🔑 Token sauvegardé.',
        sender: 'assistant',
      }]);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Nouveau token sauvegardé.`]);
      fetchAndDisplayToolCount();
    } else {
      localStorage.removeItem('agenticForgeAuthToken');
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: '🗑️ Token supprimé.',
        sender: 'assistant',
      }]);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Token supprimé.`]);
      setToolCount(0);
    }
    setTokenStatus(!!tokenValue);
  }, [fetchAndDisplayToolCount, tokenInputValue]);

  const handleClearHistory = useCallback((showMessage: boolean) => {
    setMessages([]);
    if (showMessage) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: '🗑️ Historique local effacé.',
        sender: 'assistant',
      }]);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Historique local effacé.`]);
    }
  }, []);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text: '🔄 **Nouvelle Session Créée.**',
      sender: 'assistant',
    }]);
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Nouvelle session. Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`]);
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory]);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelVisible(prev => !prev);
  }, []);

  const clearDebugLog = useCallback(() => {
    setDebugLog([`[${new Date().toLocaleTimeString()}] Journal de débogage vidé.`]);
  }, []);

  

  

  const handleMessageInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInputValue(event.target.value);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🐉</div>
          <h1 className="text-xl font-bold">Agentic Forge</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Token Form */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="authToken" className="text-sm">Auth Token:</Label>
            <Input
              aria-label="Authentication Token Input"
              id="authToken"
              placeholder="Collez votre Bearer Token ici"
              type="password"
              value={tokenInputValue}
              onChange={(e) => setTokenInputValue(e.target.value)}
              className="w-64 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
            />
            <Button aria-label="Save Token" onClick={handleSaveToken} type="button" className="bg-green-600 hover:bg-green-700 text-white">✅</Button>
          </div>

          {/* Session Status */}
          <Badge variant={sessionStatus === 'valid' ? 'default' : 'destructive'}>
            {sessionStatus === 'error' ? 'Session Erreur' : sessionStatus === 'valid' ? 'Session Active' : 'Session Inconnue'}
          </Badge>

          {/* Connection Status */}
          <Badge variant={tokenStatus ? 'default' : 'destructive'}>
            {tokenStatus ? 'Token Valide' : 'Token requis'}
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ControlPanel
          sessionId={sessionId}
          toolCount={toolCount}
          serverHealthy={serverHealthy}
          toolCreationEnabled={toolCreationEnabled}
          codeExecutionEnabled={codeExecutionEnabled}
          setToolCreationEnabled={setToolCreationEnabled}
          setCodeExecutionEnabled={setCodeExecutionEnabled}
          handleNewSession={handleNewSession}
          handleClearHistory={handleClearHistory}
        />

        <ChatWindow
          messages={messages}
          isProcessing={isProcessing}
          messageInputValue={messageInputValue}
          serverHealthy={serverHealthy}
          authToken={authToken}
          sessionId={sessionId}
          handleMessageInputChange={handleMessageInputChange}
          handleSendMessage={handleSendMessage}
        />
      </div>
      
      <DebugPanel
        debugPanelVisible={debugPanelVisible}
        debugLog={debugLog}
        toggleDebugPanel={toggleDebugPanel}
        clearDebugLog={clearDebugLog}
      />
    </div>
  );
}

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default App;
