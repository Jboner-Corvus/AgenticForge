import { useState, useEffect } from 'react';

// Enhanced interfaces to match the backend data structure
export interface EnhancedTodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  projectId?: string;
  parentId?: string;
  dependencies?: string[];
  estimatedTime?: number;
  actualTime?: number;
  createdAt: number;
  updatedAt: number;
  assignedTo?: string;
  tags?: string[];
}

export interface EnhancedProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  endDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

export interface EnhancedTodoData {
  type: 'enhanced_todo_list' | 'todo_list';
  title: string;
  timestamp: number;
  project?: EnhancedProject | null;
  todos: EnhancedTodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    cancelled: number;
    total: number;
    projectProgress?: number;
  }
  isRecoveredFromCrash?: boolean;
  lastActivity?: number;
}

const STORAGE_KEY = 'agenticForgeEnhancedTodoData';

export const useEnhancedTodoList = () => {
  const [todoData, setTodoData] = useState<EnhancedTodoData | null>(null);
  const [newTodo, setNewTodo] = useState<string>('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isRecovered, setIsRecovered] = useState<boolean>(false);

  // Charger les données depuis le localStorage au démarrage
  useEffect(() => {
    const loadTodoData = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as EnhancedTodoData;
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
              console.log('🚨 [EnhancedTodoList] RÉCUPÉRATION APRÈS CRASH détectée!', parsedData.todos.length, 'tâches récupérées');
            } else {
              console.log('📋 [EnhancedTodoList] Récupération de la todo list sauvegardée:', parsedData.todos.length, 'tâches');
            }
            
            setTodoData(parsedData);
            return;
          } else {
            console.log('📋 [EnhancedTodoList] Todo list expirée, suppression...');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('📋 [EnhancedTodoList] Erreur lors du chargement:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      
      // Données par défaut si aucune sauvegarde trouvée
      const initialTodoData: EnhancedTodoData = {
        type: 'enhanced_todo_list',
        title: 'Liste des Tâches Agent',
        timestamp: Date.now(),
        todos: [],
        stats: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          blocked: 0,
          cancelled: 0,
          total: 0
        },
        isRecoveredFromCrash: false,
        lastActivity: Date.now()
      };
      
      setTodoData(initialTodoData);
    };

    loadTodoData();
  }, []);

  // Écouter les messages du backend
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'todo_list') {
        console.log('📝 [EnhancedTodoList] TODO_LIST message received from backend!', event.data);
        
        // Convertir les données du backend au format attendu
        const backendData = event.data.data;
        if (backendData) {
          const enhancedData: EnhancedTodoData = {
            type: 'enhanced_todo_list',
            title: backendData.title || 'Liste des Tâches',
            timestamp: backendData.timestamp || Date.now(),
            project: backendData.project || null,
            todos: backendData.tasks?.map((task: {
              id: string;
              content: string;
              status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
              priority?: 'low' | 'medium' | 'high' | 'critical';
              category?: string;
              projectId?: string;
              parentId?: string;
              dependencies?: string[];
              estimatedTime?: number;
              actualTime?: number;
              createdAt: number;
              updatedAt: number;
              assignedTo?: string;
              tags?: string[];
            }) => ({
              id: task.id,
              content: task.content,
              status: task.status,
              priority: task.priority || 'medium',
              category: task.category,
              projectId: task.projectId,
              parentId: task.parentId,
              dependencies: task.dependencies || [],
              estimatedTime: task.estimatedTime,
              actualTime: task.actualTime,
              createdAt: task.createdAt || Date.now(),
              updatedAt: task.updatedAt || Date.now(),
              assignedTo: task.assignedTo,
              tags: task.tags || []
            })) || [],
            stats: {
              pending: backendData.stats?.pending || 0,
              in_progress: backendData.stats?.in_progress || 0,
              completed: backendData.stats?.completed || 0,
              blocked: backendData.stats?.blocked || 0,
              cancelled: backendData.stats?.cancelled || 0,
              total: backendData.stats?.total || 0,
              projectProgress: backendData.stats?.projectProgress
            },
            isRecoveredFromCrash: false,
            lastActivity: Date.now()
          };
          
          setTodoData(enhancedData);
          saveTodoData(enhancedData);
          console.log('📤 [EnhancedTodoList] Todo list updated from backend data');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Calculer les statistiques
  const calculateStats = (todos: EnhancedTodoItem[]) => {
    return {
      pending: todos.filter(todo => todo.status === 'pending').length,
      in_progress: todos.filter(todo => todo.status === 'in_progress').length,
      completed: todos.filter(todo => todo.status === 'completed').length,
      blocked: todos.filter(todo => todo.status === 'blocked').length,
      cancelled: todos.filter(todo => todo.status === 'cancelled').length,
      total: todos.length
    };
  };

  // Sauvegarder les données dans le localStorage
  const saveTodoData = (data: EnhancedTodoData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('📋 [EnhancedTodoList] Sauvegarde réussie:', data.todos.length, 'tâches');
    } catch (error) {
      console.error('📋 [EnhancedTodoList] Erreur de sauvegarde:', error);
    }
  };

  // Ajouter une nouvelle tâche
  const addTodo = () => {
    if (newTodo.trim() === '') return;
    
    const newTodoItem: EnhancedTodoItem = {
      id: Date.now().toString(),
      content: newTodo,
      status: 'pending',
      priority: newTodoPriority,
      category: 'utilisateur',
      createdAt: Date.now(),
      updatedAt: Date.now()
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
  const updateTodoStatus = (id: string, status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled') => {
    if (!todoData) return;
    
    const updatedTodos = todoData.todos.map(todo => 
      todo.id === id ? { ...todo, status, updatedAt: Date.now() } : todo
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
    link.download = `agenticforge-enhanced-todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTodoList = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as EnhancedTodoData;
        importedData.timestamp = Date.now();
        importedData.lastActivity = Date.now();
        importedData.isRecoveredFromCrash = false;
        setTodoData(importedData);
        saveTodoData(importedData);
        console.log('📋 [EnhancedTodoList] Import réussi:', importedData.todos.length, 'tâches');
      } catch (error) {
        console.error('📋 [EnhancedTodoList] Erreur d\'import:', error);
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