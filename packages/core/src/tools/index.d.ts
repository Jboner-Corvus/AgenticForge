import type { Tool } from '../types.js';
/**
 * Exporte la fonction de chargement dynamique comme unique source de vérité pour les outils.
 * Toute partie de l'application (serveur, worker) qui a besoin de la liste des outils
 * devra appeler cette fonction.
 */
export declare const getAllTools: () => Promise<Tool<ZodTypeAny, ZodTypeAny>[]>;
export type { Tool };
//# sourceMappingURL=index.d.ts.map
