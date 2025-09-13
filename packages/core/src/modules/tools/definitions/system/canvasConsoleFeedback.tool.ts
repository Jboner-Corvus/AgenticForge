import { z } from 'zod';
import { Tool } from '../../../../types.ts';
import { getRedisClientInstance } from '../../../redis/redisClient.ts';

const CanvasConsoleFeedbackParams = z.object({
  /**
   * Action à effectuer (get_logs, clear_logs, enable_capture, disable_capture)
   */
  action: z
    .enum(['get_logs', 'clear_logs', 'enable_capture', 'disable_capture'])
    .optional()
    .default('get_logs'),

  /**
   * Filtre par niveau de log (log, error, warn, info, debug)
   */
  level: z.enum(['log', 'error', 'warn', 'info', 'debug']).optional(),

  /**
   * Nombre maximum de logs à récupérer
   */
  limit: z.number().min(1).max(100).optional().default(50),

  /**
   * Filtre par pattern dans le message
   */
  filter: z.string().optional(),
});

export const canvasConsoleFeedbackTool: Tool<
  typeof CanvasConsoleFeedbackParams
> = {
  description:
    '🔍 CANVAS CONSOLE FEEDBACK - Obtient les logs console du canvas pour debugging frontend. Permet de récupérer, filtrer et gérer les logs console du contenu affiché dans le canvas.',
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = CanvasConsoleFeedbackParams.parse(params);
    const { action = 'get_logs', level, limit = 50, filter } = parsedParams;

    if (!job?.id) {
      throw new Error('No job ID available for canvas console feedback');
    }

    const redisClient = getRedisClientInstance();

    try {
      log.info(`🔍 Canvas Console Feedback - Action: ${action}`);

      // Créer le message pour le frontend
      const message = JSON.stringify({
        type: 'canvas_console_feedback',
        action,
        level,
        limit,
        filter,
        timestamp: Date.now(),
        toolName: 'canvas_console_feedback',
      });

      // Envoyer la commande au frontend via Redis
      const channel = `job:${job.id}:events`;
      await redisClient.publish(channel, message);

      let responseMessage = '';
      switch (action) {
        case 'get_logs':
          responseMessage = `📋 Récupération des logs console${level ? ` (niveau: ${level})` : ''}${filter ? ` (filtre: ${filter})` : ''}`;
          break;
        case 'clear_logs':
          responseMessage = '🧹 Logs console effacés';
          break;
        case 'enable_capture':
          responseMessage = '🎯 Capture console activée';
          break;
        case 'disable_capture':
          responseMessage = '⏸️ Capture console désactivée';
          break;
      }

      log.info(`✅ ${responseMessage}`);

      return {
        success: true,
        message: responseMessage,
        data: {
          action,
          level,
          limit,
          filter,
        },
      };
    } catch (error) {
      log.error({ err: error }, '💥 Erreur canvas console feedback');
      throw new Error(
        `Canvas console feedback failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'canvas_console_feedback',
  parameters: CanvasConsoleFeedbackParams,
};
