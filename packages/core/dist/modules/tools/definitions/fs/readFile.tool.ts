import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { config } from '../../../../config.ts'; // Import config
import { Ctx, Tool } from '../../../../types.ts';

export const readFileParams = z.object({
  end_line: z
    .number()
    .int()
    .positive()
    .max(100000, 'Ligne de fin trop élevée (max 100000)')
    .optional()
    .describe('The line number to stop reading at (inclusive).'),
  path: z
    .string()
    .min(1, 'Le chemin ne peut pas être vide')
    .max(500, 'Le chemin ne peut pas dépasser 500 caractères')
    .refine(
      (path) => !path.includes('..'),
      'Le chemin ne peut pas contenir ".." pour des raisons de sécurité',
    )
    .refine(
      (path) => !/[<>:"|?*\x00-\x1f]/.test(path),
      'Le chemin contient des caractères invalides',
    )
    .describe('The path to the file inside the workspace or AgenticForge directory.'),
  start_line: z
    .number()
    .int()
    .positive()
    .max(100000, 'Ligne de début trop élevée (max 100000)')
    .optional()
    .describe('The line number to start reading from (1-indexed).'),
});

export const readFileOutput = z.union([
  z.string(),
  z.object({
    erreur: z.string(),
  }),
]);

export const readFileTool: Tool<typeof readFileParams, typeof readFileOutput> = {
  description:
    'Reads the content of a file from the workspace or AgenticForge directory. Use this to "open", "view", or "check" a file.',
  execute: async (args: z.infer<typeof readFileParams>, ctx: Ctx) => {
    // Validation des paramètres de lignes
    if (args.start_line && args.end_line && args.start_line > args.end_line) {
      return {
        erreur: 'La ligne de début ne peut pas être supérieure à la ligne de fin',
      };
    }

    // Try to resolve the path in the workspace first
    let resolvedPath = path.resolve(path.join(config.WORKSPACE_PATH, args.path));
    let pathFound = false;
    
    // If not found in workspace, try in the AgenticForge directory
    try {
      await fs.access(resolvedPath);
      pathFound = true;
    } catch {
      const agenticForgePath = path.resolve(path.join(config.HOST_PROJECT_PATH, args.path));
      try {
        await fs.access(agenticForgePath);
        resolvedPath = agenticForgePath;
        pathFound = true;
      } catch {
        // File not found in either location, will be handled later
      }
    }

    // Final security check - ensure the path is within allowed directories
    const workspaceResolved = path.resolve(config.WORKSPACE_PATH);
    const hostProjectResolved = path.resolve(config.HOST_PROJECT_PATH);
    const isAllowedPath = 
      resolvedPath.startsWith(workspaceResolved) || 
      resolvedPath.startsWith(hostProjectResolved);
      
    if (!isAllowedPath) {
      return {
        erreur: 'Chemin de fichier en dehors des répertoires autorisés (workspace ou AgenticForge).',
      };
    }

    try {
      // Vérifier la taille du fichier avant la lecture
      const stats = await fs.stat(resolvedPath);
      const maxFileSize = 100 * 1024 * 1024; // 100MB max
      
      if (stats.size > maxFileSize) {
        return {
          erreur: `Fichier trop volumineux (${Math.round(stats.size / 1024 / 1024)}MB). Taille maximale: ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        };
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');
      ctx.log.info(`Successfully read file: ${args.path} (${stats.size} bytes)`);

      // Logique pour extraire une plage de lignes
      if (args.start_line !== undefined) {
        const lines = content.split('\n');
        const totalLines = lines.length;
        
        if (args.start_line > totalLines) {
          return {
            erreur: `Ligne de début (${args.start_line}) supérieure au nombre total de lignes (${totalLines})`,
          };
        }
        
        const start = Math.max(0, args.start_line - 1);
        const end = Math.min(totalLines, args.end_line ?? start + 1);
        const snippet = lines.slice(start, end).join('\n');
        
        ctx.log.info(`Extracted lines ${args.start_line} to ${end} from ${args.path}`);
        return snippet;
      }

      // Protection contre les fichiers très volumineux en sortie
      if (content.length > 5 * 1024 * 1024) { // 5MB de contenu texte
        const preview = content.substring(0, 5 * 1024 * 1024);
        ctx.log.warn(`File too large for full display, showing first 5MB of ${args.path}`);
        return preview + '\n\n[... Fichier tronqué - trop volumineux pour affichage complet ...]';
      }

      return content;
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      let errorMessage = 'Erreur inconnue lors de la lecture du fichier';
      
      if (nodeError.code === 'ENOENT') {
        errorMessage = `Fichier non trouvé: ${args.path}`;
      } else if (nodeError.code === 'EACCES') {
        errorMessage = 'Permission refusée pour lire le fichier';
      } else if (nodeError.code === 'EISDIR') {
        errorMessage = 'Le chemin spécifié est un répertoire, pas un fichier';
      } else if (nodeError.code === 'EMFILE' || nodeError.code === 'ENFILE') {
        errorMessage = 'Trop de fichiers ouverts simultanément';
      } else if (nodeError.message) {
        errorMessage = `Erreur de lecture: ${nodeError.message}`;
      }
      
      ctx.log.error({ err: error }, `Failed to read file: ${args.path}`);
      return { erreur: errorMessage };
    }
  },
  name: 'readFile',
  parameters: readFileParams,
};