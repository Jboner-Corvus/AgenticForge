// public/js/main.js
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
  clearDebugBtn: document.getElementById('clearDebugBtn'),
  debugLogContent: document.getElementById('debug-log-content'),
};

document.addEventListener('DOMContentLoaded', () => {
  addDebugLog('Interface initialisée (DOMContentLoaded).');
  initializeSession();
  initializeAuthToken();
  setupEventListeners();
  updateAllUI();
  checkServerHealth();
  addMessage(
    '🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.',
    'assistant',
  );
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
}

function initializeSession() {
  let sessionId = localStorage.getItem('agenticForgeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', sessionId);
    addDebugLog(`Nouvel ID de session généré par le client: ${sessionId}`);
  } else {
    addDebugLog(`ID de session récupéré du localStorage: ${sessionId}`);
  }
  state.sessionId = sessionId;
  updateSessionDisplay();
}

function initializeAuthToken() {
  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    state.authToken = savedToken;
    addDebugLog('Token d\'authentification chargé depuis le localStorage.');
    updateTokenStatus(true);
    fetchAndDisplayToolCount();
  } else {
    addDebugLog('Aucun token d\'authentification trouvé.');
    updateTokenStatus(false);
  }
}

async function handleSendMessage(event) {
  event.preventDefault();
  const goal = elements.messageInput.value.trim();
  if (!goal || state.isProcessing || !state.authToken || !state.sessionId) {
    return;
  }
  state.isProcessing = true;
  updateAllUI();
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();
  
  addDebugLog(`Envoi de l'objectif: "${goal}"`, 'request');
  try {
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    addDebugLog(`Réponse reçue: ${JSON.stringify(result)}`, 'success');
    const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    fetchAndDisplayToolCount();
  } catch (error) {
    addDebugLog(`Erreur d'exécution: ${error.message}`, 'error');
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
  addDebugLog('Demande de la liste des outils...', 'request');
  try {
    const tools = await getTools(state.authToken, state.sessionId);
    addDebugLog(`${tools.length} outils reçus.`, 'success');
    updateToolCount(tools.length);
    updateSessionStatus('valid');
  } catch (error) {
    addDebugLog(`Erreur lors de la récupération des outils: ${error.message}`, 'error');
    updateToolCount('Erreur');
    updateSessionStatus('error');
  }
}

function handleSaveToken() {
  const tokenValue = elements.authTokenInput.value.trim();
  state.authToken = tokenValue;
  if (tokenValue) {
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
    addMessage('🔑 Bearer Token sauvegardé.', 'assistant');
    addDebugLog('Nouveau token sauvegardé.');
    fetchAndDisplayToolCount();
  } else {
    localStorage.removeItem('agenticForgeAuthToken');
    addMessage('🗑️ Bearer Token supprimé.', 'assistant');
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
  addMessage(`🔄 **Nouvelle Session Créée.**\nID : ${newSessionId.substring(0, 12)}...`, 'assistant');
  addDebugLog(`Nouvelle session créée par l'utilisateur. Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`);
  handleClearHistory(false);
  fetchAndDisplayToolCount();
}

function handleClearHistory(showMessage) {
  elements.messagesContainer.innerHTML = '';
  if (showMessage) {
    addMessage('🗑️ Historique de conversation local effacé.', 'assistant');
    addDebugLog('Historique local effacé par l\'utilisateur.');
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
  } catch {
    state.serverHealthy = false;
    elements.connectionHealth.textContent = '❌ Hors ligne';
    addDebugLog('Échec de la vérification de la santé du serveur.', 'error');
  }
  updateAllUI();
}