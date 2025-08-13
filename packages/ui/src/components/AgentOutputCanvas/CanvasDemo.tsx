import React from 'react';
import { useCombinedStore as useStore } from '../../store';
import { Button } from '../ui/button';
import { demoMarkdownContent, demoHtmlContent } from './demoContent';

const CanvasDemo: React.FC = () => {
  const setCanvasContent = useStore((state) => state.setCanvasContent);
  const setCanvasType = useStore((state) => state.setCanvasType);
  const setIsCanvasVisible = useStore((state) => state.setIsCanvasVisible);
  const addCanvasToHistory = useStore((state) => state.addCanvasToHistory);

  const loadMarkdownDemo = () => {
    setCanvasContent(demoMarkdownContent);
    setCanvasType('markdown');
    setIsCanvasVisible(true);
    addCanvasToHistory('Démonstration Markdown', demoMarkdownContent, 'markdown');
  };

  const loadHtmlDemo = () => {
    setCanvasContent(demoHtmlContent);
    setCanvasType('html');
    setIsCanvasVisible(true);
    addCanvasToHistory('Démonstration HTML', demoHtmlContent, 'html');
  };

  const loadTextDemo = () => {
    const textContent = `Démonstration de contenu texte brut

Ce contenu est affiché dans le canvas en mode texte brut.
Il peut être utilisé pour afficher des logs, des résultats de commandes,
ou tout autre contenu texte simple.

Fonctionnalités :
- Affichage sécurisé
- Copie dans le presse-papiers
- Téléchargement du contenu
- Historique de navigation

Note : Ce contenu est complètement indépendant de la todolist.`;
    
    setCanvasContent(textContent);
    setCanvasType('text');
    setIsCanvasVisible(true);
    addCanvasToHistory('Démonstration Texte', textContent, 'text');
  };

  const loadUrlDemo = () => {
    const urlContent = 'https://example.com';
    setCanvasContent(urlContent);
    setCanvasType('url');
    setIsCanvasVisible(true);
    addCanvasToHistory('Démonstration URL', urlContent, 'url');
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Démonstration du Canvas</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Cliquez sur les boutons ci-dessous pour charger différents types de contenu dans le canvas.
        Le canvas est maintenant complètement indépendant de la todolist.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={loadMarkdownDemo}
          className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Charger Markdown
        </Button>
        
        <Button 
          onClick={loadHtmlDemo}
          className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Charger HTML
        </Button>
        
        <Button 
          onClick={loadTextDemo}
          className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Charger Texte Brut
        </Button>
        
        <Button 
          onClick={loadUrlDemo}
          className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Charger URL
        </Button>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">ℹ️ Information</h3>
        <p className="text-blue-700 dark:text-blue-300">
          Le canvas et la todolist sont maintenant deux composants complètement indépendants. 
          Vous pouvez utiliser le canvas pour afficher le contenu généré par l'agent sans 
          interférer avec la gestion des tâches.
        </p>
      </div>
    </div>
  );
};

export default CanvasDemo;