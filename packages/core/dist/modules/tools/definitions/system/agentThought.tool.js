import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/system/agentThought.tool.ts
init_esm_shims();
import { z } from "zod";
var AgentThoughtParams = z.object({
  /**
   * La pensée ou réflexion de l'agent
   */
  thought: z.string({
    description: "La pens\xE9e, r\xE9flexion ou raisonnement interne de l'agent. Cette pens\xE9e sera affich\xE9e comme une bulle de chat dans la conversation pour que l'utilisateur puisse suivre le processus de r\xE9flexion de l'agent."
  })
});
var agentThoughtTool = {
  description: "Affiche une pens\xE9e ou r\xE9flexion de l'agent dans les bulles de chat de la conversation. Utilisez cet outil pour partager votre processus de r\xE9flexion, vos analyses, ou vos plans avec l'utilisateur de mani\xE8re transparente.",
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = AgentThoughtParams.parse(params);
    const { thought } = parsedParams;
    try {
      log.info(`Agent thought: ${thought.substring(0, 100)}${thought.length > 100 ? "..." : ""}`);
      if (context.session) {
        const thoughtMessage = {
          content: thought,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "agent_thought"
        };
        context.session.history.push(thoughtMessage);
      }
      return {
        success: true,
        message: "Pens\xE9e affich\xE9e dans la conversation",
        thought
      };
    } catch (error) {
      log.error({ err: error }, "Error displaying agent thought");
      throw new Error(
        `Failed to display agent thought: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "agent_thought",
  parameters: AgentThoughtParams
};
export {
  agentThoughtTool
};
