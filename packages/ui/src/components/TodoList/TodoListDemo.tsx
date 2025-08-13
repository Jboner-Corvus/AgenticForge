import React from 'react';
import { useCombinedStore as useStore } from '../../store';
import { Button } from '../ui/button';

const TodoListDemo: React.FC = () => {
  const setIsTodoListVisible = useStore((state) => state.setIsTodoListVisible);

  const showTodoList = () => {
    setIsTodoListVisible(true);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Démonstration de la TodoList</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Cliquez sur le bouton ci-dessous pour afficher la todolist. 
        Cette fonctionnalité est maintenant complètement indépendante du canvas.
      </p>
      
      <Button 
        onClick={showTodoList}
        className="bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-lg transition-colors"
      >
        Afficher la TodoList
      </Button>
      
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">📋 Fonctionnalités</h3>
          <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
            <li>Ajout de nouvelles tâches avec priorité</li>
            <li>Modification du statut des tâches (À faire, En cours, Terminé)</li>
            <li>Suppression des tâches</li>
            <li>Statistiques en temps réel</li>
            <li>Tri automatique par statut</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">ℹ️ Information</h3>
          <p className="text-blue-700 dark:text-blue-300">
            La todolist est maintenant un composant autonome qui ne dépend pas du canvas. 
            Vous pouvez gérer vos tâches sans que cela n'affecte l'affichage du contenu dans le canvas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TodoListDemo;