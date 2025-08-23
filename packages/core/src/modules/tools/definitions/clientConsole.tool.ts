// packages/core/src/modules/tools/definitions/clientConsole.tool.ts
import { z } from 'zod';

import { Tool } from '../../../types.ts';
import { getRedisClientInstance } from '../../redis/redisClient.ts';

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

export const clientConsoleTool: Tool<any, any> = {
  description:
    'Execute a JavaScript command or predefined action in the client browser console.',
  execute: async (params, context) => {
    const { args = [], command } = params;
    const { job, session } = context;
    const redisClient = getRedisClientInstance();

    // Gestion des commandes d'aide
    if (command === 'help') {
      if (args.length > 0 && args[0] in HELP_COMMANDS) {
        // Aide spécifique à une commande
        return {
          output: `Aide pour '${args[0]}': ${HELP_COMMANDS[args[0] as keyof typeof HELP_COMMANDS]}`,
        };
      } else {
        // Aide générale
        return { output: generateHelpText() };
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

    if (!job) {
      return {
        args: args,
        command: command,
        status: 'Error: Job context is missing. Cannot send command to client.',
      };
    }

    // Envoyer la commande au frontend via SSE
    const channel = `job:${job.id}:events`;
    const message = JSON.stringify({
      args: args,
      content: jsCommand,
      originalCommand: command,
      type: 'execute_client_command',
    });

    await redisClient.publish(channel, message);

    return {
      args: args,
      command: command,
      status: 'Command sent to client. Awaiting result...',
    };
  },
  name: 'client_console',
  parameters: z.object({
    args: z
      .array(z.string())
      .optional()
      .describe('Optional arguments for the command.'),
    command: z
      .string()
      .describe(
        'The JavaScript command to execute or a predefined action (e.g., "help", "ls", "url").',
      ),
  }),
};
