/**
 * Codes de couleur ANSI pour la journalisation thématique.
 * Utilisés pour améliorer la lisibilité des logs en console.
 */
export declare const ANSI_COLORS: {
  BLUE: string;
  CYAN: string;
  GREEN: string;
  LIGHT_BLUE: string;
  MAGENTA: string;
  RED: string;
  RESET: string;
  YELLOW: string;
};
/**
 * Nom de la variable d'environnement pour le secret de signature des webhooks.
 * Ce secret est utilisé pour générer et vérifier les signatures HMAC des webhooks.
 */
export declare const WEBHOOK_SIGNATURE_HEADER = 'X-Webhook-Signature-256';
export declare const WEBHOOK_SECRET_ENV_VAR = 'WEBHOOK_SECRET';
/**
 * Durée maximale de la trace de la pile (stack trace) dans les logs d'erreur.
 * Permet de limiter la verbosité tout en conservant des informations utiles.
 */
export declare const ERROR_STACK_TRACE_MAX_LENGTH = 250;
/**
 * Options par défaut pour la file d'attente BullMQ.
 * Utilisées pour configurer les tentatives, le backoff, et la suppression des tâches.
 */
export declare const DEFAULT_BULLMQ_JOB_OPTIONS: {
  attempts: number;
  backoff: {
    delay: number;
    type: string;
  };
  removeOnComplete: {
    age: number;
    count: number;
  };
  removeOnFail: {
    age: number;
    count: number;
  };
};
/**
 * Noms des files d'attente BullMQ.
 */
export declare const TASK_QUEUE_NAME = 'async-tasks';
export declare const DEAD_LETTER_QUEUE_NAME = 'dead-letter-tasks';
/**
 * Configuration par défaut pour le mécanisme de ping de FastMCP.
 */
export declare const DEFAULT_PING_OPTIONS: {
  enabled: boolean;
  intervalMs: number;
  logLevel: 'debug';
};
/**
 * Configuration par défaut pour le health check de FastMCP.
 */
export declare const DEFAULT_HEALTH_CHECK_OPTIONS: {
  enabled: boolean;
  message: string;
  path: string;
  status: number;
};
//# sourceMappingURL=constants.d.ts.map
