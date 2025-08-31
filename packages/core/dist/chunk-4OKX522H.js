import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getMimeType,
  processHtmlWithAssets,
  storeProjectAssets
} from "./chunk-EJC34O7O.js";
import {
  sendToCanvas
} from "./chunk-TKYKZMJX.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/displayCanvas.tool.ts
init_esm_shims();
import { z } from "zod";
var DisplayCanvasParams = z.object({
  /**
   * Le contenu à afficher dans le canvas
   */
  content: z.string({
    description: "Le contenu \xE0 afficher dans le canvas. Pour HTML, inclure le code HTML complet avec styles. Pour Markdown, le texte format\xE9 en Markdown. Pour du texte brut, du texte simple. Pour une URL, l'URL compl\xE8te \xE0 afficher dans une iframe. Pour des projets multi-fichiers, passer un JSON avec mainFile et assets."
  }),
  /**
   * Le type de contenu (html, markdown, text, url, project)
   */
  contentType: z.enum(["html", "markdown", "text", "url", "project"]).optional(),
  /**
   * Titre optionnel pour le canvas
   */
  title: z.string().optional()
});
var displayCanvasTool = {
  description: "\u{1F680} CANVAS \xC9PIQUE - Affiche TOUT dans le canvas ! HTML, Markdown, texte, URLs, jeux complets, apps React, projets multi-fichiers avec JS/CSS/images/sons. D\xE9tection automatique des assets externes et gestion intelligente des projets complexes. Support automatique des r\xE9f\xE9rences de fichiers.",
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = DisplayCanvasParams.parse(params);
    const { content, title } = parsedParams;
    let contentType = parsedParams.contentType || "html";
    if (!job?.id) {
      throw new Error("No job ID available for canvas display");
    }
    try {
      log.info("\u{1F680} \xC9PIQUE CANVAS - Analyse du contenu...");
      let finalContent = content;
      let detectedAssets = [];
      try {
        const parsed = JSON.parse(content);
        if (parsed.thought || parsed.command || parsed.action) {
          log.warn("\u{1F6AB} Contenu de debug filtr\xE9");
          finalContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Contenu Filtr\xE9</h2><p style='color: #6b7280;'>Contenu de debug filtr\xE9 pour s\xE9curit\xE9.</p></div>";
        } else if (parsed.mainFile && parsed.assets) {
          log.info("\u{1F3AE} Projet multi-fichiers d\xE9tect\xE9 !");
          contentType = "project";
          detectedAssets = parsed.assets.map((asset) => ({
            filename: asset.filename,
            content: asset.content,
            mimeType: getMimeType(asset.filename)
          }));
          const project = {
            mainFile: parsed.mainFile,
            assets: detectedAssets,
            projectType: "html"
          };
          await storeProjectAssets(job.id, project);
          finalContent = processHtmlWithAssets(parsed.mainFile, job.id, detectedAssets);
          log.info(`\u2705 Projet stock\xE9 avec ${detectedAssets.length} assets`);
        }
      } catch {
        if (contentType === "html" || !contentType) {
          const fullHtmlMatch = content.match(/<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i);
          if (fullHtmlMatch) {
            finalContent = fullHtmlMatch[0];
            log.info("\u{1F4C4} HTML complet extrait");
          } else {
            const htmlMatch = content.match(/(<[^>]+(?:\/>|[\s\S]*?<\/[^>]+>))+/);
            if (htmlMatch) {
              finalContent = htmlMatch[0];
              log.info("\u{1F527} Fragment HTML extrait");
            }
          }
          const externalRefs = [
            ...finalContent.matchAll(/src=["']([^"']+\.(js|css|png|jpg|jpeg|gif|svg|mp3|wav|ogg))["']/g),
            ...finalContent.matchAll(/href=["']([^"']+\.css)["']/g)
          ];
          if (externalRefs.length > 0) {
            log.warn(`\u26A0\uFE0F  ${externalRefs.length} r\xE9f\xE9rence(s) externe(s) d\xE9tect\xE9e(s):`);
            externalRefs.forEach(([_, filename]) => {
              log.warn(`   - ${filename}`);
            });
            const warningMessage = `
              <div style="position: fixed; top: 10px; right: 10px; background: rgba(255,165,0,0.9); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 9999;">
                \u26A0\uFE0F ${externalRefs.length} fichier(s) externe(s) d\xE9tect\xE9(s)<br>
                Pour un jeu complet, utilisez display_canvas avec un JSON:<br>
                {"mainFile": "html", "assets": [{"filename": "game.js", "content": "..."}]}
              </div>
            `;
            finalContent = finalContent.replace("</body>", warningMessage + "</body>");
          }
        }
        const isDebugContent = content.includes("```json") || content.includes("Tool Call:") || content.includes("Tool Result:") || content.includes("The agent is thinking") && content.length < 100;
        if (isDebugContent) {
          log.warn("\u{1F6AB} Contenu de debug \xE9vident filtr\xE9");
          finalContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Contenu Filtr\xE9</h2><p style='color: #6b7280;'>Contenu de debug filtr\xE9. Utilisez du HTML valide.</p></div>";
        }
      }
      if (title) {
        log.info(`\u{1F3F7}\uFE0F  Titre: ${title}`);
      }
      sendToCanvas(job.id, finalContent, contentType);
      const message = detectedAssets.length > 0 ? `\u2705 \xC9PIQUE ! Projet affich\xE9 avec ${detectedAssets.length} assets` : "\u2705 Contenu affich\xE9 dans le canvas";
      log.info(`\u{1F3A8} ${message} (type: ${contentType})`);
      return {
        success: true,
        message,
        assetsDetected: detectedAssets.length
      };
    } catch (error) {
      log.error({ err: error }, "\u{1F4A5} Erreur canvas \xE9pique");
      throw new Error(
        `Canvas \xE9pique failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "display_canvas",
  parameters: DisplayCanvasParams
};

export {
  displayCanvasTool
};
