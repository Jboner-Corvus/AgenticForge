import { z } from 'zod';

import { Tool } from '../../../../types.ts';

const AgentThoughtParams = z.object({
  /**
   * La pensée ou réflexion de l'agent
   */
  thought: z.string({
    description:
      "La pensée, réflexion ou raisonnement interne de l'agent. Cette pensée sera affichée comme une bulle de chat dans la conversation pour que l'utilisateur puisse suivre le processus de réflexion de l'agent.",
  }),
});

export const agentThoughtTool: Tool<typeof AgentThoughtParams> = {
  description:
    "Affiche une pensée ou réflexion de l'agent dans les bulles de chat de la conversation. Utilisez cet outil pour partager votre processus de réflexion, vos analyses, ou vos plans avec l'utilisateur de manière transparente.",
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = AgentThoughtParams.parse(params);
    const { thought } = parsedParams;

    try {
      // Log pour debugging
      log.info(`Agent thought: ${thought.substring(0, 100)}${thought.length > 100 ? '...' : ''}`);

      // Ajouter la pensée à l'historique de session
      if (context.session) {
        const thoughtMessage = {
          content: thought,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'agent_thought' as const,
        };

        // Ajouter à l'historique de session
        context.session.history.push(thoughtMessage);
      }

      // Retourner le contenu pour que l'agent puisse le traiter
      return {
        success: true,
        message: 'Pensée affichée dans la conversation',
        thought: thought,
      };
    } catch (error) {
      log.error({ err: error }, 'Error displaying agent thought');
      throw new Error(
        `Failed to display agent thought: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'agent_thought',
  parameters: AgentThoughtParams,
};