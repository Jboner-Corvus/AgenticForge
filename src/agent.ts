/**
 * src/agent.ts (Linted et Corrigé)
 *
 * Ce fichier contient le "cerveau" de l'agent. Il gère la boucle de conversation,
 * interroge le LLM, et exécute les outils. Il peut désormais streamer
 * une vue visuelle du navigateur.
 */
// @ts-expect-error - Contournement pour un problème de résolution de module.
import { Client, StreamableHTTPClientTransport } from 'fastmcp';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import logger from './logger.js';
import type { History } from './types.js'; // 'AuthData' retiré car non utilisé
import { config } from './config.js';

const log = logger.child({ module: 'AgentOrchestrator' });

// Interface et garde de type pour les résultats avec captures d'écran
interface ScreenshotResult {
  message: string;
  screenshots: { step: string; image: string }[];
}

function isScreenshotResult(obj: unknown): obj is ScreenshotResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'screenshots' in obj &&
    'message' in obj &&
    Array.isArray((obj as ScreenshotResult).screenshots)
  );
}

function parseLlmResponse(llmResponse: string): {
  thought: string;
  toolCode: { tool: string; parameters: Record<string, unknown> } | null;
} {
  const thoughtMatch = llmResponse.match(/<thought>([\s\S]*?)<\/thought>/);
  const toolCodeMatch = llmResponse.match(/<tool_code>([\s\S]*?)<\/tool_code>/);

  const thought = thoughtMatch ? thoughtMatch[1].trim() : '';
  let toolCode = null;

  if (toolCodeMatch) {
    try {
      toolCode = JSON.parse(toolCodeMatch[1].trim());
    } catch {
      // Variable '_error' retirée
      log.error(
        { rawToolCode: toolCodeMatch[1] },
        'Failed to parse tool code JSON',
      );
      throw new Error('Invalid tool code JSON format from LLM.');
    }
  }

  return { thought, toolCode };
}

export async function runAgent(
  goal: string,
  streamCallback: (data: Record<string, unknown>) => void,
) {
  const history: History = [{ role: 'user', content: goal }];
  const mcpClient = new Client(
    { name: 'agent-orchestrator-client', version: '1.0.0' },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${config.PORT}/api/v1/agent/stream`),
  );

  try {
    await mcpClient.connect(transport);
    log.info('MCP client connected to tool server.');
    streamCallback({
      type: 'status',
      message: "Connecté au serveur d'outils.",
    });

    for (let i = 0; i < 10; i++) {
      const masterPrompt = getMasterPrompt(history, []);
      streamCallback({
        type: 'status',
        message: 'Génération de la réponse du LLM...',
      });

      const llmResponse = await getLlmResponse(masterPrompt);
      history.push({ role: 'assistant', content: llmResponse });

      const { thought, toolCode } = parseLlmResponse(llmResponse);
      streamCallback({ type: 'thought', content: thought });

      if (!toolCode) {
        const finalMessage =
          "L'agent n'a pas sélectionné d'outil. Fin de la tâche.";
        streamCallback({ type: 'response', content: finalMessage });
        log.warn(finalMessage);
        break;
      }

      streamCallback({
        type: 'tool_call',
        tool: toolCode.tool,
        parameters: toolCode.parameters,
      });

      if (toolCode.tool === 'finish') {
        const finalResponse = toolCode.parameters.response as string;
        streamCallback({ type: 'response', content: finalResponse });
        log.info({ response: finalResponse }, 'Agent finished task.');
        break;
      }

      try {
        const toolResult = await mcpClient.tools.call(
          toolCode.tool,
          toolCode.parameters,
        );

        // Utilisation de la garde de type pour une vérification sûre
        if (isScreenshotResult(toolResult.content)) {
          for (const shot of toolResult.content.screenshots) {
            streamCallback({
              type: 'browser_view',
              step: shot.step,
              image: shot.image,
            });
          }

          const resultMessage = toolResult.content.message;
          history.push({
            role: 'user',
            content: `TOOL_RESULT: ${resultMessage}`,
          });
          streamCallback({ type: 'tool_result', result: resultMessage });
        } else {
          const resultString = JSON.stringify(toolResult.content, null, 2);
          history.push({
            role: 'user',
            content: `TOOL_RESULT: ${resultString}`,
          });
          streamCallback({ type: 'tool_result', result: toolResult.content });
        }
      } catch (error) {
        log.error({ err: error, tool: toolCode.tool }, 'Error executing tool');
        const errorMessage = `Error executing tool ${toolCode.tool}: ${(error as Error).message}`;
        history.push({ role: 'user', content: `TOOL_ERROR: ${errorMessage}` });
        streamCallback({ type: 'error', message: errorMessage });
      }
    }
  } catch (error) {
    log.fatal({ err: error }, 'Agent failed to connect or run.');
    streamCallback({
      type: 'error',
      message: `Erreur fatale de l'agent: ${(error as Error).message}`,
    });
  } finally {
    await mcpClient.disconnect();
    log.info('MCP client disconnected.');
    streamCallback({
      type: 'status',
      message: "Déconnecté du serveur d'outils. Tâche terminée.",
    });
  }
}
