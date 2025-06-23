// src/tools/index.ts
// Ce fichier est maintenant le point d'entrée unique pour obtenir tous les outils dynamiquement.

import { getTools } from '../utils/toolLoader.js';
import type { Tool } from '../types.js';

/**
 * Exporte la fonction de chargement dynamique comme unique source de vérité pour les outils.
 * Toute partie de l'application (serveur, worker) qui a besoin de la liste des outils
 * devra appeler cette fonction.
 */
export const getAllTools = getTools;

// Exporter le type Tool pour la commodité des autres fichiers.
export type { Tool };
