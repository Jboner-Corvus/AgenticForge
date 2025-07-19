// ATTENTION : Ce fichier définit le registre central (ToolRegistry)
// qui gère tous les outils disponibles pour l'agent.
//
// L'instance unique `toolRegistry` est la source de vérité pour l'ensemble de l'application.
//
// L'enregistrement des outils se fait via la méthode `toolRegistry.register(tool)`.
// Cette opération est généralement effectuée au démarrage de l'application (voir `tools/index.ts`).
//
// CHAQUE OUTIL DOIT AVOIR :
// 1. `name` (string): Un nom unique.
// 2. `description` (string): Une description claire et précise. C'est CRUCIAL, car
//    le LLM se base sur cette description pour décider quel outil utiliser.
// 3. `parameters` (z.object): Un schéma Zod qui valide les paramètres de l'outil.
//    Ce schéma est également fourni au LLM pour qu'il sache comment formater les arguments.
//
// Une description imprécise ou un schéma de paramètres incorrect mènera quasi-certainement
// à des erreurs d'exécution ou à un mauvais choix d'outil par l'agent.

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

    const parsedParams = tool.parameters.parse(params);

    ctx.log.info(
      `Executing tool: ${name} with params: ${JSON.stringify(parsedParams)}`,
    );
    return tool.execute(parsedParams, ctx);
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
