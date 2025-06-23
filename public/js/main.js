// public/js/main.js

import { sendGoal, getToolCount } from './api.js';
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
};

const elements = {
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  chatForm: document.getElementById('chat-form'),
  authTokenInput: document.getElementById('authToken'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  attachFileBtn: document.getElementById('attachFileBtn'),
  fileInput: document.getElementById('fileInput'),
};

document.addEventListener('DOMContentLoaded', () => {
  let sessionId = localStorage.getItem('agenticForgeSessionId');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', sessionId);
  }
  state.sessionId = sessionId;

  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    state.authToken = savedToken;
    updateTokenStatus(true);
    // CORRECTION: Appeler getToolCount même sans sessionId au début
    fetchAndDisplayToolCount();
  } else {
    updateTokenStatus(false);
    updateToolCount(0);
  }

  updateUI();
  addMessage(
    'Veuillez entrer votre Auth Token, puis décrivez votre objectif.',
    'assistant',
  );

  elements.chatForm.addEventListener('submit', handleSendMessage);
  elements.saveTokenBtn.addEventListener('click', () => {
    saveToken();
    fetchAndDisplayToolCount();
  });
  elements.attachFileBtn.addEventListener('click', () =>
    elements.fileInput.click(),
  );
  elements.fileInput.addEventListener('change', handleFileSelect);
});

async function fetchAndDisplayToolCount() {
  if (!state.authToken) {
    updateToolCount('N/A');
    return;
  }
  try {
    // CORRECTION: Permettre l'appel même sans sessionId
    // Le serveur peut retourner le compte d'outils généraux
    const count = await getToolCount(state.authToken, state.sessionId);
    updateToolCount(count);
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre d\'outils:', error);
    // CORRECTION: Ne pas afficher d'erreur si c'est juste un problème de session
    // Au lieu de cela, essayer d'appeler sans sessionId
    try {
      const count = await getToolCount(state.authToken, null);
      updateToolCount(count);
    } catch (secondError) {
      addMessage(`Erreur de connexion : ${secondError.message}`, 'assistant');
      updateToolCount('Erreur');
    }
  }
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    const fileName = files[0].name;
    addMessage(`Fichier prêt à être envoyé : ${fileName}`, 'client');
    elements.messageInput.value = `En utilisant le fichier '${fileName}', ${elements.messageInput.value}`;
    elements.messageInput.focus();
  }
}

function saveToken() {
  const tokenValue = elements.authTokenInput.value.trim();
  state.authToken = tokenValue || null;
  if (tokenValue) {
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
  } else {
    localStorage.removeItem('agenticForgeAuthToken');
  }
  updateUI();
}

async function handleSendMessage(event) {
  event.preventDefault();
  const goal = elements.messageInput.value.trim();
  if (!goal || state.isProcessing) return;

  if (!state.authToken) {
    alert("Veuillez d'abord entrer et sauvegarder votre Auth Token.");
    return;
  }

  state.isProcessing = true;
  updateUI();
  document.querySelectorAll('.message.client').forEach((el) => el.remove());
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    const responseText =
      result.content?.[0]?.text ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    
    // CORRECTION: Actualiser le nombre d'outils après une interaction réussie
    fetchAndDisplayToolCount();
  } catch (error) {
    const errorMessage = `❌ Erreur : ${error.message}`;
    hideTypingIndicator();
    addMessage(errorMessage, 'assistant');
  } finally {
    state.isProcessing = false;
    updateUI();
    elements.messageInput.focus();
  }
}

function updateUI() {
  updateTokenStatus(!!state.authToken);
  const canInteract = !!state.authToken && !state.isProcessing;
  elements.sendBtn.disabled = !canInteract;
  elements.messageInput.disabled = !canInteract;

  if (state.isProcessing) {
    elements.messageInput.placeholder = "L'agent réfléchit...";
  } else if (!state.authToken) {
    elements.messageInput.placeholder =
      "Veuillez d'abord sauvegarder un token.";
  } else {
    elements.messageInput.placeholder = 'Décrivez votre objectif...';
  }

  elements.saveTokenBtn.disabled = state.isProcessing;
  elements.authTokenInput.disabled = state.isProcessing;
}