import path from 'path';

import { getRedisClientInstance } from '../modules/redis/redisClient.ts';

export interface Asset {
  content: string;
  filename: string;
  mimeType: string;
}

export interface MultiFileProject {
  assets: Asset[];
  mainFile: string;
  projectType: 'app' | 'game' | 'html' | 'react' | 'vue';
}

/**
 * Génère une URL virtuelle pour un asset
 */
export function generateAssetUrl(jobId: string, filename: string): string {
  return `/api/canvas/assets/${jobId}/${filename}`;
}

/**
 * Détermine le type MIME d'un fichier
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.css': 'text/css',
    '.gif': 'image/gif',
    '.html': 'text/html',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
  };

  return mimeTypes[ext] || 'text/plain';
}

/**
 * Récupère un projet multi-fichiers depuis Redis
 */
export async function getProjectAssets(
  jobId: string,
): Promise<MultiFileProject | null> {
  const projectKey = `project:${jobId}:assets`;
  const redis = getRedisClientInstance();

  const data = await redis.get(projectKey);
  if (!data) return null;

  return JSON.parse(data) as MultiFileProject;
}

/**
 * Traite le contenu HTML pour remplacer les références de fichiers
 * par des URLs virtuelles
 */
export function processHtmlWithAssets(
  html: string,
  jobId: string,
  assets: Asset[],
): string {
  let processedHtml = html;

  // Remplacer les références aux fichiers par des URLs virtuelles
  assets.forEach((asset) => {
    const virtualUrl = generateAssetUrl(jobId, asset.filename);

    // Remplacer les différents types de références
    const patterns = [
      new RegExp(`src=["']${asset.filename}["']`, 'g'),
      new RegExp(`href=["']${asset.filename}["']`, 'g'),
      new RegExp(`url\\(['"]${asset.filename}['"]\\)`, 'g'),
      new RegExp(`"${asset.filename}"`, 'g'),
    ];

    patterns.forEach((pattern) => {
      processedHtml = processedHtml.replace(pattern, (match) => {
        return match.replace(asset.filename, virtualUrl);
      });
    });
  });

  return processedHtml;
}

/**
 * Stocke un projet multi-fichiers dans Redis avec un TTL
 */
export async function storeProjectAssets(
  jobId: string,
  project: MultiFileProject,
): Promise<string> {
  const projectKey = `project:${jobId}:assets`;
  const redis = getRedisClientInstance();

  // Stocker le projet avec un TTL de 1 heure
  await redis.setex(projectKey, 3600, JSON.stringify(project));

  console.log(
    `[ASSETS] Stored project for job ${jobId} with ${project.assets.length} assets`,
  );
  return projectKey;
}
