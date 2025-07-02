

import { useCallback, useEffect, useRef, useState } from 'react';

import { getTools, sendMessage, testServerHealth } from './lib/api';
import { addDebugLog, addMessage, hideTypingIndicator, showTypingIndicator, updateTokenStatus, updateToolCount } from './lib/ui-utils';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<null | string>(null);
  const [authToken, setAuthToken] = useState<null | string>(null);
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

  const updateSessionStatus = useCallback((status: 'error' | 'unknown' | 'valid') => {
    if (sessionStatusIndicatorRef.current && sessionStatusTextRef.current) {
      const indicator = sessionStatusIndicatorRef.current;
      const text = sessionStatusTextRef.current;
      switch (status) {
        case 'error':
          indicator.className = 'status-indicator-token';
          text.textContent = 'Session Erreur';
          break;
        case 'valid':
          indicator.className = 'status-indicator-token valid';
          text.textContent = 'Session Active';
          break;
        default:
          indicator.className = 'status-indicator-token';
          text.textContent = 'Session Inconnue';
      }
    }
  }, []);

  const fetchAndDisplayToolCount = useCallback(async () => {
    if (!authToken || !sessionId) return;
    addDebugLog('Récupération de la liste des outils...', debugLogContentRef.current, 'request');
    try {
      const tools = await getTools() as any[];
      addDebugLog(`${tools.length} outils trouvés.`, debugLogContentRef.current, 'success');
      updateToolCount(tools.length, toolCountRef.current);
      updateSessionStatus('valid');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addDebugLog(`Erreur getTools: ${message}`, debugLogContentRef.current, 'error');
      updateToolCount('Erreur', toolCountRef.current);
      updateSessionStatus('error');
    }
  }, [authToken, sessionId, updateSessionStatus]);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setServerHealthy(false);
      if (connectionHealthRef.current) {
        connectionHealthRef.current.textContent = '❌ Hors ligne';
      }
      addDebugLog(
        `Échec de la vérification de la santé du serveur: ${message}`,
        debugLogContentRef.current,
        'error',
      );
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
  }, [checkServerHealth, initializeAuthToken, initializeSession]);

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
      const result = await sendMessage(goal) as { text: string };
      addDebugLog(`Réponse API reçue: ${JSON.stringify(result)}`, debugLogContentRef.current, 'success');
      const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
      hideTypingIndicator();
      addMessage(responseText, 'assistant', messagesContainerRef.current);
      fetchAndDisplayToolCount();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addDebugLog(`Erreur API: ${message}`, debugLogContentRef.current, 'error');
      hideTypingIndicator();
      addMessage(`❌ **Erreur d'exécution :**\n${message}`, 'assistant', messagesContainerRef.current);
      updateSessionStatus('error');
    } finally {
      setIsProcessing(false);
      messageInputRef.current?.focus();
    }
  }, [isProcessing, authToken, sessionId, fetchAndDisplayToolCount, updateSessionStatus]);

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

  const handleClearHistory = useCallback((showMessage: boolean) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.innerHTML = '';
    }
    if (showMessage) {
      addMessage('🗑️ Historique local effacé.', 'assistant', messagesContainerRef.current);
      addDebugLog('Historique local effacé.', debugLogContentRef.current);
    }
  }, []);

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
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory]);

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
          <div className="token-controls" id="token-form">
            <label className="token-label" htmlFor="authToken">Auth Token:</label>
            <input aria-label="Authentication Token Input" className="token-input" id="authToken" placeholder="Collez votre Bearer Token ici" ref={authTokenInputRef} type="password" />
            <button aria-label="Save Token" className="token-save-btn" id="saveTokenBtn" onClick={handleSaveToken} type="button">✅</button>
          </div>

          {/* Session Status */}
          <div aria-live="polite" className="status-item" id="sessionStatus">
            <div className="status-indicator-token" id="sessionStatusIndicator" ref={sessionStatusIndicatorRef}></div>
            <span id="sessionStatusText" ref={sessionStatusTextRef}>Session...</span>
          </div>

          {/* Connection Status */}
          <div aria-live="polite" className="status-item" id="connectionStatus">
            <div className="status-indicator-token" id="tokenStatusIndicator" ref={tokenStatusIndicatorRef}></div>
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
            <div className="control-panel" style={{ marginBottom: '1.5rem', marginTop: 0 }}>
              <h3 className="control-panel-title">Statut de l'Agent</h3>
              <div className="control-item">
                <span className="control-label">Session ID</span>
                <span className="status-value" id="sessionIdDisplay" ref={sessionIdDisplayRef}>--</span>
              </div>
              <div className="control-item">
                <span className="control-label">Outils Détectés</span>
                <span className="status-value" id="toolCount" ref={toolCountRef}>0</span>
              </div>
              <div className="control-item">
                <span className="control-label">Statut Connexion</span>
                <span className="status-value" id="connectionHealth" ref={connectionHealthRef}>--</span>
              </div>
            </div>
            
            <p className="sidebar-info">
              <strong>Mode Session Stricte:</strong> L'agent maintient un contexte de conversation persistant grâce à votre Session ID unique.
            </p>
            
            <div className="control-panel">
              <h3 className="control-panel-title">Capacités de l'Agent</h3>
              <div className="control-item">
                <label className="control-label" htmlFor="toolCreationToggle">Création d'outils</label>
                <label className="switch">
                  <input checked={toolCreationEnabled} id="toolCreationToggle" onChange={(e) => setToolCreationEnabled(e.target.checked)} type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="control-item">
                <label className="control-label" htmlFor="codeExecutionToggle">Exécution de code</label>
                <label className="switch">
                  <input checked={codeExecutionEnabled} id="codeExecutionToggle" onChange={(e) => setCodeExecutionEnabled(e.target.checked)} type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="control-panel">
              <h3 className="control-panel-title">Actions Rapides</h3>
              <div className="control-item">
                <button className="btn" id="newSessionBtn" onClick={handleNewSession} style={{ margin: '5px 0', width: '100%' }}>🔄 Nouvelle Session</button>
              </div>
              <div className="control-item">
                <button className="btn" id="clearHistoryBtn" onClick={() => handleClearHistory(true)} style={{ backgroundColor: '#e57373', margin: '5px 0', width: '100%' }}>🗑️ Vider l'Historique</button>
              </div>
            </div>
          </section>
        </aside>

        <main className="content-area">
          <div className="chat-container">
            <section aria-live="assertive" className="messages-container" id="messagesContainer" ref={messagesContainerRef}></section>
            <div className="input-area">
              <form className="input-container" id="chat-form" onSubmit={handleSendMessage}>
                <div className="input-actions">
                  <button aria-label="Attach file" className="btn-icon" id="attachFileBtn" type="button">
                    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"></path></svg>
                  </button>
                </div>
                <div className="input-wrapper">
                  <textarea aria-label="Message input field" className="input-field" id="messageInput" onInput={handleMessageInputChange} placeholder="Session requise..." ref={messageInputRef} rows={1}></textarea>
                </div>
                <div className="input-actions">
                  <button aria-label="Send Message" className="btn" disabled id="sendBtn" type="submit">
                    <span>Envoyer</span><span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      <div id="debug-panel" ref={debugPanelRef} style={{ background: '#111', borderTop: '2px solid #444', display: debugPanelVisible ? 'flex' : 'none', flexDirection: 'column', flexShrink: 0, fontFamily: 'monospace', fontSize: '12px', height: '150px', maxHeight: '25vh', zIndex: 100 }}>
        <div style={{ alignItems: 'center', background: '#222', display: 'flex', flexShrink: 0, justifyContent: 'space-between', padding: '5px' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Journal de débogage du Frontend</h4>
            <div>
                <button id="clearDebugBtn" onClick={clearDebugLog} style={{ background: '#555', border: 'none', color: 'white', cursor: 'pointer', marginRight: '10px', padding: '2px 8px' }}>Vider</button>
                <button id="toggleDebugBtn" onClick={toggleDebugPanel} style={{ background: '#555', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 8px' }}>{debugPanelVisible ? 'Cacher' : 'Afficher'}</button>
            </div>
        </div>
        <div id="debug-log-content" ref={debugLogContentRef} style={{ flexGrow: 1, overflowY: 'auto', padding: '5px' }}></div>
      </div>
    </div>
  );
}

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default App;
