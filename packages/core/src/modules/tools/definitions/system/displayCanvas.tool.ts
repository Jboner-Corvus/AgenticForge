import { Tool } from '../../../../types.js';
import { sendToCanvas } from '../../../../utils/canvasUtils.js';
import { z } from 'zod';

const DisplayCanvasParams = z.object({
  /**
   * Le contenu à afficher dans le canvas
   */
  content: z.string({
    description: 'Le contenu à afficher dans le canvas. Pour HTML, inclure le code HTML complet avec styles. Pour Markdown, le texte formaté en Markdown. Pour du texte brut, du texte simple. Pour une URL, l\'URL complète à afficher dans une iframe.'
  }),
  
  /**
   * Le type de contenu (html, markdown, text, url)
   */
  contentType: z.enum(['html', 'markdown', 'text', 'url']).optional(),
  
  /**
   * Titre optionnel pour le canvas
   */
  title: z.string().optional()
});

export const displayCanvasTool: Tool<typeof DisplayCanvasParams> = {
  name: 'display_canvas',
  description: 'Affiche du contenu dans le canvas de l\'interface utilisateur. Peut afficher du HTML, Markdown, du texte brut ou une URL. Très utile pour montrer des visualisations, des rapports, des graphiques, des animations, des jeux simples, etc.',
  parameters: DisplayCanvasParams,
  execute: async (
    params,
    context
  ) => {
    const { job, log } = context;
    const parsedParams = DisplayCanvasParams.parse(params);
    const { content, title } = parsedParams;
    const contentType = parsedParams.contentType || 'html';
    
    try {
      // Si un titre est fourni, l'ajouter au contenu (côté frontend)
      if (title) {
        log.info(`Displaying content with title: ${title}`);
      }
      
      // Envoyer le contenu au canvas
      if (job?.id) {
        sendToCanvas(job.id, content, contentType);
        log.info(`Content sent to canvas for job ${job.id} with type ${contentType}`);
      } else {
        log.warn('No job ID available, cannot send content to canvas');
      }
      
      return {
        success: true
      };
    } catch (error) {
      log.error({ err: error }, 'Error sending content to canvas');
      throw new Error(`Failed to display content in canvas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};