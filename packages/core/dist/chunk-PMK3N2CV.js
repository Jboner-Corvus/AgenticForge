import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-HKREBWDH.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/utils/assetManager.ts
init_esm_shims();
import path from "path";
function generateAssetUrl(jobId, filename) {
  return `/api/canvas/assets/${jobId}/${filename}`;
}
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".css": "text/css",
    ".gif": "image/gif",
    ".html": "text/html",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "application/javascript",
    ".json": "application/json",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav"
  };
  return mimeTypes[ext] || "text/plain";
}
async function getProjectAssets(jobId) {
  const projectKey = `project:${jobId}:assets`;
  const redis = getRedisClientInstance();
  const data = await redis.get(projectKey);
  if (!data) return null;
  return JSON.parse(data);
}
function processHtmlWithAssets(html, jobId, assets) {
  let processedHtml = html;
  assets.forEach((asset) => {
    const virtualUrl = generateAssetUrl(jobId, asset.filename);
    const patterns = [
      new RegExp(`src=["']${asset.filename}["']`, "g"),
      new RegExp(`href=["']${asset.filename}["']`, "g"),
      new RegExp(`url\\(['"]${asset.filename}['"]\\)`, "g"),
      new RegExp(`"${asset.filename}"`, "g")
    ];
    patterns.forEach((pattern) => {
      processedHtml = processedHtml.replace(pattern, (match) => {
        return match.replace(asset.filename, virtualUrl);
      });
    });
  });
  return processedHtml;
}
async function storeProjectAssets(jobId, project) {
  const projectKey = `project:${jobId}:assets`;
  const redis = getRedisClientInstance();
  await redis.setex(
    projectKey,
    3600,
    JSON.stringify(project)
  );
  console.log(`[ASSETS] Stored project for job ${jobId} with ${project.assets.length} assets`);
  return projectKey;
}

export {
  generateAssetUrl,
  getMimeType,
  getProjectAssets,
  processHtmlWithAssets,
  storeProjectAssets
};
