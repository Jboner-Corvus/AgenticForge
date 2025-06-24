// public/js/main.js (Version finale avec gestion du layout et du débogage)

import { sendGoal, getTools, testServerHealth } from './api.js';
import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  updateTokenStatus,
  updateToolCount,
  addDebugLog,
} from './ui.js';

function generateUUID() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const state = {
  isProcessing: false,
  sessionId: null,
  authToken: null,
  serverHealthy: false,
};

const elements = {
  // Récupération de tous les éléments du DOM
  bodyWrapper: document.querySelector('.body-wrapper'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  chatForm: document.getElementById('chat-form'),
  authTokenInput: document.getElementById('authToken'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  messagesContainer: document.getElementById('messagesContainer'),
  toolCountDisplay: document.getElementById('toolCount'),
  sessionStatusIndicator: document.getElementById('sessionStatusIndicator'),
  sessionStatusText: document.getElementById('sessionStatusText'),
  sessionIdDisplay: document.getElementById('sessionIdDisplay'),
  connectionHealth: document.getElementById('connectionHealth'),
  newSessionBtn: document.getElementById('newSessionBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  debugPanel: document.getElementById('debug-panel'),
  clearDebugBtn: document.getElementById('clearDebugBtn'),
  toggleDebugBtn: document.getElementById('toggleDebugBtn'),
  debugLogContent: document.getElementById('debug-log-content'),
};

// --- GESTION DU LAYOUT ---
function adjustLayout() {
    if (!elements.bodyWrapper || !elements.debugPanel) return;
    const panelHeight = elements.debugPanel.offsetHeight;
    elements.bodyWrapper.style.paddingBottom = `${panelHeight}px`;
    elements.debugPanel.style.position = 'fixed';
    elements.debugPanel.style.bottom = '0';
    elements.debugPanel.style.left = '0';
    elements.debugPanel.style.width = '100%';
}

document.addEventListener('DOMContentLoaded', () => {
  addDebugLog('Interface initialisée (DOMContentLoaded).');
  initializeSession();
  initializeAuthToken();
  setupEventListeners();
  updateAllUI();
  checkServerHealth();
  addMessage('🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.', 'assistant');
  
  adjustLayout();
  window.addEventListener('resize', adjustLayout);
});

function setupEventListeners() {
    elements.chatForm.addEventListener('submit', handleSendMessage);
    elements.saveTokenBtn.addEventListener('click', handleSaveToken);
    elements.newSessionBtn.addEventListener('click', handleNewSession);
    elements.clearHistoryBtn.addEventListener('click', () => handleClearHistory(true));

    elements.clearDebugBtn.addEventListener('click', () => {
        if(elements.debugLogContent) elements.debugLogContent.innerHTML = '';
        addDebugLog('Journal de débogage vidé.');
    });

    elements.toggleDebugBtn.addEventListener('click', () => {
        const isHidden = elements.debugPanel.style.display === 'none';
        if (isHidden) {
            elements.debugPanel.style.display = 'flex';
            elements.toggleDebugBtn.textContent = 'Cacher';
        } else {
            elements.debugPanel.style.display = 'none';
            elements.toggleDebugBtn.textContent = 'Afficher';
        }
        // Force un ajustement de la marge à 0 quand le panneau est caché
        elements.bodyWrapper.style.paddingBottom = isHidden ? `${elements.debugPanel.offsetHeight}px` : '0px';
    });
}

// Le reste des fonctions (initializeSession, handleSendMessage, etc.) sont les mêmes
// que dans la version précédente, avec l'intégration des appels à addDebugLog.
// Je les inclus ici pour que le fichier soit complet.

function initializeSession() {
  let sessionId = localStorage.getItem('agenticForgeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', sessionId);
    addDebugLog(`Nouvel ID de session généré: ${sessionId}`);
  } else {
    addDebugLog(`ID de session récupéré: ${sessionId}`);
  }
  state.sessionId = sessionId;
  updateSessionDisplay();
}

function initializeAuthToken() {
  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    state.authToken = savedToken;
    addDebugLog('Token chargé depuis localStorage.');
    updateTokenStatus(true);
    fetchAndDisplayToolCount();
  } else {
    addDebugLog('Aucun token trouvé en local.');
    updateTokenStatus(false);
  }
}

async function handleSendMessage(event) {
  event.preventDefault();
  const goal = elements.messageInput.value.trim();
  if (!goal || state.isProcessing || !state.authToken || !state.sessionId) return;
  state.isProcessing = true;
  updateAllUI();
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();
  
  addDebugLog(`Envoi de l'objectif: "${goal}"`, 'request');
  try {
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    addDebugLog(`Réponse API reçue: ${JSON.stringify(result)}`, 'success');
    const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    fetchAndDisplayToolCount();
  } catch (error) {
    addDebugLog(`Erreur API: ${error.message}`, 'error');
    hideTypingIndicator();
    addMessage(`❌ **Erreur d'exécution :**\n${error.message}`, 'assistant');
    updateSessionStatus('error');
  } finally {
    state.isProcessing = false;
    updateAllUI();
    elements.messageInput.focus();
  }
}

async function fetchAndDisplayToolCount() {
  if (!state.authToken || !state.sessionId) return;
  addDebugLog('Récupération de la liste des outils...', 'request');
  try {
    const tools = await getTools(state.authToken, state.sessionId);
    addDebugLog(`${tools.length} outils trouvés.`, 'success');
    updateToolCount(tools.length);
    updateSessionStatus('valid');
  } catch (error) {
    addDebugLog(`Erreur getTools: ${error.message}`, 'error');
    updateToolCount('Erreur');
    updateSessionStatus('error');
  }
}

function handleSaveToken() {
  const tokenValue = elements.authTokenInput.value.trim();
  state.authToken = tokenValue;
  if (tokenValue) {
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
    addMessage('🔑 Token sauvegardé.', 'assistant');
    addDebugLog('Nouveau token sauvegardé.');
    fetchAndDisplayToolCount();
  } else {
    localStorage.removeItem('agenticForgeAuthToken');
    addMessage('🗑️ Token supprimé.', 'assistant');
    addDebugLog('Token supprimé.');
    updateToolCount(0);
  }
  updateTokenStatus(!!tokenValue);
  updateAllUI();
}

function handleNewSession() {
  const oldSessionId = state.sessionId;
  const newSessionId = generateUUID();
  localStorage.setItem('agenticForgeSessionId', newSessionId);
  state.sessionId = newSessionId;
  updateSessionDisplay();
  addMessage(`🔄 **Nouvelle Session Créée.**`, 'assistant');
  addDebugLog(`Nouvelle session. Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`);
  handleClearHistory(false);
  fetchAndDisplayToolCount();
}

function handleClearHistory(showMessage) {
  elements.messagesContainer.innerHTML = '';
  if (showMessage) {
    addMessage('🗑️ Historique local effacé.', 'assistant');
    addDebugLog('Historique local effacé.');
  }
}

function updateAllUI() {
  const canInteract = !!state.authToken && !!state.sessionId && !state.isProcessing && state.serverHealthy;
  elements.sendBtn.disabled = !canInteract;
  elements.messageInput.disabled = !canInteract;

  if (state.isProcessing) {
    elements.messageInput.placeholder = "🤔 L'agent réfléchit...";
  } else if (!state.serverHealthy) {
    elements.messageInput.placeholder = '🏥 Serveur hors ligne...';
  } else if (!state.authToken) {
    elements.messageInput.placeholder = '🔑 Veuillez sauvegarder un Bearer Token...';
  } else {
    elements.messageInput.placeholder = '💬 Décrivez votre objectif...';
  }
}

function updateSessionDisplay() {
  if (state.sessionId) {
    elements.sessionIdDisplay.textContent = `${state.sessionId.substring(0, 12)}...`;
  }
}

function updateSessionStatus(status) {
  const indicator = elements.sessionStatusIndicator;
  const text = elements.sessionStatusText;
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

async function checkServerHealth() {
  addDebugLog('Vérification de la santé du serveur...');
  try {
    state.serverHealthy = await testServerHealth();
    elements.connectionHealth.textContent = state.serverHealthy ? '✅ En ligne' : '❌ Hors ligne';
    addDebugLog(`Statut du serveur: ${state.serverHealthy ? 'En ligne' : 'Hors ligne'}`, state.serverHealthy ? 'success' : 'error');
  } catch (err) {
    state.serverHealthy = false;
    elements.connectionHealth.textContent = '❌ Hors ligne';
    addDebugLog(`Échec de la vérification de la santé du serveur: ${err.message}`, 'error');
  }
  updateAllUI();
}