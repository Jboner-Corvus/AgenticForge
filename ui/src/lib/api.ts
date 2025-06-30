// ui/src/lib/api.ts

/**
 * Envoie un message au backend.
 * @param {string} prompt Le message de l'utilisateur.
 * @returns {Promise<any>} La réponse du serveur (contenant le jobId).
 */
export async function sendMessage(prompt: string): Promise<any> {
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
    console.error('Erreur lors de l'envoi du message:', error);
    throw error;
  }
}

/**
 * Récupère le statut d'un job en cours.
 * @param {string} jobId L'ID du job.
 * @returns {Promise<any>} L'état actuel du job.
 */
export async function getJobStatus(jobId: string): Promise<any> {
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
 * Récupère l'historique de la conversation pour la session actuelle.
 * @returns {Promise<Array<any>>} Un tableau de messages.
 */
export async function getHistory(): Promise<Array<any>> {
  try {
    const response = await fetch('/api/history');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération de l'historique');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de récupération de l'historique:', error);
    throw error;
  }
}

/**
 * Teste la santé du serveur.
 * @returns {Promise<boolean>} True si le serveur est sain, false sinon.
 */
export async function testServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la vérification de la santé du serveur:', error);
    return false;
  }
}

/**
 * Récupère la liste des outils disponibles.
 * @returns {Promise<Array<any>>} Un tableau d'outils.
 */
export async function getTools(): Promise<Array<any>> {
  try {
    const response = await fetch('/api/tools');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des outils');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur de récupération des outils:', error);
    throw error;
  }
}
