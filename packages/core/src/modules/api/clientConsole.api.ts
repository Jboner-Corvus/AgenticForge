// packages/core/src/modules/api/clientConsole.api.ts
import express, { Router } from 'express';

import { getLoggerInstance } from '../../logger.ts';
import { getRedisClientInstance } from '../redis/redisClient.ts';

const router: Router = express.Router();

// Commandes d'aide prédéfinies
const HELP_COMMANDS = {
  cookies: 'Affiche les cookies de la page (noms seulement).',
  help: 'Affiche cette aide.',
  ls: "Liste les propriétés de l'objet window.",
  performance: 'Affiche des métriques de performance basiques.',
  screenshot: "Capture d'écran de la page (simulation).",
  storage: 'Affiche les clés du localStorage (noms seulement).',
  title: 'Affiche le titre de la page.',
  url: "Affiche l'URL actuelle de la page.",
};

// Fonction pour générer le texte d'aide
function generateHelpText(): string {
  let helpText = 'Commandes de la console client disponibles :\n';
  for (const [cmd, desc] of Object.entries(HELP_COMMANDS)) {
    helpText += `  ${cmd}: ${desc}\n`;
  }
  helpText +=
    "\nUtilisez 'help <command>' pour plus de détails sur une commande spécifique.";
  return helpText;
}

// Route pour envoyer une commande à la console client
router.post(
  '/api/client-console/execute',
  async (req: express.Request, res: express.Response) => {
    try {
      const { args = [], command, jobId } = req.body;
      const sessionId = req.headers['x-session-id'] as string;

      if (!jobId || !command) {
        return res.status(400).json({ error: 'Missing jobId or command' });
      }

      // Gestion des commandes d'aide
      if (command === 'help') {
        if (args.length > 0 && args[0] in HELP_COMMANDS) {
          // Aide spécifique à une commande
          return res.json({
            output: `Aide pour '${args[0]}': ${HELP_COMMANDS[args[0] as keyof typeof HELP_COMMANDS]}`,
          });
        } else {
          // Aide générale
          return res.json({ output: generateHelpText() });
        }
      }

      let jsCommand = command;

      // Gestion des commandes prédéfinies
      switch (command) {
        case 'cookies':
          jsCommand =
            'document.cookie.split(";").map(c => c.trim().split("=")[0])';
          break;
        case 'ls':
          jsCommand = 'Object.keys(window)';
          break;
        case 'performance':
          jsCommand =
            '({loadTime: performance.loadEventEnd - performance.navigationStart, domContentLoaded: performance.domContentLoadedEventEnd - performance.navigationStart})';
          break;
        case 'screenshot':
          // Simulation d'une capture d'écran
          jsCommand = '"Screenshot captured (simulated)"';
          break;
        case 'storage':
          jsCommand = 'Object.keys(localStorage)';
          break;
        case 'title':
          jsCommand = 'document.title';
          break;
        case 'url':
          jsCommand = 'window.location.href';
          break;
        default:
          // Si ce n'est pas une commande prédéfinie, on l'exécute telle quelle
          // Le frontend devra gérer l'exécution avec eval
          break;
      }

      const redisClient = getRedisClientInstance();

      // Envoyer la commande au frontend via SSE
      const channel = `job:${jobId}:events`;
      const message = JSON.stringify({
        args: args,
        content: jsCommand,
        originalCommand: command,
        type: 'execute_client_command',
      });

      await redisClient.publish(channel, message);

      res.json({
        args: args,
        command: command,
        status: 'Command sent to client. Awaiting result...',
      });
    } catch (error) {
      getLoggerInstance().error(
        { error },
        'Error executing client console command',
      );
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// Route pour recevoir les résultats de la console client
router.post(
  '/api/client-console/result',
  async (req: express.Request, res: express.Response) => {
    try {
      const { command, error, jobId, result } = req.body;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is missing.' });
      }

      const redisClient = getRedisClientInstance();

      // Publie le résultat sur le canal Redis pour que l'agent qui a envoyé la commande puisse le recevoir
      const channel = `job:${jobId}:events`;
      const message = JSON.stringify({
        result: {
          command_executed: command,
          error: error,
          output: result,
        },
        toolName: 'client_console',
        type: 'tool_result',
      });

      await redisClient.publish(channel, message);

      res.status(200).json({ message: 'Result received.' });
    } catch (error) {
      getLoggerInstance().error(
        { error },
        'Error handling client console result',
      );
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
