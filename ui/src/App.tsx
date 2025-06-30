
import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage, getTools, testServerHealth } from './lib/api';
import { addMessage, showTypingIndicator, hideTypingIndicator, updateTokenStatus, updateToolCount, addDebugLog } from './lib/ui-utils';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState(false);
  const [debugPanelVisible, setDebugPanelVisible] = useState(true);
  const [toolCreationEnabled, setToolCreationEnabled] = useState(true);
  const [codeExecutionEnabled, setCodeExecutionEnabled] = useState(true);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const authTokenInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLElement>(null);
  const sessionIdDisplayRef = useRef<HTMLSpanElement>(null);
  const toolCountRef = useRef<HTMLSpanElement>(null);
  const sessionStatusIndicatorRef = useRef<HTMLDivElement>(null);
  const sessionStatusTextRef = useRef<HTMLSpanElement>(null);
  const connectionHealthRef = useRef<HTMLSpanElement>(null);
  const debugLogContentRef = useRef<HTMLDivElement>(null);
  const bodyWrapperRef = useRef<HTMLDivElement>(null);
  const debugPanelRef = useRef<HTMLDivElement>(null);
  const tokenStatusIndicatorRef = useRef<HTMLDivElement>(null);
  const connectionStatusTextRef = useRef<HTMLSpanElement>(null);

  // Initialisation de la session et du token au chargement du composant
  useEffect(() => {
    addDebugLog('Interface initialisée (useEffect).', debugLogContentRef.current);
    initializeSession();
    initializeAuthToken();
    checkServerHealth();
    addMessage(
      '🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.',
      'assistant',
      messagesContainerRef.current
    );
  }, []);

  // Effet pour ajuster le layout en fonction du panneau de débogage
  useEffect(() => {
    const adjustLayout = () => {
      if (bodyWrapperRef.current && debugPanelRef.current) {
        const panelHeight = debugPanelRef.current.offsetHeight;
        bodyWrapperRef.current.style.paddingBottom = `${panelHeight}px`;
      }
    };

    adjustLayout();
    window.addEventListener('resize', adjustLayout);
    return () => window.removeEventListener('resize', adjustLayout);
  }, [debugPanelVisible]);

  // Mise à jour de l'UI globale
  useEffect(() => {
    const canInteract = !!authToken && !!sessionId && !isProcessing && serverHealthy;
    if (messageInputRef.current) {
      messageInputRef.current.disabled = !canInteract;
      if (isProcessing) {
        messageInputRef.current.placeholder = "🤔 L'agent réfléchit...";
      } else if (!serverHealthy) {
        messageInputRef.current.placeholder = '🏥 Serveur hors ligne...';
      } else if (!authToken) {
        messageInputRef.current.placeholder = '🔑 Veuillez sauvegarder un Bearer Token...';
      } else {
        messageInputRef.current.placeholder = '💬 Décrivez votre objectif...';
      }
    }
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    if (sendBtn) {
      sendBtn.disabled = !canInteract;
    }
  }, [authToken, sessionId, isProcessing, serverHealthy]);

  const initializeSession = useCallback(() => {
    let currentSessionId = localStorage.getItem('agenticForgeSessionId');
    if (!currentSessionId) {
      currentSessionId = generateUUID();
      localStorage.setItem('agenticForgeSessionId', currentSessionId);
      addDebugLog(`Nouvel ID de session généré: ${currentSessionId}`, debugLogContentRef.current);
    } else {
      addDebugLog(`ID de session récupéré: ${currentSessionId}`, debugLogContentRef.current);
    }
    setSessionId(currentSessionId);
    if (sessionIdDisplayRef.current) {
      sessionIdDisplayRef.current.textContent = `${currentSessionId.substring(0, 12)}...`;
    }
  }, []);

  const initializeAuthToken = useCallback(() => {
    const savedToken = localStorage.getItem('agenticForgeAuthToken');
    if (savedToken) {
      if (authTokenInputRef.current) {
        authTokenInputRef.current.value = savedToken;
      }
      setAuthToken(savedToken);
      addDebugLog('Token chargé depuis localStorage.', debugLogContentRef.current);
      updateTokenStatus(true, connectionStatusTextRef.current, tokenStatusIndicatorRef.current);
      fetchAndDisplayToolCount();
    } else {
      addDebugLog('Aucun token trouvé en local.', debugLogContentRef.current);
      updateTokenStatus(false, connectionStatusTextRef.current, tokenStatusIndicatorRef.current);
    }
  }, [fetchAndDisplayToolCount]);

  const handleSendMessage = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const goal = messageInputRef.current?.value.trim();
    if (!goal || isProcessing || !authToken || !sessionId) return;

    setIsProcessing(true);
    addMessage(goal, 'user', messagesContainerRef.current);
    if (messageInputRef.current) {
      messageInputRef.current.value = '';
      messageInputRef.current.style.height = 'auto'; // Reset height after sending
    }
    showTypingIndicator(messagesContainerRef.current);

    addDebugLog(`Envoi de l'objectif: "${goal}"`, debugLogContentRef.current, 'request');
    try {
      const result = await sendMessage(goal);
      addDebugLog(`Réponse API reçue: ${JSON.stringify(result)}`, debugLogContentRef.current, 'success');
      const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
      hideTypingIndicator();
      addMessage(responseText, 'assistant', messagesContainerRef.current);
      fetchAndDisplayToolCount();
    } catch (error: any) {
      addDebugLog(`Erreur API: ${error.message}`, debugLogContentRef.current, 'error');
      hideTypingIndicator();
      addMessage(`❌ **Erreur d'exécution :**\n${error.message}`, 'assistant', messagesContainerRef.current);
      updateSessionStatus('error');
    } finally {
      setIsProcessing(false);
      messageInputRef.current?.focus();
    }
  }, [isProcessing, authToken, sessionId, fetchAndDisplayToolCount]);

  const fetchAndDisplayToolCount = useCallback(async () => {
    if (!authToken || !sessionId) return;
    addDebugLog('Récupération de la liste des outils...', debugLogContentRef.current, 'request');
    try {
      const tools = await getTools();
      addDebugLog(`${tools.length} outils trouvés.`, debugLogContentRef.current, 'success');
      updateToolCount(tools.length, toolCountRef.current);
      updateSessionStatus('valid');
    } catch (error: any) {
      addDebugLog(`Erreur getTools: ${error.message}`, debugLogContentRef.current, 'error');
      updateToolCount('Erreur', toolCountRef.current);
      updateSessionStatus('error');
    }
  }, [authToken, sessionId]);

  const handleSaveToken = useCallback(() => {
    const tokenValue = authTokenInputRef.current?.value.trim() || '';
    setAuthToken(tokenValue);
    if (tokenValue) {
      localStorage.setItem('agenticForgeAuthToken', tokenValue);
      addMessage('🔑 Token sauvegardé.', 'assistant', messagesContainerRef.current);
      addDebugLog('Nouveau token sauvegardé.', debugLogContentRef.current);
      fetchAndDisplayToolCount();
    } else {
      localStorage.removeItem('agenticForgeAuthToken');
      addMessage('🗑️ Token supprimé.', 'assistant', messagesContainerRef.current);
      addDebugLog('Token supprimé.', debugLogContentRef.current);
      updateToolCount(0, toolCountRef.current);
    }
    updateTokenStatus(!!tokenValue, connectionStatusTextRef.current, tokenStatusIndicatorRef.current);
  }, [fetchAndDisplayToolCount]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    if (sessionIdDisplayRef.current) {
      sessionIdDisplayRef.current.textContent = `${newSessionId.substring(0, 12)}...`;
    }
    addMessage(`🔄 **Nouvelle Session Créée.**`, 'assistant', messagesContainerRef.current);
    addDebugLog(
      `Nouvelle session. Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`,
      debugLogContentRef.current
    );
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount]);

  const handleClearHistory = useCallback((showMessage: boolean) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.innerHTML = '';
    }
    if (showMessage) {
      addMessage('🗑️ Historique local effacé.', 'assistant', messagesContainerRef.current);
      addDebugLog('Historique local effacé.', debugLogContentRef.current);
    }
  }, []);

  const updateSessionStatus = useCallback((status: 'valid' | 'error' | 'unknown') => {
    if (sessionStatusIndicatorRef.current && sessionStatusTextRef.current) {
      const indicator = sessionStatusIndicatorRef.current;
      const text = sessionStatusTextRef.current;
      switch (status) {
        case 'valid':
          indicator.className = 'status-indicator-token valid';
          text.textContent = 'Session Active';
          break;
        case 'error':
          indicator.className = 'status-indicator-token';
          text.textContent = 'Session Erreur';
          break;
        default:
          indicator.className = 'status-indicator-token';
          text.textContent = 'Session Inconnue';
      }
    }
  }, []);

  const checkServerHealth = useCallback(async () => {
    addDebugLog('Vérification de la santé du serveur...', debugLogContentRef.current);
    try {
      const healthy = await testServerHealth();
      setServerHealthy(healthy);
      if (connectionHealthRef.current) {
        connectionHealthRef.current.textContent = healthy ? '✅ En ligne' : '❌ Hors ligne';
      }
      addDebugLog(
        `Statut du serveur: ${healthy ? 'En ligne' : 'Hors ligne'}`, 
        debugLogContentRef.current,
        healthy ? 'success' : 'error',
      );
    } catch (err: any) {
      setServerHealthy(false);
      if (connectionHealthRef.current) {
        connectionHealthRef.current.textContent = '❌ Hors ligne';
      }
      addDebugLog(
        `Échec de la vérification de la santé du serveur: ${err.message}`,
        debugLogContentRef.current,
        'error',
      );
    }
  }, []);

  const toggleDebugPanel = useCallback(() => {
    setDebugPanelVisible(prev => !prev);
  }, []);

  const clearDebugLog = useCallback(() => {
    if (debugLogContentRef.current) {
      debugLogContentRef.current.innerHTML = '';
    }
    addDebugLog('Journal de débogage vidé.', debugLogContentRef.current);
  }, []);

  const handleMessageInputChange = useCallback(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = messageInputRef.current.scrollHeight + 'px';
    }
  }, []);

  return (
    <div className="body-wrapper" ref={bodyWrapperRef}>
      <header className="header">
        <div className="logo">
          <div className="logo-icon">🐉</div>
          <h1 className="logo-text">Agentic Forge</h1>
        </div>

        <div className="status-bar">
          {/* Token Form */}
          <div id="token-form" className="token-controls">
            <label htmlFor="authToken" className="token-label">Auth Token:</label>
            <input type="password" id="authToken" className="token-input" placeholder="Collez votre Bearer Token ici" aria-label="Authentication Token Input" ref={authTokenInputRef} />
            <button type="button" id="saveTokenBtn" className="token-save-btn" aria-label="Save Token" onClick={handleSaveToken}>✅</button>
          </div>

          {/* Session Status */}
          <div className="status-item" id="sessionStatus" aria-live="polite">
            <div id="sessionStatusIndicator" className="status-indicator-token" ref={sessionStatusIndicatorRef}></div>
            <span id="sessionStatusText" ref={sessionStatusTextRef}>Session...</span>
          </div>

          {/* Connection Status */}
          <div className="status-item" id="connectionStatus" aria-live="polite">
            <div id="tokenStatusIndicator" className="status-indicator-token" ref={tokenStatusIndicatorRef}></div>
            <span id="connectionStatusText" ref={connectionStatusTextRef}>Token requis</span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Panneau de Contrôle</h2>
          </div>
          <section className="sidebar-content">
            <div className="control-panel" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              <h3 className="control-panel-title">Statut de l'Agent</h3>
              <div className="control-item">
                <span className="control-label">Session ID</span>
                <span id="sessionIdDisplay" className="status-value" ref={sessionIdDisplayRef}>--</span>
              </div>
              <div className="control-item">
                <span className="control-label">Outils Détectés</span>
                <span id="toolCount" className="status-value" ref={toolCountRef}>0</span>
              </div>
              <div className="control-item">
                <span className="control-label">Statut Connexion</span>
                <span id="connectionHealth" className="status-value" ref={connectionHealthRef}>--</span>
              </div>
            </div>
            
            <p className="sidebar-info">
              <strong>Mode Session Stricte:</strong> L'agent maintient un contexte de conversation persistant grâce à votre Session ID unique.
            </p>
            
            <div className="control-panel">
              <h3 className="control-panel-title">Capacités de l'Agent</h3>
              <div className="control-item">
                <label htmlFor="toolCreationToggle" className="control-label">Création d'outils</label>
                <label className="switch">
                  <input type="checkbox" id="toolCreationToggle" checked={toolCreationEnabled} onChange={(e) => setToolCreationEnabled(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="control-item">
                <label htmlFor="codeExecutionToggle" className="control-label">Exécution de code</label>
                <label className="switch">
                  <input type="checkbox" id="codeExecutionToggle" checked={codeExecutionEnabled} onChange={(e) => setCodeExecutionEnabled(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="control-panel">
              <h3 className="control-panel-title">Actions Rapides</h3>
              <div className="control-item">
                <button id="newSessionBtn" className="btn" style={{ width: '100%', margin: '5px 0' }} onClick={handleNewSession}>🔄 Nouvelle Session</button>
              </div>
              <div className="control-item">
                <button id="clearHistoryBtn" className="btn" style={{ width: '100%', margin: '5px 0', backgroundColor: '#e57373' }} onClick={() => handleClearHistory(true)}>🗑️ Vider l'Historique</button>
              </div>
            </div>
          </section>
        </aside>

        <main className="content-area">
          <div className="chat-container">
            <section className="messages-container" id="messagesContainer" aria-live="assertive" ref={messagesContainerRef}></section>
            <div className="input-area">
              <form id="chat-form" className="input-container" onSubmit={handleSendMessage}>
                <div className="input-actions">
                  <button type="button" className="btn-icon" id="attachFileBtn" aria-label="Attach file">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"></path></svg>
                  </button>
                </div>
                <div className="input-wrapper">
                  <textarea className="input-field" id="messageInput" placeholder="Session requise..." aria-label="Message input field" rows={1} ref={messageInputRef} onInput={handleMessageInputChange}></textarea>
                </div>
                <div className="input-actions">
                  <button type="submit" className="btn" id="sendBtn" aria-label="Send Message" disabled>
                    <span>Envoyer</span><span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      <div id="debug-panel" style={{ flexShrink: 0, background: '#111', borderTop: '2px solid #444', fontFamily: 'monospace', fontSize: '12px', zIndex: 100, display: debugPanelVisible ? 'flex' : 'none', flexDirection: 'column', maxHeight: '25vh', height: '150px' }} ref={debugPanelRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', background: '#222', flexShrink: 0 }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Journal de débogage du Frontend</h4>
            <div>
                <button id="clearDebugBtn" style={{ background: '#555', border: 'none', color: 'white', padding: '2px 8px', cursor: 'pointer', marginRight: '10px' }} onClick={clearDebugLog}>Vider</button>
                <button id="toggleDebugBtn" style={{ background: '#555', border: 'none', color: 'white', padding: '2px 8px', cursor: 'pointer' }} onClick={toggleDebugPanel}>{debugPanelVisible ? 'Cacher' : 'Afficher'}</button>
            </div>
        </div>
        <div id="debug-log-content" style={{ overflowY: 'auto', padding: '5px', flexGrow: 1 }} ref={debugLogContentRef}></div>
      </div>
    </div>
  );
}

export default App;


