import { T as Tool } from '../types-C2iGLYUf.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'zod';
import 'pg';
import 'pino';

/**
 * Récupère la liste de tous les outils, en les chargeant s'ils ne le sont pas déjà.
 * C'est la fonction à utiliser dans toute l'application pour garantir une seule source de vérité.
 */
declare function getTools(): Promise<Tool[]>;

export { getTools };
