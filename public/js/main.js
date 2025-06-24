// public/js/main.js (Juste la fonction modifiée à titre d'exemple)
// Le reste du fichier est bon.

// Dans la fonction handleSendMessage :
async function handleSendMessage(event) {
  event.preventDefault();
  const goal = elements.messageInput.value.trim();
  if (!goal || state.isProcessing) return;

  // La validation manuelle n'est plus cruciale car le serveur la fait.
  if (!state.authToken || !state.sessionId) {
      alert('Le token et la session sont requis.');
      return;
  }

  state.isProcessing = true;
  updateAllUI();
  addMessage(goal, 'user');
  elements.messageInput.value = '';
  showTypingIndicator();

  try {
    // CORRECTION : L'appel est identique, mais la logique sous-jacente dans api.js a changé.
    const result = await sendGoal(goal, state.authToken, state.sessionId);
    
    const responseText = result.text || "L'agent a terminé mais n'a fourni aucune réponse textuelle.";

    hideTypingIndicator();
    addMessage(responseText, 'assistant');
    fetchAndDisplayToolCount();

  } catch (error) {
    hideTypingIndicator();
    addMessage(`❌ **Erreur d'exécution :**\n${error.message}`, 'assistant');
  } finally {
    state.isProcessing = false;
    updateAllUI();
    elements.messageInput.focus();
  }
}