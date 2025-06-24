// public/js/main.js
import { sendGoal, getTools, testServerHealth } from './api.js';
import { addMessage, showTypingIndicator, hideTypingIndicator, updateTokenStatus, updateToolCount } from './ui.js';

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
};

document.addEventListener('DOMContentLoaded', () => {
  initializeSession();
  initializeAuthToken();
  setupEventListeners();
  updateAllUI();
  checkServerHealth();
  addMessage('🎯 **Agent prêt.** Veuillez entrer votre *Auth Token* pour commencer.', 'assistant');
});

function initializeSession() {
  let sessionId = localStorage.getItem('agenticForgeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', sessionId);
  }
  state.sessionId = sessionId;
  updateSessionDisplay();
}

function initializeAuthToken() {
  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    state.authToken = savedToken;
    updateTokenStatus(true);
    fetchAndDisplayToolCount();
  } else {
    updateTokenStatus(false);
  }
}

function setupEventListeners() {
  elements.chatForm.addEventListener('submit', handleSendMessage);
  elements.saveTokenBtn.addEventListener('click', handleSaveToken);
  elements.newSessionBtn.addEventListener('click', handleNewSession);
  elements.clearHistoryBtn.addEventListener('click', () => handleClearHistory(true));
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
  try {
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    fetchAndDisplayToolCount();
  } catch (error) {
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
  try {
    const tools = await getTools(state.authToken, state.sessionId);
    updateToolCount(tools.length);
    updateSessionStatus('valid');
  } catch (error) {
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
    fetchAndDisplayToolCount();
  } else {
    localStorage.removeItem('agenticForgeAuthToken');
    addMessage('🗑️ Bearer Token supprimé.', 'assistant');
    updateToolCount(0);
  }
  updateTokenStatus(!!tokenValue);
  updateAllUI();
}

function handleNewSession() {
  const newSessionId = generateUUID();
  localStorage.setItem('agenticForgeSessionId', newSessionId);
  state.sessionId = newSessionId;
  updateSessionDisplay();
  addMessage(`🔄 **Nouvelle Session Créée.**\nID : ${newSessionId.substring(0, 12)}...`, 'assistant');
  handleClearHistory(false);
  fetchAndDisplayToolCount();
}

function handleClearHistory(showMessage) {
  elements.messagesContainer.innerHTML = '';
  if (showMessage) {
    addMessage('🗑️ Historique de conversation local effacé.', 'assistant');
  }
}

function updateAllUI() {
  const canInteract = !!state.authToken && !!state.sessionId && !state.isProcessing && state.serverHealthy;
  elements.sendBtn.disabled = !canInteract;
  elements.messageInput.disabled = !canInteract;

  if (state.isProcessing) {
    elements.messageInput.placeholder = "🤔 L'agent réfléchit...";
  } else if (!state.serverHealthy) {
    elements.messageInput.placeholder = "🏥 Serveur hors ligne...";
  } else if (!state.authToken) {
    elements.messageInput.placeholder = "🔑 Veuillez sauvegarder un Bearer Token...";
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
  try {
    state.serverHealthy = await testServerHealth();
    elements.connectionHealth.textContent = state.serverHealthy ? '✅ En ligne' : '❌ Hors ligne';
  } catch {
    state.serverHealthy = false;
    elements.connectionHealth.textContent = '❌ Hors ligne';
  }
  updateAllUI();
}