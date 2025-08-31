// packages/core/src/modules/api/canvasConsoleFeedback.api.ts
import express, { Router } from 'express';

import { getLoggerInstance } from '../../logger.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';

const router: Router = express.Router();

// Route pour recevoir les logs console du canvas
router.post(
  '/api/canvas-console/logs',
  async (req: express.Request, res: express.Response) => {
    try {
      const { logs, jobId, level, filter, limit } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is missing.' });
      }

      if (!Array.isArray(logs)) {
        return res.status(400).json({ error: 'Logs must be an array.' });
      }

      const redisClient = getRedisClientInstance();

      // Filtrer les logs selon les critères
      let filteredLogs = logs;

      if (level) {
        filteredLogs = filteredLogs.filter((log: any) => log.level === level);
      }

      if (filter) {
        const regex = new RegExp(filter, 'i');
        filteredLogs = filteredLogs.filter((log: any) => regex.test(log.message));
      }

      if (limit) {
        filteredLogs = filteredLogs.slice(-limit);
      }

      // Publie les logs filtrés sur le canal Redis pour que l'agent puisse les recevoir
      const channel = `job:${jobId}:events`;
      const message = JSON.stringify({
        result: {
          logs: filteredLogs,
          count: filteredLogs.length,
          level,
          filter,
          limit
        },
        toolName: 'canvas_console_feedback',
        type: 'tool_result',
      });

      await redisClient.publish(channel, message);

      res.status(200).json({
        message: 'Canvas console logs received.',
        count: filteredLogs.length
      });
    } catch (error) {
      getLoggerInstance().error(
        { error },
        'Error handling canvas console logs',
      );
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// Route pour recevoir les résultats des commandes canvas console
router.post(
  '/api/canvas-console/result',
  async (req: express.Request, res: express.Response) => {
    try {
      const { command, result, jobId, error } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is missing.' });
      }

      const redisClient = getRedisClientInstance();

      // Publie le résultat sur le canal Redis
      const channel = `job:${jobId}:events`;
      const message = JSON.stringify({
        result: {
          command,
          result,
          error,
          timestamp: new Date().toISOString()
        },
        toolName: 'canvas_console_feedback',
        type: 'tool_result',
      });

      await redisClient.publish(channel, message);

      res.status(200).json({ message: 'Canvas console result received.' });
    } catch (error) {
      getLoggerInstance().error(
        { error },
        'Error handling canvas console result',
      );
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;