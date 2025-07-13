import { z } from 'zod';

import logger from './logger.js';
import { Ctx, Tool } from './types.js';
import { UserError } from './utils/errorUtils.js';

class ToolRegistry {
  private static instance: ToolRegistry;
  private readonly tools = new Map<string, Tool>();

  // Le constructeur est privé pour forcer l'utilisation de getInstance
  private constructor() {}

  /**
   * Récupère l'instance unique (singleton) du registre.
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Exécute un outil par son nom.
   * @param name - Le nom de l'outil à exécuter.
   * @param params - Les paramètres pour l'outil.
   * @param ctx - Le contexte d'exécution.
   * @returns Le résultat de l'exécution de l'outil.
   */
  public async execute(
    name: string,
    params: unknown,
    ctx: Ctx,
  ): Promise<unknown> {
    const tool = this.get(name);
    if (!tool) {
      throw new UserError(`Tool not found: ${name}`);
    }
    ctx.log.info(
      `Executing tool: ${name} with params: ${JSON.stringify(params)}`,
    );
    return tool.execute(params as z.infer<typeof tool.parameters>, ctx);
  }

  /**
   * Récupère un outil par son nom.
   * @param name - Le nom de l'outil.
   * @returns L'outil ou undefined s'il n'est pas trouvé.
   */
  public get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Récupère tous les outils enregistrés.
   * @returns Un tableau de tous les outils.
   */
  public getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Enregistre un nouvel outil.
   * @param tool - L'outil à ajouter.
   */
  public register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(
        `Tool with name "${tool.name}" is already registered. Overwriting.`,
      );
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Désenregistre un outil par son nom.
   * @param name - Le nom de l'outil à retirer.
   */
  public unregister(name: string): void {
    if (this.tools.delete(name)) {
      logger.info(`Outil désenregistré : "${name}"`);
    } else {
      logger.warn(`Tentative de désenregistrer un outil inconnu : "${name}"`);
    }
  }
}

// Exporte l'instance unique du registre
export const toolRegistry = ToolRegistry.getInstance();
