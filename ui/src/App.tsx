

import { useCallback, useEffect, useState } from 'react';

import { getTools, sendMessage, testServerHealth } from './lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Textarea } from './components/ui/textarea';

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
      const tools = await getTools() as any[];
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
      const result = await sendMessage(goal) as { text: string };
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SUCCESS] Réponse API reçue: ${JSON.stringify(result)}`]);
      const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: responseText,
        sender: 'assistant',
      }]);
      fetchAndDisplayToolCount();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Erreur API: ${message}`]);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        text: `❌ **Erreur d'exécution :**\n${message}`,
        sender: 'assistant',
      }]);
      updateSessionStatus('error');
    } finally {
      setIsProcessing(false);
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
    event.target.style.height = 'auto';
    event.target.style.height = event.target.scrollHeight + 'px';
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
        <aside className="w-80 p-4 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
          <Card className="bg-gray-700 border-gray-600 text-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Panneau de Contrôle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-md font-medium text-gray-300">Statut de l'Agent</h3>
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Session ID</Label>
                  <span className="text-sm text-gray-400">{sessionId ? `${sessionId.substring(0, 12)}...` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Outils Détectés</Label>
                  <span className="text-sm text-gray-400">{toolCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Statut Connexion</Label>
                  <span className="text-sm text-gray-400">{serverHealthy ? '✅ En ligne' : '❌ Hors ligne'}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 italic">
                <strong>Mode Session Stricte:</strong> L'agent maintient un contexte de conversation persistant grâce à votre Session ID unique.
              </p>
              
              <div className="space-y-2">
                <h3 className="text-md font-medium text-gray-300">Capacités de l'Agent</h3>
                <div className="flex justify-between items-center">
                  <Label htmlFor="toolCreationToggle" className="text-sm">Création d'outils</Label>
                  <Switch checked={toolCreationEnabled} id="toolCreationToggle" onCheckedChange={setToolCreationEnabled} />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="codeExecutionToggle" className="text-sm">Exécution de code</Label>
                  <Switch checked={codeExecutionEnabled} id="codeExecutionToggle" onCheckedChange={setCodeExecutionEnabled} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-md font-medium text-gray-300">Actions Rapides</h3>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNewSession}>🔄 Nouvelle Session</Button>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleClearHistory(true)}>🗑️ Vider l'Historique</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 p-4 flex flex-col bg-gray-900">
          <Card className="flex-1 flex flex-col bg-gray-800 border-gray-700 text-gray-100">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              <section aria-live="assertive" className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                      <div className="message-content prose prose-invert">
                      {msg.sender === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        msg.text
                      )}
                    </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-100 p-3 rounded-lg typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </section>
            </CardContent>
            <div className="p-4 border-t border-gray-700">
              <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
                <Button aria-label="Attach file" type="button" variant="ghost" className="text-gray-400 hover:text-gray-100">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"></path></svg>
                </Button>
                <Textarea
                  aria-label="Message input field"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 resize-none"
                  id="messageInput"
                  onInput={handleMessageInputChange}
                  placeholder={
                    isProcessing
                      ? "🤔 L'agent réfléchit..."
                      : !serverHealthy
                      ? '🏥 Serveur hors ligne...'
                      : !authToken
                      ? '🔑 Veuillez sauvegarder un Bearer Token...'
                      : '💬 Décrivez votre objectif...'
                  }
                  value={messageInputValue}
                  rows={1}
                  disabled={!authToken || !sessionId || isProcessing || !serverHealthy}
                />
                <Button
                  aria-label="Send Message"
                  type="submit"
                  disabled={!authToken || !sessionId || isProcessing || !serverHealthy}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>Envoyer</span><span aria-hidden="true">→</span>
                </Button>
              </form>
            </div>
          </Card>
        </main>
      </div>
      
      <Card id="debug-panel" className="bg-gray-800 border-t border-gray-700 text-gray-100 flex flex-col flex-shrink-0 font-mono text-xs" style={{ height: debugPanelVisible ? '150px' : '0', maxHeight: '25vh', display: 'flex', transition: 'height 0.3s ease-in-out' }}>
        <CardHeader className="flex flex-row items-center justify-between p-2 border-b border-gray-700">
          <CardTitle className="text-sm font-semibold">Journal de débogage</CardTitle>
          <CardDescription className="text-xs text-gray-400">Frontend</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          <div id="debug-log-content" className="space-y-1">
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-2 border-t border-gray-700">
          <Button onClick={clearDebugLog} size="sm" variant="ghost" className="text-gray-400 hover:text-gray-100">Vider</Button>
          <Button onClick={toggleDebugPanel} size="sm" variant="ghost" className="text-gray-400 hover:text-gray-100">
            {debugPanelVisible ? 'Cacher' : 'Afficher'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default App;
