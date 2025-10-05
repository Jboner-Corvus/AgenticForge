import { LogRotationConfig } from './workerLogger';

// Configuration par défaut pour les logs des workers
export const DEFAULT_WORKER_LOG_CONFIG: LogRotationConfig = {
  maxSize: '50MB',     // Taille maximale du fichier de log
  maxFiles: 10,        // Nombre maximal de fichiers à conserver
  interval: '1h'       // Intervalle de vérification pour la rotation
};

// Configuration pour les logs des workers de type "process-message"
export const PROCESS_MESSAGE_LOG_CONFIG: LogRotationConfig = {
  maxSize: '50MB',
  maxFiles: 10,
  interval: '1h'
};

// Configuration pour les logs des workers de type "execute-shell-command-detached"
export const DETACHED_COMMAND_LOG_CONFIG: LogRotationConfig = {
  maxSize: '10MB',
  maxFiles: 5,
  interval: '30m'
};

// Configuration pour les logs des workers en environnement de développement
export const DEV_WORKER_LOG_CONFIG: LogRotationConfig = {
  maxSize: '20MB',
  maxFiles: 5,
  interval: '15m'
};

// Configuration pour les logs des workers en environnement de production
export const PROD_WORKER_LOG_CONFIG: LogRotationConfig = {
  maxSize: '100MB',
  maxFiles: 20,
  interval: '2h'
};

// Fonction pour obtenir la configuration appropriée selon le type de job et l'environnement
export function getWorkerLogConfig(jobType: string, nodeEnv?: string): LogRotationConfig {
  const env = nodeEnv || process.env.NODE_ENV || 'development';
  
  // Pour les jobs spécifiques, utiliser leur configuration
  if (jobType === 'execute-shell-command-detached') {
    return DETACHED_COMMAND_LOG_CONFIG;
  }
  
  // Pour le job process-message, utiliser la configuration selon l'environnement
  if (jobType === 'process-message') {
    if (env === 'development') {
      return DEV_WORKER_LOG_CONFIG;
    } else if (env === 'production') {
      // Toujours retourner PROD_WORKER_LOG_CONFIG pour process-message en production
      return PROD_WORKER_LOG_CONFIG;
    }
  }
  
  // Pour les jobs inconnus, utiliser la configuration par défaut
  return DEFAULT_WORKER_LOG_CONFIG;
}

// Niveaux de log par environnement
export const DEFAULT_LOG_LEVELS = {
  development: 'debug',
  test: 'warn',
  staging: 'info',
  production: 'info'
} as const;

// Fonction pour obtenir le niveau de log approprié selon l'environnement
export function getWorkerLogLevel(nodeEnv?: string): string {
  const env = nodeEnv || process.env.NODE_ENV || 'development';
  return process.env.WORKER_LOG_LEVEL || DEFAULT_LOG_LEVELS[env as keyof typeof DEFAULT_LOG_LEVELS] || 'info';
}