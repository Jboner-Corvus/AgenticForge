// public/js/main.js (version mise à jour)

import { sendGoal } from './api.js';
import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  updateTokenStatus,
  updateUserMessage,
} from './ui.js';

// --- État de l'application ---
const state = {
  isProcessing: false,
  sessionId: null,
  authToken: null,
};

// --- Références DOM ---
const elements = {
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  chatForm: document.getElementById('chat-form'),
  authTokenInput: document.getElementById('authToken'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
};

// --- Initialisation de l'application ---
document.addEventListener('DOMContentLoaded', () => {
  // Tenter de charger le token depuis le stockage local
  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    saveToken();
  }

  updateUI(); // Met à jour l'état initial des boutons
  addMessage(
    'Veuillez entrer votre Auth Token, puis décrivez votre objectif.',
    'assistant',
  );

  // Écouteurs d'événements
  elements.chatForm.addEventListener('submit', handleSendMessage);
  elements.saveTokenBtn.addEventListener('click', saveToken);
});

// --- Fonctions ---

/**
 * Sauvegarde le token de l'input vers l'état de l'app et le localStorage.
 */
function saveToken() {
  const tokenValue = elements.authTokenInput.value.trim();
  if (tokenValue) {
    state.authToken = tokenValue;
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
    console.log('Token saved.');
  } else {
    state.authToken = null;
    localStorage.removeItem('agenticForgeAuthToken');
    console.log('Token cleared.');
  }
  updateUI();
}

/**
 * Gère l'envoi d'un message/objectif.
 */
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

  const userMessage = addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    const data = await sendGoal(goal, state.authToken, state.sessionId);

    // Stocker le sessionId pour les requêtes futures
    if (data.sessionId) {
      state.sessionId = data.sessionId;
    }

    const responseText =
      data.response ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    updateUserMessage(userMessage, responseText, 'assistant'); // Remplace l'indicateur par la réponse
  } catch (error) {
    const errorMessage = `❌ Erreur : ${error.message}`;
    updateUserMessage(userMessage, errorMessage, 'assistant');
    console.error(error);
  } finally {
    state.isProcessing = false;
    updateUI();
    elements.messageInput.focus();
  }
}

/**
 * Met à jour l'état visuel de l'interface en fonction de l'état de l'application.
 */
function updateUI() {
  // Met à jour le statut visuel du token
  updateTokenStatus(!!state.authToken);

  // Active ou désactive le formulaire de chat
  if (state.authToken && !state.isProcessing) {
    elements.sendBtn.disabled = false;
    elements.messageInput.disabled = false;
    elements.messageInput.placeholder = 'Décrivez votre objectif...';
  } else {
    elements.sendBtn.disabled = true;
    elements.messageInput.disabled = true;
    if (state.isProcessing) {
      elements.messageInput.placeholder = "L'agent réfléchit...";
    } else {
      elements.messageInput.placeholder =
        "Veuillez d'abord sauvegarder un token.";
    }
  }

  // État du bouton de sauvegarde de token
  elements.saveTokenBtn.disabled = state.isProcessing;
  elements.authTokenInput.disabled = state.isProcessing;
}
