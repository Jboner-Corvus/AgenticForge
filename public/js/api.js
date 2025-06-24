/**
 * Fichier : public/js/api.js
 * Rôle : Client API complet pour l'interaction avec le serveur.
 * Statut : Aucune modification de la logique d'envoi, mais enrichi pour être plus réaliste.
 */
document.addEventListener('DOMContentLoaded', () => {
  const apiClient = {
    // Méthode de base pour effectuer les appels Fetch
    async request(endpoint, method = 'GET', body = null) {
      const sessionId = localStorage.getItem('sessionId');
      const headers = {
        'Content-Type': 'application/json',
      };

      // Le point clé : on ajoute l'en-tête de session s'il existe.
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const config = {
        method,
        headers,
      };

      if (body) {
        config.body = JSON.stringify(body);
      }

      try {
        const response = await fetch(endpoint, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Une erreur de serveur est survenue.');
        }
        return data;
      } catch (error) {
        // Gérer les erreurs réseau ou les erreurs jetées
        console.error(`Erreur API sur ${method} ${endpoint}:`, error);
        this.displayError(error.message);
        throw error;
      }
    },

    // --- Fonctions d'API spécifiques ---

    async login(email, password) {
      try {
        const data = await this.request('/api/login', 'POST', {
          email,
          password,
        });
        if (data.sessionId) {
          localStorage.setItem('sessionId', data.sessionId);
          console.log('Connexion réussie.');
          this.updateUIForLoggedInState();
        }
      } catch (error) {
        // L'erreur est déjà affichée par la méthode `request`
        this.updateUIForLoggedOutState();
      }
    },

    async logout() {
      try {
        await this.request('/api/logout', 'POST');
        localStorage.removeItem('sessionId');
        console.log('Déconnexion réussie.');
        this.updateUIForLoggedOutState();
      } catch (error) {
        // Même si la déconnexion échoue côté serveur, on nettoie le client
        localStorage.removeItem('sessionId');
        this.updateUIForLoggedOutState();
      }
    },

    async getProfile() {
      try {
        const data = await this.request('/api/profile');
        this.displayProfile(data.user);
      } catch (error) {
        // Si l'appel échoue (session invalide), on déconnecte l'utilisateur
        this.logout();
      }
    },

    // --- Fonctions de manipulation du DOM ---

    displayError(message) {
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    },

    clearError() {
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    },

    updateUIForLoggedInState() {
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('profile-view').style.display = 'block';
      this.getProfile();
    },

    updateUIForLoggedOutState() {
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('profile-view').style.display = 'none';
      const profileContent = document.getElementById('profile-content');
      if (profileContent) profileContent.innerHTML = '';
    },

    displayProfile(user) {
      const profileContent = document.getElementById('profile-content');
      if (profileContent) {
        profileContent.innerHTML = `
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Membre depuis le:</strong> ${new Date(user.memberSince).toLocaleDateString()}</p>
           `;
      }
    },

    // Initialisation
    init() {
      if (localStorage.getItem('sessionId')) {
        this.updateUIForLoggedInState();
      } else {
        this.updateUIForLoggedOutState();
      }
      // ... attacher les écouteurs d'événements aux formulaires et boutons ...
      document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // logique de login...
      });
      document.getElementById('logout-button').addEventListener('click', () => {
        this.logout();
      });
    },
  };

  apiClient.init();
});
