export const fr = {
  // ControlPanel translations
  agentStatus: 'Statut',
  sessionId: 'ID de session',
  connectionStatus: 'Statut de connexion',
  online: 'En ligne',
  offline: 'Hors ligne',
  agentCapabilities: 'Capacités',
  toolsDetected: 'Outils détectés',
  toolCreation: 'Création d\'outils',
  codeExecution: 'Exécution de code',
  sessionManagement: 'Actions',
  newSessionButton: 'Nouvelle session',
  clearHistory: 'Effacer l\'historique',
  saveCurrentSession: 'Sauvegarder la session actuelle',
  savedSessions: 'Historique',
  noSessionsSaved: 'Aucune session sauvegardée',
  active: 'Active',
  // UserInput translations
  typeYourMessage: 'Tapez votre message...',
  send: 'Envoyer',
  // Other translations
  historyCleared: 'Historique effacé',
  newSessionCreated: 'Nouvelle session créée',
  newSession: 'Nouvelle session',
  sessionNamePlaceholder: 'Nom de la session',
  // AppInitializer translations
  newSessionGenerated: 'Nouvelle session générée',
  sessionRetrieved: 'Session récupérée',
  checkingServerHealth: 'Vérification de l\'état du serveur',
  serverStatus: 'Statut du serveur',
  serverOnline: 'En ligne',
  serverOffline: 'Hors ligne',
  serverHealthCheckFailed: 'Échec de la vérification du serveur',
  tokenLoadedFromEnv: 'Token chargé depuis l\'environnement',
  tokenLoadedFromCookie: 'Token chargé depuis le cookie',
  noTokenFound: 'Aucun token trouvé',
  interfaceInitialized: 'Interface initialisée',
  agentReady: 'Agent prêt',
  // OAuth Management translations
  oauthManagement: 'Gestion OAuth',
  oauthManagementDescription: 'Configurez vos connexions OAuth pour l\'authentification',
  githubIntegration: 'Intégration GitHub',
  googleIntegration: 'Intégration Google',
  twitterIntegration: 'Intégration Twitter',
  authToken: 'Token d\'authentification',
  authTokenPlaceholder: 'Entrez votre token Bearer...',
  saveToken: 'Sauvegarder le token',
  securityWarning: 'Avertissement de sécurité',
  oauthSecurityWarning: 'Vos tokens OAuth sont stockés de manière sécurisée et ne sont jamais exposés côté client.',
  checkingStatus: 'Vérification du statut...',
  githubConnectionStatus: 'Statut de connexion GitHub',
  githubConnected: 'Connecté à GitHub',
  githubNotConnected: 'Non connecté à GitHub',
  googleConnectionStatus: 'Statut de connexion Google',
  googleConnected: 'Connecté à Google',
  googleNotConnected: 'Non connecté à Google',
  twitterConnectionStatus: 'Statut de connexion Twitter',
  twitterConnected: 'Connecté à Twitter',
  twitterNotConnected: 'Non connecté à Twitter',
  disconnect: 'Déconnecter',
  connectGitHub: 'Connecter GitHub',
  connectGoogle: 'Connecter Google',
  connectTwitter: 'Connecter Twitter',
  oauthExplanation: 'OAuth vous permet de vous authentifier de manière sécurisée via des fournisseurs tiers.',
  // Store translations for API calls
  fetchingToolsList: 'Récupération de la liste des outils...',
  toolsFound: 'outils trouvés',
  getToolsError: 'Erreur getTools',
  error: 'Erreur',
  // SettingsModal translations
  newTokenSaved: 'Nouveau token sauvegardé',
  tokenDeleted: 'Token supprimé',
  tokenSaved: 'Token sauvegardé',
  tokenRemoved: 'Token supprimé',
};

export const en = {
  // ControlPanel translations
  agentStatus: 'Status',
  sessionId: 'Session ID',
  connectionStatus: 'Connection Status',
  online: 'Online',
  offline: 'Offline',
  agentCapabilities: 'Capabilities',
  toolsDetected: 'Tools Detected',
  toolCreation: 'Tool Creation',
  codeExecution: 'Code Execution',
  sessionManagement: 'Actions',
  newSessionButton: 'New Session',
  clearHistory: 'Clear History',
  saveCurrentSession: 'Save Current Session',
  savedSessions: 'History',
  noSessionsSaved: 'No sessions saved',
  active: 'Active',
  // UserInput translations
  typeYourMessage: 'Type your message...',
  send: 'Send',
  // Other translations
  historyCleared: 'History cleared',
  newSessionCreated: 'New session created',
  newSession: 'New session',
  sessionNamePlaceholder: 'Session name',
  // AppInitializer translations
  newSessionGenerated: 'New session generated',
  sessionRetrieved: 'Session retrieved',
  checkingServerHealth: 'Checking server health',
  serverStatus: 'Server status',
  serverOnline: 'Online',
  serverOffline: 'Offline',
  serverHealthCheckFailed: 'Server health check failed',
  tokenLoadedFromEnv: 'Token loaded from environment',
  tokenLoadedFromCookie: 'Token loaded from cookie',
  noTokenFound: 'No token found',
  interfaceInitialized: 'Interface initialized',
  agentReady: 'Agent ready',
  // OAuth Management translations
  oauthManagement: 'OAuth Management',
  oauthManagementDescription: 'Configure your OAuth connections for authentication',
  githubIntegration: 'GitHub Integration',
  googleIntegration: 'Google Integration',
  twitterIntegration: 'Twitter Integration',
  authToken: 'Authentication Token',
  authTokenPlaceholder: 'Enter your Bearer token...',
  saveToken: 'Save Token',
  securityWarning: 'Security Warning',
  oauthSecurityWarning: 'Your OAuth tokens are stored securely and are never exposed on the client side.',
  checkingStatus: 'Checking status...',
  githubConnectionStatus: 'GitHub Connection Status',
  githubConnected: 'Connected to GitHub',
  githubNotConnected: 'Not connected to GitHub',
  googleConnectionStatus: 'Google Connection Status',
  googleConnected: 'Connected to Google',
  googleNotConnected: 'Not connected to Google',
  twitterConnectionStatus: 'Twitter Connection Status',
  twitterConnected: 'Connected to Twitter',
  twitterNotConnected: 'Not connected to Twitter',
  disconnect: 'Disconnect',
  connectGitHub: 'Connect GitHub',
  connectGoogle: 'Connect Google',
  connectTwitter: 'Connect Twitter',
  oauthExplanation: 'OAuth allows you to authenticate securely via third-party providers.',
  // Store translations for API calls
  fetchingToolsList: 'Fetching tools list...',
  toolsFound: 'tools found',
  getToolsError: 'getTools Error',
  error: 'Error',
  // SettingsModal translations
  newTokenSaved: 'New token saved',
  tokenDeleted: 'Token deleted',
  tokenSaved: 'Token saved',
  tokenRemoved: 'Token removed',
};

// Utility function to get translations outside of React components
export const getTranslations = () => {
  const language = localStorage.getItem('language') as 'fr' | 'en' | null;
  const translations = language === 'fr' ? fr : en;
  
  // Defensive check to ensure translations object is valid
  if (!translations || typeof translations !== 'object') {
    console.warn('Translations not found, falling back to English');
    return en;
  }
  
  return translations;
};