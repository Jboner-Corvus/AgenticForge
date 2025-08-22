import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-SIBAPVHV.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/clientConsole.tool.ts
init_esm_shims();
import { z } from "zod";
var HELP_COMMANDS = {
  help: "Affiche cette aide.",
  ls: "Liste les propri\xE9t\xE9s de l'objet window.",
  url: "Affiche l'URL actuelle de la page.",
  title: "Affiche le titre de la page.",
  screenshot: "Capture d'\xE9cran de la page (simulation).",
  cookies: "Affiche les cookies de la page (noms seulement).",
  storage: "Affiche les cl\xE9s du localStorage (noms seulement).",
  performance: "Affiche des m\xE9triques de performance basiques."
};
function generateHelpText() {
  let helpText = "Commandes de la console client disponibles :\n";
  for (const [cmd, desc] of Object.entries(HELP_COMMANDS)) {
    helpText += `  ${cmd}: ${desc}
`;
  }
  helpText += "\nUtilisez 'help <command>' pour plus de d\xE9tails sur une commande sp\xE9cifique.";
  return helpText;
}
var clientConsoleTool = {
  name: "client_console",
  description: "Execute a JavaScript command or predefined action in the client browser console.",
  parameters: z.object({
    command: z.string().describe('The JavaScript command to execute or a predefined action (e.g., "help", "ls", "url").'),
    args: z.array(z.string()).optional().describe("Optional arguments for the command.")
  }),
  execute: async (params, context) => {
    const { command, args = [] } = params;
    const { job, session } = context;
    const redisClient = getRedisClientInstance();
    if (command === "help") {
      if (args.length > 0 && args[0] in HELP_COMMANDS) {
        return { output: `Aide pour '${args[0]}': ${HELP_COMMANDS[args[0]]}` };
      } else {
        return { output: generateHelpText() };
      }
    }
    let jsCommand = command;
    switch (command) {
      case "ls":
        jsCommand = "Object.keys(window)";
        break;
      case "url":
        jsCommand = "window.location.href";
        break;
      case "title":
        jsCommand = "document.title";
        break;
      case "screenshot":
        jsCommand = '"Screenshot captured (simulated)"';
        break;
      case "cookies":
        jsCommand = 'document.cookie.split(";").map(c => c.trim().split("=")[0])';
        break;
      case "storage":
        jsCommand = "Object.keys(localStorage)";
        break;
      case "performance":
        jsCommand = "({loadTime: performance.loadEventEnd - performance.navigationStart, domContentLoaded: performance.domContentLoadedEventEnd - performance.navigationStart})";
        break;
      default:
        break;
    }
    if (!job) {
      return {
        status: "Error: Job context is missing. Cannot send command to client.",
        command,
        args
      };
    }
    const channel = `job:${job.id}:events`;
    const message = JSON.stringify({
      type: "execute_client_command",
      content: jsCommand,
      originalCommand: command,
      args
    });
    await redisClient.publish(channel, message);
    return {
      status: "Command sent to client. Awaiting result...",
      command,
      args
    };
  }
};

export {
  clientConsoleTool
};
