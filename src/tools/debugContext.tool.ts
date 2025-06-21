import { z } from 'zod';
import type { SerializableValue } from 'fastmcp';
import logger from '../logger.js';
import { type Tool, type Ctx } from '../types.js';

const TOOL_NAME = 'correctDebugContextTool';

export const debugContextParams = z.object({
  message: z.string().optional(),
  useClientLogger: z.boolean().optional().default(false),
  userId: z.string().optional(),
});

export type ParamsType = z.infer<typeof debugContextParams>;

export const debugContextTool: Tool<typeof debugContextParams> = {
  name: TOOL_NAME,
  description: "Affiche le contexte d'authentification et de session.",
  parameters: debugContextParams,
  execute: async (args: ParamsType, context: Ctx<typeof debugContextParams>): Promise<string> => {
    if(!context.session) throw new Error("Session not found");
    const authData = context.session.auth;
    const clientLog = context.log;

    const serverLog = logger.child({
      tool: TOOL_NAME,
      clientIp: authData?.clientIp,
      appAuthId: authData?.id,
    });

    const logFn = (data: Record<string, SerializableValue> | string, message?: string) => {
        if (args.useClientLogger && clientLog) {
            clientLog.info(data as any, message);
        } else {
            serverLog.info(data, message);
        }
    };

    let resultMessage = `Rapport de l'Outil de Débogage de Contexte:\n`;
    resultMessage += `UserID (n8n, depuis argument): ${args.userId || 'Non Fourni'}\n`;

    resultMessage += `\n--- Données d'Authentification (context.session.auth) ---\n`;
    if (authData) {
      resultMessage += `Objet context.session.auth présent.\n`;
      resultMessage += `  ID Applicatif: ${authData.id}\n`;
      resultMessage += `  Type d'Auth: ${authData.type}\n`;
      resultMessage += `  IP Client: ${authData.clientIp}\n`;
      resultMessage += `  Timestamp: ${new Date(authData.authenticatedAt).toISOString()}\n`;
      
      // On s'assure que l'objet est sérialisable pour le logger
      const loggableAuthData = { ...authData };
      logFn({ authData: loggableAuthData }, 'Données de session trouvées.');

    } else {
      resultMessage += `context.session.auth est INDÉFINI ou NUL.\n`;
      serverLog.warn('context.session.auth est indéfini ou nul.');
    }

    logFn('Exécution de CorrectDebugContextTool terminée.');
    return resultMessage;
  },
};
