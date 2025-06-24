// public/js/main.js (Version complète stricte intégrée à la nouvelle interface)

import { sendGoal, getToolCount, testServerHealth, validateSessionContract } from './api.js';
import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  updateTokenStatus,
  updateToolCount,
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
  attachFileBtn: document.getElementById('attachFileBtn'),
  fileInput: document.getElementById('fileInput'),
  // Nouveaux éléments de l'interface stricte
  sessionStatusIndicator: document.getElementById('sessionStatusIndicator'),
  sessionStatusText: document.getElementById('sessionStatusText'),
  connectionStatusText: document.getElementById('connectionStatusText'),
  sessionIdDisplay: document.getElementById('sessionIdDisplay'),
  connectionHealth: document.getElementById('connectionHealth'),
  newSessionBtn: document.getElementById('newSessionBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [MAIN] Initializing Agentic Forge with STRICT session management...');
  
  initializeSession();
  initializeAuthToken();
  setupEventListeners();
  updateAllUI();
  
  // Test initial de santé du serveur
  checkServerHealth();
  
  // Message d'accueil avec informations sur le mode strict
  addMessage(
    '🎯 **Mode Session Stricte Activé**\n\n' +
    'Veuillez entrer votre Auth Token pour commencer. Votre Session ID unique maintiendra le contexte de conversation entre les requêtes.\n\n' +
    '📋 **Contrat de Session :** Toutes les requêtes nécessitent un Bearer Token ET un Session ID valides.',
    'assistant',
  );
});

function initializeSession() {
  // GESTION STRICTE DE LA SESSION : Toujours avoir un sessionId valide
  let sessionId = localStorage.getItem('agenticForgeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', sessionId);
    console.log('🆕 [MAIN] New session created:', sessionId);
    addMessage(`🆕 Nouvelle session créée : ${sessionId.substring(0, 12)}...`, 'assistant');
  } else {
    console.log('📋 [MAIN] Existing session loaded:', sessionId);
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
    console.log('🔑 [MAIN] Saved token loaded');
    
    // Tester la connexion avec token et session
    fetchAndDisplayToolCount();
  } else {
    updateTokenStatus(false);
    updateToolCount(0);
    console.log('❌ [MAIN] No saved token found');
  }
}

function setupEventListeners() {
  elements.chatForm.addEventListener('submit', handleSendMessage);
  elements.saveTokenBtn.addEventListener('click', handleSaveToken);
  elements.attachFileBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.newSessionBtn.addEventListener('click', handleNewSession);
  elements.clearHistoryBtn.addEventListener('click', handleClearHistory);
}

async function checkServerHealth() {
  console.log('🏥 [MAIN] Checking server health...');
  try {
    const isHealthy = await testServerHealth();
    state.serverHealthy = isHealthy;
    elements.connectionHealth.textContent = isHealthy ? '✅ Serveur OK' : '❌ Serveur KO';
    elements.connectionHealth.className = `status-value ${isHealthy ? 'healthy' : 'unhealthy'}`;
  } catch (error) {
    console.error('❌ [MAIN] Server health check failed:', error);
    state.serverHealthy = false;
    elements.connectionHealth.textContent = '❌ Hors ligne';
    elements.connectionHealth.className = 'status-value unhealthy';
  }
}

// FONCTION CORRIGÉE : Respecte le contrat strict avec le serveur
async function fetchAndDisplayToolCount() {
  // RÈGLE STRICTE : Les deux sont requis, pas d'approximation
  if (!state.authToken || !state.sessionId) {
    updateToolCount('N/A');
    console.log('⚠️ [MAIN] Cannot fetch tool count: missing token or session ID');
    return;
  }
  
  // Valider le contrat avant l'envoi
  const validation = validateSessionContract(state.authToken, state.sessionId);
  if (!validation.isValid) {
    console.error('❌ [MAIN] Session contract validation failed:', validation.errors);
    updateToolCount('Validation ❌');
    addMessage(`❌ Erreur de validation : ${validation.errors.join(', ')}`, 'assistant');
    return;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ [MAIN] Session contract warnings:', validation.warnings);
  }
  
  try {
    console.log('🔄 [MAIN] Fetching tool count with session:', state.sessionId.substring(0, 12) + '...');
    
    // Envoie toujours une requête valide avec le token ET l'ID de session
    const count = await getToolCount(state.authToken, state.sessionId);
    updateToolCount(count);
    console.log('✅ [MAIN] Tool count retrieved:', count);
    
    // Mise à jour du statut de session
    updateSessionStatus('valid');
    
  } catch (error) {
    console.error('❌ [MAIN] Error fetching tool count:', error.message);
    updateToolCount('Erreur');
    updateSessionStatus('error');
    
    // Analyser le type d'erreur pour donner des conseils spécifiques
    if (error.message.includes('Session ID') || error.message.includes('session')) {
      addMessage(
        '❌ **Erreur de Session** : Votre Session ID semble invalide ou expiré.\n\n' +
        '💡 **Solution :** Cliquez sur "🔄 Nouvelle Session" pour créer une nouvelle session.',
        'assistant'
      );
    } else if (error.message.includes('Token') || error.message.includes('401')) {
      addMessage(
        '❌ **Erreur d\'Authentification** : Votre Bearer Token semble invalide.\n\n' +
        '💡 **Solution :** Vérifiez et re-saisissez votre Bearer Token.',
        'assistant'
      );
    } else {
      addMessage(`❌ Erreur de connexion : ${error.message}`, 'assistant');
    }
  }
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    const fileName = files[0].name;
    addMessage(`📎 Fichier prêt à être envoyé : ${fileName}`, 'client');
    elements.messageInput.value = `En utilisant le fichier '${fileName}', ${elements.messageInput.value}`;
    elements.messageInput.focus();
  }
}

