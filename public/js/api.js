// FICHIER MODIFIÉ : public/js/api.js

/**
 * MODIFIÉ : Envoie un message au backend.
 * Plus de gestion de 'mcp-session-id'. Le navigateur gère le cookie automatiquement.
 * @param {string} prompt Le message de l'utilisateur.
 * @returns {Promise<any>} La réponse du serveur (contenant le jobId).
 */
async function sendMessage(prompt) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur du serveur');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}

/**
 * Récupère le statut d'un job en cours.
 * @param {string} jobId L'ID du job.
 * @returns {Promise<any>} L'état actuel du job.
 */
async function getJobStatus(jobId) {
  try {
    const response = await fetch(`/api/status/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération du statut');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de statut du job:', error);
    throw error;
  }
}

/**
 * AJOUTÉ : Récupère l'historique de la conversation pour la session actuelle.
 * @returns {Promise<Array>} Un tableau de messages.
 */
async function getHistory() {
  try {
    const response = await fetch('/api/history');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération de l\'historique');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de récupération de l\'historique:', error);
    throw error;
  }
}

// SUPPRIMÉ : La fonction createSession() est obsolète.
// SUPPRIMÉ : La fonction getSession() (qui récupérait l'ID de session) est obsolète.