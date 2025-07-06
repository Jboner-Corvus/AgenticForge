import { useCallback, useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { useAgentStream } from './lib/hooks/useAgentStream';
import { testServerHealth } from './lib/api';
import { ChatWindow } from './components/ChatWindow';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { ControlPanel } from './components/ControlPanel';
import { DebugPanel } from './components/DebugPanel';
import { Button } from './components/ui/button';

function App() {
  const {
    isProcessing,
    sessionId,
    authToken,
    serverHealthy,
    debugPanelVisible,
    toolCreationEnabled,
    codeExecutionEnabled,
    displayItems,
    debugLog,
    toolCount,
    sessionStatus,
    tokenStatus,
    messageInputValue,
    setSessionId,
    setAuthToken,
    setServerHealthy,
    setDebugPanelVisible,
    setToolCreationEnabled,
    setCodeExecutionEnabled,
    addDisplayItem,
    clearDisplayItems,
    addDebugLog,
    clearDebugLog,
    setToolCount,
    setTokenStatus,
    setMessageInputValue,
    fetchAndDisplayToolCount,
  } = useStore();

  const { startAgent } = useAgentStream();
  const [tokenInputValue, setTokenInputValue] = useState<string>('');

  const initializeSession = useCallback(() => {
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
      addDebugLog(`[${new Date().toLocaleTimeString()}] Nouvel ID de session généré: ${currentSessionId}`);
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] ID de session récupéré: ${currentSessionId}`);
    }
    setSessionId(currentSessionId);
  }, [addDebugLog, setSessionId]);

  const checkServerHealth = useCallback(async () => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] Vérification de la santé du serveur...`);
    try {
      const healthy = await testServerHealth();
      setServerHealthy(healthy);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [${healthy ? 'SUCCESS' : 'ERROR'}] Statut du serveur: ${healthy ? 'En ligne' : 'Hors ligne'}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [ERROR] Échec de la vérification de la santé du serveur: ${message}`);
    }
  }, [addDebugLog, setServerHealthy]);

  const initializeAuthToken = useCallback(() => {
    const savedToken = localStorage.getItem('agenticForgeAuthToken');
    if (savedToken) {
      setAuthToken(savedToken);
      addDebugLog(`[${new Date().toLocaleTimeString()}] Token chargé depuis localStorage.`);
      setTokenStatus(true);
      fetchAndDisplayToolCount();
    } else {
      addDebugLog(`[${new Date().toLocaleTimeString()}] Aucun token trouvé en local.`);
      setTokenStatus(false);
    }
  }, [addDebugLog, setAuthToken, setTokenStatus, fetchAndDisplayToolCount]);

  useEffect(() => {
    addDebugLog(`[${new Date().toLocaleTimeString()}] Interface initialisée (useEffect).`);
    initializeSession();
    initializeAuthToken();
    checkServerHealth();
    addDisplayItem({
      type: 'agent_response',
      content: '🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.',
      sender: 'assistant',
    });
  }, [checkServerHealth, initializeAuthToken, initializeSession, addDebugLog, addDisplayItem]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    startAgent();
  };

  const handleInterrupt = () => {
    // interruptAgent();
  };

  const handleSaveToken = useCallback(() => {
    const tokenValue = tokenInputValue.trim();
    setAuthToken(tokenValue);
    if (tokenValue) {
      localStorage.setItem('agenticForgeAuthToken', tokenValue);
      addDisplayItem({
        type: 'agent_response',
        content: '🔑 Token sauvegardé.',
        sender: 'assistant',
      });
      addDebugLog(`[${new Date().toLocaleTimeString()}] Nouveau token sauvegardé.`);
      fetchAndDisplayToolCount();
    } else {
      localStorage.removeItem('agenticForgeAuthToken');
      addDisplayItem({
        type: 'agent_response',
        content: '🗑️ Token supprimé.',
        sender: 'assistant',
      });
      addDebugLog(`[${new Date().toLocaleTimeString()}] Token supprimé.`);
      setToolCount(0);
    }
    setTokenStatus(!!tokenValue);
  }, [fetchAndDisplayToolCount, tokenInputValue, addDebugLog, addDisplayItem, setAuthToken, setToolCount, setTokenStatus]);

  const handleClearHistory = useCallback((showMessage: boolean) => {
    clearDisplayItems();
    if (showMessage) {
      addDisplayItem({
        type: 'agent_response',
        content: '🗑️ Historique local effacé.',
        sender: 'assistant',
      });
      addDebugLog(`[${new Date().toLocaleTimeString()}] Historique local effacé.`);
    }
  }, [clearDisplayItems, addDisplayItem, addDebugLog]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    addDisplayItem({
      type: 'agent_response',
      content: '🔄 **Nouvelle Session Créée.**',
      sender: 'assistant',
    });
    addDebugLog(`[${new Date().toLocaleTimeString()}] Nouvelle session. Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`);
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory, addDebugLog, addDisplayItem, setSessionId]);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelVisible(!debugPanelVisible);
  }, [debugPanelVisible, setDebugPanelVisible]);

  const clearDebugLogHandler = useCallback(() => {
    clearDebugLog();
    addDebugLog(`[${new Date().toLocaleTimeString()}] Journal de débogage vidé.`);
  }, [clearDebugLog, addDebugLog]);

  const handleMessageInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInputValue(event.target.value);
  }, [setMessageInputValue]);

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
          authToken={authToken}
        />

        <ChatWindow
          displayItems={displayItems}
          isProcessing={isProcessing}
          messageInputValue={messageInputValue}
          serverHealthy={serverHealthy}
          authToken={authToken}
          sessionId={sessionId}
          handleMessageInputChange={handleMessageInputChange}
          handleSendMessage={handleSendMessage}
          handleInterrupt={handleInterrupt}
        />
      </div>
      
      <DebugPanel
        debugPanelVisible={debugPanelVisible}
        debugLog={debugLog}
        toggleDebugPanel={toggleDebugPanel}
        clearDebugLog={clearDebugLogHandler}
      />
    </div>
  );
}

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default App;