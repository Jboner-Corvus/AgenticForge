import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getMimeType,
  processHtmlWithAssets,
  storeProjectAssets
} from "./chunk-DSZRXZPL.js";
import {
  sendToCanvas
} from "./chunk-ZGIQ2CRB.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/displayCanvas.tool.ts
init_esm_shims();
import { z } from "zod";
var CONSOLE_CAPTURE_SCRIPT = `
<script>
(function() {
  'use strict';

  // Stockage des logs console
  window.canvasConsoleLogs = [];
  window.canvasConsoleCaptureEnabled = true;

  // Fonction pour envoyer les logs au parent
  function sendToParent(logEntry) {
    try {
      window.parent.postMessage({
        type: 'canvas_console_log',
        data: logEntry,
        timestamp: Date.now()
      }, '*');
    } catch (error) {
      // Fallback si postMessage \xE9choue
      console.warn('[Canvas Console] Failed to send log to parent:', error);
    }
  }

  // Fonction pour cr\xE9er une entr\xE9e de log
  function createLogEntry(level, args) {
    return {
      level: level,
      message: args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      timestamp: new Date().toISOString(),
      stack: level === 'error' ? new Error().stack : undefined
    };
  }

  // Interception de console.log
  const originalLog = console.log;
  console.log = function(...args) {
    const logEntry = createLogEntry('log', args);
    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
    originalLog.apply(console, args);
  };

  // Interception de console.error
  const originalError = console.error;
  console.error = function(...args) {
    const logEntry = createLogEntry('error', args);
    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
    originalError.apply(console, args);
  };

  // Interception de console.warn
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const logEntry = createLogEntry('warn', args);
    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
    originalWarn.apply(console, args);
  };

  // Interception de console.info
  const originalInfo = console.info;
  console.info = function(...args) {
    const logEntry = createLogEntry('info', args);
    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
    originalInfo.apply(console, args);
  };

  // Interception de console.debug
  const originalDebug = console.debug;
  console.debug = function(...args) {
    const logEntry = createLogEntry('debug', args);
    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
    originalDebug.apply(console, args);
  };

  // Fonctions utilitaires pour le contr\xF4le de la capture
  window.enableCanvasConsoleCapture = function() {
    window.canvasConsoleCaptureEnabled = true;
    console.log('[Canvas Console] Capture enabled');
  };

  window.disableCanvasConsoleCapture = function() {
    window.canvasConsoleCaptureEnabled = false;
    console.log('[Canvas Console] Capture disabled');
  };

  window.clearCanvasConsoleLogs = function() {
    window.canvasConsoleLogs = [];
    console.log('[Canvas Console] Logs cleared');
  };

  window.getCanvasConsoleLogs = function(filter, limit) {
    let logs = window.canvasConsoleLogs;

    if (filter && filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter && filter.pattern) {
      const regex = new RegExp(filter.pattern, 'i');
      logs = logs.filter(log => regex.test(log.message));
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  };

  // Gestionnaire de commandes depuis le parent
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'canvas_console_command') {
      const { command, data, code } = event.data;

      try {
        switch (command) {
          case 'get_logs_request':
            // R\xE9cup\xE9rer et envoyer les logs filtr\xE9s
            const logs = window.getCanvasConsoleLogs({
              level: data?.level,
              pattern: data?.filter
            }, data?.limit || 50);

            // Envoyer les logs au parent via postMessage
            window.parent.postMessage({
              type: 'canvas_console_logs_response',
              data: logs,
              timestamp: Date.now()
            }, '*');

            console.log('[Canvas Console] Sent', logs.length, 'logs to parent');
            break;

          case 'clear_logs':
            window.canvasConsoleLogs = [];
            console.log('[Canvas Console] Logs cleared by parent');
            break;

          case 'enable_capture':
            window.canvasConsoleCaptureEnabled = true;
            console.log('[Canvas Console] Capture enabled by parent');
            break;

          case 'disable_capture':
            window.canvasConsoleCaptureEnabled = false;
            console.log('[Canvas Console] Capture disabled by parent');
            break;

          case 'execute_js':
            if (code) {
              const result = eval(code);
              console.log('[Canvas Console] Command executed:', code);
              if (result !== undefined) {
                console.log('[Canvas Console] Result:', result);
              }
            }
            break;
        }
      } catch (error) {
        console.error('[Canvas Console] Error executing command:', error);
      }
    }
  });

  // Signal de d\xE9marrage
  console.log('[Canvas Console] Console capture initialized');

  // Capture des erreurs non g\xE9r\xE9es
  window.addEventListener('error', function(event) {
    const logEntry = {
      level: 'error',
      message: \`Uncaught error: \${event.message} at \${event.filename}:\${event.lineno}:\${event.colno}\`,
      timestamp: new Date().toISOString(),
      stack: event.error ? event.error.stack : undefined
    };

    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
  });

  // Capture des promesses rejet\xE9es non g\xE9r\xE9es
  window.addEventListener('unhandledrejection', function(event) {
    const logEntry = {
      level: 'error',
      message: \`Unhandled promise rejection: \${event.reason}\`,
      timestamp: new Date().toISOString(),
      stack: event.reason && event.reason.stack ? event.reason.stack : undefined
    };

    if (window.canvasConsoleCaptureEnabled) {
      window.canvasConsoleLogs.push(logEntry);
      sendToParent(logEntry);
    }
  });

})();
</script>
`;
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
          if (finalContent.includes("<html") || finalContent.includes("<head")) {
            if (finalContent.includes("</head>")) {
              finalContent = finalContent.replace("</head>", CONSOLE_CAPTURE_SCRIPT + "</head>");
            } else if (finalContent.includes("<html")) {
              finalContent = finalContent.replace(/(<html[^>]*>)/, "$1" + CONSOLE_CAPTURE_SCRIPT);
            }
          } else {
            finalContent = CONSOLE_CAPTURE_SCRIPT + finalContent;
          }
          log.info("\u{1F3AF} Script de capture console inject\xE9");
          const externalRefs = [
            ...finalContent.matchAll(/src=["']([^"']+\.(js|css|png|jpg|jpeg|gif|svg|mp3|wav|ogg))["']/g),
            ...finalContent.matchAll(/href=["']([^"']+\.css)["']/g)
          ];
          if (externalRefs.length > 0) {
            log.info(`\u2139\uFE0F  ${externalRefs.length} r\xE9f\xE9rence(s) externe(s) d\xE9tect\xE9e(s) - contenu affich\xE9 tel quel:`);
            externalRefs.forEach(([_, filename]) => {
              log.info(`   - ${filename}`);
            });
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