function handleSaveToken() {
  const tokenValue = elements.authTokenInput.value.trim();
  state.authToken = tokenValue || null;
  
  if (tokenValue) {
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
    console.log('🔑 [MAIN] Token saved successfully');
    addMessage('🔑 Bearer Token sauvegardé avec succès !', 'assistant');
  } else {
    localStorage.removeItem('agenticForgeAuthToken');
    console.log('🗑️ [MAIN] Token removed');
    addMessage('🗑️ Bearer Token supprimé.', 'assistant');
  }
  
  updateAllUI();
  
  // Tester la connexion après sauvegarde du token
  if (tokenValue && state.sessionId) {
    fetchAndDisplayToolCount();
  }
}

function handleNewSession() {
  console.log('🔄 [MAIN] Creating new session...');
  
  // Créer une nouvelle session
  const newSessionId = generateUUID();
  localStorage.setItem('agenticForgeSessionId', newSessionId);
  state.sessionId = newSessionId;
  
  updateSessionDisplay();
  updateSessionStatus('new');
  
  addMessage(`🔄 **Nouvelle Session Créée**\n\nNouveau Session ID : ${newSessionId.substring(0, 12)}...\n\nVotre historique de conversation a été réinitialisé.`, 'assistant');
  
  // Tester la nouvelle session si on a un token
  if (state.authToken) {
    fetchAndDisplayToolCount();
  }
}

function handleClearHistory() {
  console.log('🗑️ [MAIN] Clearing conversation history...');
  
  // Vider l'interface de conversation
  const messagesContainer = document.getElementById('messagesContainer');
  messagesContainer.innerHTML = '';
  
  addMessage('🗑️ **Historique Vidé**\n\nL\'historique de conversation local a été supprimé. Votre Session ID reste actif.', 'assistant');
  
  console.log('✅ [MAIN] Conversation history cleared');
}

async function handleSendMessage(event) {
  event.preventDefault();
  const goal = elements.messageInput.value.trim();
  if (!goal || state.isProcessing) return;

  // VÉRIFICATION STRICTE : Les deux sont requis
  if (!state.authToken) {
    alert("⚠️ Veuillez d'abord entrer et sauvegarder votre Auth Token.");
    return;
  }

  if (!state.sessionId) {
    alert("⚠️ Erreur de session. Veuillez cliquer sur 'Nouvelle Session'.");
    return;
  }

  // Validation du contrat avant envoi
  const validation = validateSessionContract(state.authToken, state.sessionId);
  if (!validation.isValid) {
    alert(`⚠️ Erreur de validation : ${validation.errors.join(', ')}`);
    return;
  }

  state.isProcessing = true;
  updateAllUI();
  
  // Nettoyer les anciens messages client
  document.querySelectorAll('.message.client').forEach((el) => el.remove());
  
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    console.log('🚀 [MAIN] Sending goal with session:', state.sessionId.substring(0, 12) + '...');
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    
    const responseText =
      result.content?.[0]?.text ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    
    // Actualiser le nombre d'outils après une interaction réussie
    fetchAndDisplayToolCount();
    
    console.log('✅ [MAIN] Goal execution completed successfully');
    
  } catch (error) {
    const errorMessage = `❌ Erreur : ${error.message}`;
    hideTypingIndicator();
    addMessage(errorMessage, 'assistant');
    
    // Si erreur de session, suggérer une solution
    if (error.message.includes('session') || error.message.includes('Session')) {
      addMessage(
        '💡 **Suggestion :** Cliquez sur "🔄 Nouvelle Session" pour créer une nouvelle session valide.',
        'assistant'
      );
    }
    
    console.error('❌ [MAIN] Goal execution failed:', error);
    
  } finally {
    state.isProcessing = false;
    updateAllUI();
    elements.messageInput.focus();
  }
}

function updateSessionDisplay() {
  if (state.sessionId) {
    elements.sessionIdDisplay.textContent = state.sessionId.substring(0, 12) + '...';
  } else {
    elements.sessionIdDisplay.textContent = '--';
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
    case 'new':
      indicator.className = 'status-indicator-token valid';
      text.textContent = 'Nouvelle Session';
      break;
    default:
      indicator.className = 'status-indicator-token';
      text.textContent = 'Session en cours...';
  }
}

function updateAllUI() {
  updateTokenStatus(!!state.authToken);
  updateSessionDisplay();
  
  // RÈGLE STRICTE : Les deux sont requis pour interagir
  const canInteract = !!state.authToken && !!state.sessionId && !state.isProcessing && state.serverHealthy;
  
  elements.sendBtn.disabled = !canInteract;
  elements.messageInput.disabled = !canInteract;

  // Messages de placeholder informatifs
  if (state.isProcessing) {
    elements.messageInput.placeholder = "🤔 L'agent réfléchit...";
  } else if (!state.authToken) {
    elements.messageInput.placeholder = "🔑 Veuillez d'abord sauvegarder un Bearer Token...";
  } else if (!state.sessionId) {
    elements.messageInput.placeholder = "🆔 Erreur de session. Créez une nouvelle session...";
  } else if (!state.serverHealthy) {
    elements.messageInput.placeholder = "🏥 Serveur hors ligne. Vérifiez la connexion...";
  } else {
    elements.messageInput.placeholder = '💬 Décrivez votre objectif...';
  }

  elements.saveTokenBtn.disabled = state.isProcessing;
  elements.authTokenInput.disabled = state.isProcessing;
  elements.newSessionBtn.disabled = state.isProcessing;
  elements.clearHistoryBtn.disabled = state.isProcessing;
}