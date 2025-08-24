import { useState, useEffect } from 'react';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

export interface TodoData {
  type: 'todo_list';
  title: string;
  timestamp: number;
  todos: TodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  }
  isRecoveredFromCrash?: boolean;
  lastActivity?: number;
}

const STORAGE_KEY = 'agenticForgeTodoData';

export const useTodoList = () => {
  const [todoData, setTodoData] = useState<TodoData | null>(null);
  const [newTodo, setNewTodo] = useState<string>('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRecovered, setIsRecovered] = useState<boolean>(false);

  // Charger les données depuis le localStorage au démarrage
  useEffect(() => {
    const loadTodoData = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as TodoData;
          // Vérifier si les données sont récentes (moins de 7 jours)
          const isRecent = Date.now() - parsedData.timestamp < 7 * 24 * 60 * 60 * 1000;
          if (isRecent) {
            // Vérifier si c'est une récupération après crash
            const hasInProgressTasks = parsedData.todos.some(todo => todo.status === 'in_progress');
            const timeSinceLastActivity = parsedData.lastActivity ? Date.now() - parsedData.lastActivity : 0;
            const isLikelyRecovery = hasInProgressTasks && timeSinceLastActivity > 60000; // Plus de 1 minute
            
            if (isLikelyRecovery) {
              setIsRecovered(true);
              parsedData.isRecoveredFromCrash = true;
              console.log('🚨 [TodoList] RÉCUPÉRATION APRÈS CRASH détectée!', parsedData.todos.length, 'tâches récupérées');
            } else {
              console.log('📋 [TodoList] Récupération de la todo list sauvegardée:', parsedData.todos.length, 'tâches');
            }
            
            setTodoData(parsedData);
            
            return;
          } else {
            console.log('📋 [TodoList] Todo list expirée, suppression...');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('📋 [TodoList] Erreur lors du chargement:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      
      // Données par défaut si aucune sauvegarde trouvée
      const initialTodoData: TodoData = {
        type: 'todo_list',
        title: 'Liste des Tâches Agent',
        timestamp: Date.now(),
        todos: [],
        stats: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          total: 0
        },
        isRecoveredFromCrash: false,
        lastActivity: Date.now()
      };
      
      setTodoData(initialTodoData);
    };

    loadTodoData();
  }, []);

  // Calculer les statistiques
  const calculateStats = (todos: TodoItem[]) => {
    return {
      pending: todos.filter(todo => todo.status === 'pending').length,
      in_progress: todos.filter(todo => todo.status === 'in_progress').length,
      completed: todos.filter(todo => todo.status === 'completed').length,
      total: todos.length
    };
  };

  // Sauvegarder les données dans le localStorage
  const saveTodoData = (data: TodoData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('📋 [TodoList] Sauvegarde réussie:', data.todos.length, 'tâches');
    } catch (error) {
      console.error('📋 [TodoList] Erreur de sauvegarde:', error);
    }
  };

  // Ajouter une nouvelle tâche
  const addTodo = () => {
    if (newTodo.trim() === '') return;
    
    const newTodoItem: TodoItem = {
      id: Date.now().toString(),
      content: newTodo,
      status: 'pending',
      priority: newTodoPriority,
      category: 'utilisateur'
    };
    
    const updatedTodos = [...(todoData?.todos || []), newTodoItem];
    const updatedStats = calculateStats(updatedTodos);
    
    const newTodoData = {
      ...todoData!,
      todos: updatedTodos,
      stats: updatedStats,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      isRecoveredFromCrash: false
    };
    
    setTodoData(newTodoData);
    saveTodoData(newTodoData);
    
    setNewTodo('');
  };

  // Supprimer une tâche
  const removeTodo = (id: string) => {
    if (!todoData) return;
    
    const updatedTodos = todoData.todos.filter(todo => todo.id !== id);
    const updatedStats = calculateStats(updatedTodos);
    
    const newTodoData = {
      ...todoData,
      todos: updatedTodos,
      stats: updatedStats,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      isRecoveredFromCrash: false
    };
    
    setTodoData(newTodoData);
    saveTodoData(newTodoData);
  };

  // Mettre à jour le statut d'une tâche
  const updateTodoStatus = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    if (!todoData) return;
    
    const updatedTodos = todoData.todos.map(todo => 
      todo.id === id ? { ...todo, status } : todo
    );
    
    const updatedStats = calculateStats(updatedTodos);
    
    const newTodoData = {
      ...todoData,
      todos: updatedTodos,
      stats: updatedStats,
      timestamp: Date.now(),
      lastActivity: Date.now(),
      isRecoveredFromCrash: false
    };
    
    setTodoData(newTodoData);
    saveTodoData(newTodoData);
  };

  // Fonctions d'export/import
  const exportTodoList = () => {
    if (!todoData) return;
    const dataStr = JSON.stringify(todoData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenticforge-todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTodoList = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as TodoData;
        importedData.timestamp = Date.now();
        importedData.lastActivity = Date.now();
        importedData.isRecoveredFromCrash = false;
        setTodoData(importedData);
        saveTodoData(importedData);
        console.log('📋 [TodoList] Import réussi:', importedData.todos.length, 'tâches');
      } catch (error) {
        console.error('📋 [TodoList] Erreur d\'import:', error);
      }
    };
    reader.readAsText(file);
  };

  // Marquer comme récupéré (pour masquer l'indicateur)
  const acknowledgeRecovery = () => {
    setIsRecovered(false);
    if (todoData) {
      const updatedData = {
        ...todoData,
        isRecoveredFromCrash: false,
        lastActivity: Date.now()
      };
      setTodoData(updatedData);
      saveTodoData(updatedData);
    }
  };

  return {
    todoData,
    newTodo,
    setNewTodo,
    newTodoPriority,
    setNewTodoPriority,
    addTodo,
    removeTodo,
    updateTodoStatus,
    exportTodoList,
    importTodoList,
    isRecovered,
    acknowledgeRecovery
  };
};