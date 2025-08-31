import { z } from 'zod';

import { Tool } from '../../../../types.ts';
import { sendToCanvas } from '../../../../utils/canvasUtils.ts';
import { 
  storeProjectAssets, 
  processHtmlWithAssets, 
  getMimeType,
  type Asset,
  type MultiFileProject 
} from '../../../../utils/assetManager.ts';

const DisplayCanvasParams = z.object({
  /**
   * Le contenu à afficher dans le canvas
   */
  content: z.string({
    description:
      "Le contenu à afficher dans le canvas. Pour HTML, inclure le code HTML complet avec styles. Pour Markdown, le texte formaté en Markdown. Pour du texte brut, du texte simple. Pour une URL, l'URL complète à afficher dans une iframe. Pour des projets multi-fichiers, passer un JSON avec mainFile et assets.",
  }),

  /**
   * Le type de contenu (html, markdown, text, url, project)
   */
  contentType: z.enum(['html', 'markdown', 'text', 'url', 'project']).optional(),

  /**
   * Titre optionnel pour le canvas
   */
  title: z.string().optional(),
});

export const displayCanvasTool: Tool<typeof DisplayCanvasParams> = {
  description:
    "🚀 CANVAS ÉPIQUE - Affiche TOUT dans le canvas ! HTML, Markdown, texte, URLs, jeux complets, apps React, projets multi-fichiers avec JS/CSS/images/sons. Détection automatique des assets externes et gestion intelligente des projets complexes. Support automatique des références de fichiers.",
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = DisplayCanvasParams.parse(params);
    const { content, title } = parsedParams;
    let contentType = parsedParams.contentType || 'html';

    if (!job?.id) {
      throw new Error('No job ID available for canvas display');
    }

    try {
      log.info('🚀 ÉPIQUE CANVAS - Analyse du contenu...');
      
      // 🎯 DÉTECTION AUTOMATIQUE DU TYPE ET DES ASSETS
      let finalContent = content;
      let detectedAssets: Asset[] = [];

      // 1. Vérifier si c'est un projet multi-fichiers (JSON)
      try {
        const parsed = JSON.parse(content);
        
        // Filtrer le debug JSON
        if (parsed.thought || parsed.command || parsed.action) {
          log.warn('🚫 Contenu de debug filtré');
          finalContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Contenu Filtré</h2><p style='color: #6b7280;'>Contenu de debug filtré pour sécurité.</p></div>";
        }
        // Détecter un projet multi-fichiers
        else if (parsed.mainFile && parsed.assets) {
          log.info('🎮 Projet multi-fichiers détecté !');
          contentType = 'project';
          
          // Traiter les assets
          detectedAssets = parsed.assets.map((asset: any) => ({
            filename: asset.filename,
            content: asset.content,
            mimeType: getMimeType(asset.filename)
          }));

          // Stocker le projet
          const project: MultiFileProject = {
            mainFile: parsed.mainFile,
            assets: detectedAssets,
            projectType: 'html'
          };
          
          await storeProjectAssets(job.id, project);
          
          // Traiter le HTML principal
          finalContent = processHtmlWithAssets(parsed.mainFile, job.id, detectedAssets);
          
          log.info(`✅ Projet stocké avec ${detectedAssets.length} assets`);
        }
      } catch {
        // 2. Si pas JSON, analyser le HTML pour détecter les références externes
        if (contentType === 'html' || !contentType) {
          
          // Extraire HTML propre depuis du contenu conversationnel
          const fullHtmlMatch = content.match(/<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i);
          if (fullHtmlMatch) {
            finalContent = fullHtmlMatch[0];
            log.info('📄 HTML complet extrait');
          } else {
            const htmlMatch = content.match(/(<[^>]+(?:\/>|[\s\S]*?<\/[^>]+>))+/);
            if (htmlMatch) {
              finalContent = htmlMatch[0];
              log.info('🔧 Fragment HTML extrait');
            }
          }

          // 🔍 DÉTECTION INTELLIGENTE DES ASSETS MANQUANTS
          const externalRefs = [
            ...finalContent.matchAll(/src=["']([^"']+\.(js|css|png|jpg|jpeg|gif|svg|mp3|wav|ogg))["']/g),
            ...finalContent.matchAll(/href=["']([^"']+\.css)["']/g)
          ];

          if (externalRefs.length > 0) {
            log.warn(`⚠️  ${externalRefs.length} référence(s) externe(s) détectée(s):`);
            externalRefs.forEach(([_, filename]) => {
              log.warn(`   - ${filename}`);
            });
            
            // Ajouter un message d'aide dans le HTML
            const warningMessage = `
              <div style="position: fixed; top: 10px; right: 10px; background: rgba(255,165,0,0.9); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 9999;">
                ⚠️ ${externalRefs.length} fichier(s) externe(s) détecté(s)<br>
                Pour un jeu complet, utilisez display_canvas avec un JSON:<br>
                {"mainFile": "html", "assets": [{"filename": "game.js", "content": "..."}]}
              </div>
            `;
            finalContent = finalContent.replace('</body>', warningMessage + '</body>');
          }
        }
        
        // Filtrer le contenu de debug évident
        const isDebugContent = 
          content.includes('```json') ||
          content.includes('Tool Call:') ||
          content.includes('Tool Result:') ||
          (content.includes('The agent is thinking') && content.length < 100);

        if (isDebugContent) {
          log.warn('🚫 Contenu de debug évident filtré');
          finalContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Contenu Filtré</h2><p style='color: #6b7280;'>Contenu de debug filtré. Utilisez du HTML valide.</p></div>";
        }
      }

      // 🚀 ENVOYER AU CANVAS
      if (title) {
        log.info(`🏷️  Titre: ${title}`);
      }

      sendToCanvas(job.id, finalContent, contentType);
      
      const message = detectedAssets.length > 0 
        ? `✅ ÉPIQUE ! Projet affiché avec ${detectedAssets.length} assets`
        : '✅ Contenu affiché dans le canvas';
        
      log.info(`🎨 ${message} (type: ${contentType})`);

      return {
        success: true,
        message,
        assetsDetected: detectedAssets.length
      };

    } catch (error) {
      log.error({ err: error }, '💥 Erreur canvas épique');
      throw new Error(
        `Canvas épique failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: 'display_canvas',
  parameters: DisplayCanvasParams,
};
