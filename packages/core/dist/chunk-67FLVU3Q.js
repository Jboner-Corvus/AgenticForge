import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  sendToCanvas
} from "./chunk-3B2NS2K5.js";
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
    description: "Le contenu \xE0 afficher dans le canvas. Pour HTML, inclure le code HTML complet avec styles. Pour Markdown, le texte format\xE9 en Markdown. Pour du texte brut, du texte simple. Pour une URL, l'URL compl\xE8te \xE0 afficher dans une iframe."
  }),
  /**
   * Le type de contenu (html, markdown, text, url)
   */
  contentType: z.enum(["html", "markdown", "text", "url"]).optional(),
  /**
   * Titre optionnel pour le canvas
   */
  title: z.string().optional()
});
var displayCanvasTool = {
  description: "Affiche du contenu dans le canvas de l'interface utilisateur. Peut afficher du HTML, Markdown, du texte brut ou une URL. Tr\xE8s utile pour montrer des visualisations, des rapports, des graphiques, des animations, des jeux simples, etc.",
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = DisplayCanvasParams.parse(params);
    const { content, title } = parsedParams;
    const contentType = parsedParams.contentType || "html";
    try {
      let validatedContent = content;
      let shouldDisplay = true;
      try {
        const parsed = JSON.parse(content);
        if (parsed.thought || parsed.command) {
          log.warn("Blocked debugging JSON from canvas display");
          validatedContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Content Filtered</h2><p style='color: #6b7280;'>Internal debugging information was filtered out for security.</p></div>";
        }
      } catch {
        const debuggingPatterns = [
          '"thought"',
          "```json",
          "Tool Call:",
          "Tool Result:",
          "manage_todo_list",
          "finish with params",
          "L'utilisateur souhaite",
          "Je vais v\xE9rifier",
          "Il n'y a pas de todo",
          "The agent is thinking",
          "iteration",
          '{"action"',
          '{"response"'
        ];
        const hasDebuggingContent = debuggingPatterns.some(
          (pattern) => content.toLowerCase().includes(pattern.toLowerCase())
        );
        if (hasDebuggingContent || content.match(/^\s*{\s*"(thought|command)":/) || content.includes("<div><h1>Canvas Display</h1><p>")) {
          log.warn("Blocked agent thoughts/debugging content from canvas display");
          validatedContent = "<div style='padding: 20px; text-align: center; background: #f3f4f6; border-radius: 8px;'><h2 style='color: #ef4444;'>Content Filtered</h2><p style='color: #6b7280;'>Agent thoughts and debugging content are not displayed in canvas. Use the thought field instead for internal reasoning that appears as chat bubbles.</p></div>";
        }
      }
      if (title) {
        log.info(`Displaying content with title: ${title}`);
      }
      if (job?.id) {
        sendToCanvas(job.id, validatedContent, contentType);
        log.info(
          `Content sent to canvas for job ${job.id} with type ${contentType}`
        );
      } else {
        log.warn("No job ID available, cannot send content to canvas");
      }
      return {
        success: true
      };
    } catch (error) {
      log.error({ err: error }, "Error sending content to canvas");
      throw new Error(
        `Failed to display content in canvas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  name: "display_canvas",
  parameters: DisplayCanvasParams
};

export {
  displayCanvasTool
};
