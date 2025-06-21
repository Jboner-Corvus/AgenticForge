/**
 * src/agent.ts (Corrigé - API Client)
 *
 * Ce fichier contient le "cerveau" de l'agent, l'orchestrateur.
 * Il a été corrigé pour utiliser l'API correcte du client MCP.
 */
import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';
import { getMasterPrompt } from './prompts/orchestrator.prompt.js';
import { getLlmResponse } from './utils/llmProvider.js';
import logger from './logger.js';
import type { History } from './types.js';
import { config } from './config.js';

const log = logger.child({ module: 'AgentOrchestrator' });

/**
 * Analyse la réponse du LLM pour extraire le bloc de pensée et le bloc de code d'outil.
 * @param llmResponse La réponse brute du LLM.
 * @returns Un objet contenant la pensée et le code de l'outil.
 */
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
      log.error({ rawToolCode: toolCodeMatch[1] }, 'Failed to parse tool code JSON');
      throw new Error('Invalid tool code JSON format from LLM.');
    }
  }

  return { thought, toolCode };
}

/**
 * Exécute l'objectif de l'utilisateur en orchestrant les appels au LLM et aux outils.
 * @param goal L'objectif initial de l'utilisateur.
 * @param streamCallback Une fonction pour streamer les mises à jour au client.
 */
export async function runAgent(
  goal: string,
  streamCallback: (data: Record<string, unknown>) => void,
) {
  const history: History = [{ role: 'user', content: goal }];
  const mcpClient = new Client({ name: 'agent-orchestrator-client', version: '1.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${config.PORT}/api/v1/agent/stream`),
  );

  try {
    await mcpClient.connect(transport);
    log.info('MCP client connected to tool server.');
    streamCallback({ type: 'status', message: 'Connecté au serveur d\'outils.' });

    for (let i = 0; i < 10; i++) { // Limite de sécurité à 10 itérations
      const masterPrompt = getMasterPrompt(history, []);
      streamCallback({ type: 'status', message: 'Génération de la réponse du LLM...' });

      const llmResponse = await getLlmResponse(masterPrompt);
      history.push({ role: 'assistant', content: llmResponse });

      const { thought, toolCode } = parseLlmResponse(llmResponse);
      streamCallback({ type: 'thought', content: thought });

      if (!toolCode) {
        const finalMessage = "L'agent n'a pas sélectionné d'outil. Fin de la tâche.";
        streamCallback({ type: 'response', content: finalMessage });
        log.warn(finalMessage);
        break;
      }

      streamCallback({ type: 'tool_call', tool: toolCode.tool, parameters: toolCode.parameters });

      if (toolCode.tool === 'finish') {
        const finalResponse = toolCode.parameters.response as string;
        streamCallback({ type: 'response', content: finalResponse });
        log.info({ response: finalResponse }, 'Agent finished task.');
        break;
      }

      try {
        // CORRECTION : Utilisation de `mcpClient.callTool` avec la structure attendue.
        const toolResult = await mcpClient.callTool({
            name: toolCode.tool,
            arguments: toolCode.parameters,
        });
        const resultString = JSON.stringify(toolResult.content, null, 2);
        
        history.push({ role: 'user', content: `TOOL_RESULT: ${resultString}` });
        streamCallback({ type: 'tool_result', result: toolResult.content });

      } catch (error) {
        log.error({ err: error, tool: toolCode.tool }, 'Error executing tool');
        const errorMessage = `Error executing tool ${toolCode.tool}: ${(error as Error).message}`;
        history.push({ role: 'user', content: `TOOL_ERROR: ${errorMessage}` });
        streamCallback({ type: 'error', message: errorMessage });
      }
    }
  } catch (error) {
    log.fatal({ err: error }, 'Agent failed to connect or run.');
    streamCallback({ type: 'error', message: `Erreur fatale de l'agent: ${(error as Error).message}` });
  } finally {
    // CORRECTION : La méthode `disconnect` n'existe pas et a été supprimée.
    // La connexion du transport se ferme automatiquement.
    log.info('MCP client transport will close automatically.');
    streamCallback({ type: 'status', message: 'Déconnecté du serveur d\'outils. Tâche terminée.' });
  }
}
