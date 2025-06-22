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
  attachFileBtn: document.getElementById('attachFileBtn'),
  fileInput: document.getElementById('fileInput'),
  toolCreationToggle: document.getElementById('toolCreationToggle'),
  codeExecutionToggle: document.getElementById('codeExecutionToggle'),
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
  elements.attachFileBtn.addEventListener('click', () =>
    elements.fileInput.click(),
  );
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.toolCreationToggle.addEventListener('change', (e) =>
    handleToggle(e, "La capacité de création d'outils"),
  );
  elements.codeExecutionToggle.addEventListener('change', (e) =>
    handleToggle(e, "La capacité d'exécution de code"),
  );
});

// --- Fonctions ---

/**
 * Gère le changement d'état d'un interrupteur.
 * @param {Event} event
 * @param {string} capabilityName Nom de la capacité pour le message.
 */
function handleToggle(event, capabilityName) {
  const isEnabled = event.target.checked;
  console.log(
    `${capabilityName} est maintenant ${isEnabled ? 'activée' : 'désactivée'}.`,
  );
  addMessage(
    `${capabilityName} a été ${isEnabled ? 'activée' : 'désactivée'}.`,
    'client',
  );
}

/**
 * Gère la sélection d'un fichier.
 * @param {Event} event
 */
function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    const fileName = files[0].name;
    addMessage(`Fichier prêt à être envoyé : ${fileName}`, 'client');
    elements.messageInput.value = `En utilisant le fichier '${fileName}', ${elements.messageInput.value}`;
    elements.messageInput.focus();
  }
}

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

  document.querySelectorAll('.message.client').forEach((el) => el.remove());

  addMessage(goal, 'user'); // Affiche le message de l'utilisateur
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    const data = await sendGoal(goal, state.authToken, state.sessionId);

    if (data.sessionId) {
      state.sessionId = data.sessionId;
    }

    const responseText =
      data.response ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";

    // CORRECTION : On cache l'indicateur de frappe et on AJOUTE un nouveau message pour l'assistant
    hideTypingIndicator();
    addMessage(responseText, 'assistant');
  } catch (error) {
    const errorMessage = `❌ Erreur : ${error.message}`;
    // CORRECTION : On cache l'indicateur et on AJOUTE un message d'erreur
    hideTypingIndicator();
    addMessage(errorMessage, 'assistant');
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
  updateTokenStatus(!!state.authToken);

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

  elements.saveTokenBtn.disabled = state.isProcessing;
  elements.authTokenInput.disabled = state.isProcessing;
}
