import type { Tool } from '../types.js';
/**
 * Récupère la liste de tous les outils, en les chargeant s'ils ne le sont pas déjà.
 * C'est la fonction à utiliser dans toute l'application pour garantir une seule source de vérité.
 */
export declare function getTools(): Promise<Tool[]>;
//# sourceMappingURL=toolLoader.d.ts.map
