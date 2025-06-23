// public/js/main.js (version complète et fonctionnelle)

import { sendGoal, getToolCount } from './api.js';
import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  updateTokenStatus,
  updateToolCount,
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
  const savedToken = localStorage.getItem('agenticForgeAuthToken');
  if (savedToken) {
    elements.authTokenInput.value = savedToken;
    state.authToken = savedToken;
    updateTokenStatus(true);
    // Mettre à jour le compteur au chargement si le token existe
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

  // Écouteurs d'événements
  elements.chatForm.addEventListener('submit', handleSendMessage);
  elements.saveTokenBtn.addEventListener('click', () => {
    saveToken();
    // Mettre à jour le compteur d'outils dès que le token est sauvegardé
    fetchAndDisplayToolCount();
  });
  elements.attachFileBtn.addEventListener('click', () =>
    elements.fileInput.click(),
  );
  elements.fileInput.addEventListener('change', handleFileSelect);
});

// --- Fonctions ---

/**
 * Récupère et affiche le nombre d'outils.
 */
async function fetchAndDisplayToolCount() {
  if (!state.authToken) {
    updateToolCount('N/A');
    return;
  }
  try {
    const count = await getToolCount(state.authToken);
    updateToolCount(count);
  } catch (error) {
    console.error("Échec de la récupération du nombre d'outils:", error);
    updateToolCount('N/A');
  }
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
  state.authToken = tokenValue || null;
  if (tokenValue) {
    localStorage.setItem('agenticForgeAuthToken', tokenValue);
    console.log('Token saved.');
  } else {
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
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    // La fonction sendGoal renvoie maintenant directement l'objet `result` de FastMCP
    const result = await sendGoal(goal, state.authToken, state.sessionId);

    if (result.sessionId) {
      // Si la session est renvoyée (potentiellement dans un champ `extras`)
      state.sessionId = result.sessionId;
    }

    // Le texte de la réponse se trouve dans result.content[0].text
    const responseText =
      result.content?.[0]?.text ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";

    hideTypingIndicator();
    addMessage(responseText, 'assistant');
  } catch (error) {
    const errorMessage = `❌ Erreur : ${error.message}`;
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
