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

// Script de capture console pour le canvas
const CONSOLE_CAPTURE_SCRIPT = `
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
      // Fallback si postMessage échoue
      console.warn('[Canvas Console] Failed to send log to parent:', error);
    }
  }

  // Fonction pour créer une entrée de log
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

  // Fonctions utilitaires pour le contrôle de la capture
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
            // Récupérer et envoyer les logs filtrés
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

  // Signal de démarrage
  console.log('[Canvas Console] Console capture initialized');

  // Capture des erreurs non gérées
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

  // Capture des promesses rejetées non gérées
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

          // Injecter le script de capture console dans le HTML
          if (finalContent.includes('<html') || finalContent.includes('<head')) {
            // HTML complet - injecter dans le head
            if (finalContent.includes('</head>')) {
              finalContent = finalContent.replace('</head>', CONSOLE_CAPTURE_SCRIPT + '</head>');
            } else if (finalContent.includes('<html')) {
              // Pas de head, ajouter après <html>
              finalContent = finalContent.replace(/(<html[^>]*>)/, '$1' + CONSOLE_CAPTURE_SCRIPT);
            }
          } else {
            // Fragment HTML - ajouter au début
            finalContent = CONSOLE_CAPTURE_SCRIPT + finalContent;
          }

          log.info('🎯 Script de capture console injecté');

          // 🔍 DÉTECTION INTELLIGENTE DES ASSETS MANQUANTS
          const externalRefs = [
            ...finalContent.matchAll(/src=["']([^"']+\.(js|css|png|jpg|jpeg|gif|svg|mp3|wav|ogg))["']/g),
            ...finalContent.matchAll(/href=["']([^"']+\.css)["']/g)
          ];

          if (externalRefs.length > 0) {
            log.info(`ℹ️  ${externalRefs.length} référence(s) externe(s) détectée(s) - contenu affiché tel quel:`);
            externalRefs.forEach(([_, filename]) => {
              log.info(`   - ${filename}`);
            });
            // Note: External references are allowed - the agent may serve these files separately
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
