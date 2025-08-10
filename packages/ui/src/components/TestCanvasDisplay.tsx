import React, { useState } from 'react';
import { Button } from './ui/button';
import { useStore } from '../lib/store';
import { useToast } from '../lib/hooks/useToast';

const TestCanvasDisplay: React.FC = () => {
  const addCanvasToHistory = useStore((state) => state.addCanvasToHistory);
  const clearCanvas = useStore((state) => state.clearCanvas);
  const resetCanvas = useStore((state) => state.resetCanvas);
  const jobId = useStore((state) => state.jobId);
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const displayTestCanvas = async () => {
    try {
      console.log('🎨 [TestCanvasDisplay] Bouton Display Test Canvas cliqué!');
      
      // Réinitialiser complètement le canvas d'abord
      console.log('🎨 [TestCanvasDisplay] Réinitialisation du canvas...');
      resetCanvas();
      
      // Attendre un tick pour que le reset soit appliqué
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Contenu HTML de test simple
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Canvas</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                .test-container {
                    padding: 40px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    margin: 20px auto;
                    max-width: 400px;
                }
                .animated-text {
                    animation: pulse 2s infinite;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            </style>
        </head>
        <body>
            <div class="test-container">
                <h1 class="animated-text">🎨 Canvas Test</h1>
                <p>Le canvas fonctionne parfaitement!</p>
                <p>Timestamp: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
      `;
      
      console.log('🎨 [TestCanvasDisplay] Définition du contenu canvas...');
      
      // Ajouter le canvas à l'historique au lieu de just setter le contenu
      const canvasTitle = `Test Canvas ${new Date().toLocaleTimeString()}`;
      addCanvasToHistory(canvasTitle, htmlContent, 'html');
      
      console.log('🎨 [TestCanvasDisplay] Canvas ajouté à l\'historique! Contenu:', htmlContent.length, 'caractères');
      
      toast({
        title: "Succès",
        description: "Contenu HTML affiché dans le canvas",
      });
    } catch (error) {
      console.error('🎨 [TestCanvasDisplay] Error loading test canvas:', error);
      toast({
        title: "Erreur",
        description: "Échec du chargement du contenu HTML",
        variant: "destructive",
      });
    }
  };

  const sendToBackendCanvas = async () => {
    if (!jobId) {
      toast({
        title: "Erreur",
        description: "Aucun job en cours. Veuillez démarrer une conversation avec l'agent.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    try {
      // Lire le contenu du fichier HTML
      const response = await fetch('/src/components/TestCanvas.html');
      const htmlContent = await response.text();
      
      // Envoyer le contenu au backend via l'API
      const apiResponse = await fetch('/api/canvas/display', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          content: htmlContent,
          contentType: 'html'
        })
      });
      
      const result = await apiResponse.json();
      
      if (apiResponse.ok) {
        toast({
          title: "Succès",
          description: "Contenu HTML envoyé au canvas backend avec succès",
        });
      } else {
        throw new Error(result.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error sending to backend canvas:', error);
      toast({
        title: "Erreur",
        description: `Échec de l'envoi du contenu HTML au backend: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const displayExample = async (example: 'visualization' | 'game' | 'animation') => {
    try {
      let htmlContent = '';
      
      switch (example) {
        case 'visualization': {
          const vizResponse = await fetch('/src/components/examples/InteractiveVisualization.html');
          htmlContent = await vizResponse.text();
          break;
        }
        case 'game': {
          const gameResponse = await fetch('/src/components/examples/SnakeGame.html');
          htmlContent = await gameResponse.text();
          break;
        }
        case 'animation': {
          const animResponse = await fetch('/src/components/examples/ParticleAnimation.html');
          htmlContent = await animResponse.text();
          break;
        }
        default:
          throw new Error('Exemple inconnu');
      }
      
      // Ajouter l'exemple à l'historique du canvas
      const canvasTitle = `Exemple ${example} - ${new Date().toLocaleTimeString()}`;
      addCanvasToHistory(canvasTitle, htmlContent, 'html');
      
      toast({
        title: "Succès",
        description: `Exemple "${example}" affiché dans le canvas`,
      });
    } catch (error) {
      console.error(`Error loading ${example} example:`, error);
      toast({
        title: "Erreur",
        description: `Échec du chargement de l'exemple "${example}"`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Test Canvas Display</h3>
      <p className="mb-4">Click the buttons below to test canvas functionality:</p>
      <div className="flex flex-col space-y-2">
        <Button onClick={displayTestCanvas}>Display Test Canvas (Frontend)</Button>
        <Button onClick={sendToBackendCanvas} disabled={isSending || !jobId}>
          {isSending ? "Sending..." : "Send to Backend Canvas"}
        </Button>
        <Button onClick={clearCanvas} variant="outline">Clear Canvas</Button>
        <Button onClick={resetCanvas} variant="destructive">Reset Canvas</Button>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <h4 className="text-md font-medium mb-2">Exemples:</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => displayExample('visualization')} variant="outline">
              Visualisation Interactive
            </Button>
            <Button onClick={() => displayExample('game')} variant="outline">
              Jeu Snake
            </Button>
            <Button onClick={() => displayExample('animation')} variant="outline">
              Animation de Particules
            </Button>
          </div>
        </div>
      </div>
      {!jobId && (
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          Note: A job must be running to send content to the backend canvas.
        </p>
      )}
    </div>
  );
};

export default TestCanvasDisplay;