// public/js/main.js

import { sendGoal } from './api.js';
import {
  addMessage,
  showTypingIndicator,
  hideTypingIndicator,
  setStatus,
} from './ui.js';

// --- État de l'application ---
let isProcessing = false;
let sessionId = null;

// --- Références DOM ---
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const authTokenInput = document.getElementById('authToken');

// --- Logique principale ---
document.addEventListener('DOMContentLoaded', () => {
  // Écouteurs d'événements
  sendBtn.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Message de bienvenue et statut initial
  addMessage(
    'Bonjour ! Je suis Agentic Prometheus. Comment puis-je vous aider ?',
    'assistant',
  );
  setStatus(true); // Supposons une connexion au démarrage
});

async function handleSendMessage() {
  const goal = messageInput.value.trim();
  const token = authTokenInput.value.trim();

  if (!goal || isProcessing) return;
  if (!token) {
    alert("Veuillez entrer votre Bearer Token d'authentification.");
    return;
  }

  isProcessing = true;
  sendBtn.disabled = true;

  addMessage(goal, 'user');
  messageInput.value = '';
  showTypingIndicator();

  try {
    const data = await sendGoal(goal, token, sessionId);

    hideTypingIndicator();

    // Stocker le sessionId pour les requêtes futures
    if (data.sessionId) {
      sessionId = data.sessionId;
    }

    // Simplification : on affiche toute la réponse de l'agent
    const responseText =
      data.response ||
      "L'agent a terminé mais n'a fourni aucune réponse textuelle.";
    addMessage(responseText, 'assistant');
  } catch (error) {
    hideTypingIndicator();
    addMessage(`❌ Erreur : ${error.message}`, 'assistant');
    console.error(error);
  } finally {
    isProcessing = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}
