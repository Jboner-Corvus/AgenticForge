import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  sendToCanvas
} from "./chunk-5OJML75I.js";
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
      if (title) {
        log.info(`Displaying content with title: ${title}`);
      }
      if (job?.id) {
        sendToCanvas(job.id, content, contentType);
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
