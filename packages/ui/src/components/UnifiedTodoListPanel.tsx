import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Target, X, Check, ListTodo } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { websocketService, type TodoWebSocketMessage } from '../lib/services/websocketService';

// Interface améliorée avec validation et métadonnées
interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  tags?: string[];
  assignee?: string;
  estimatedTime?: number; // en minutes
  actualTime?: number; // en minutes
}

interface TodoData {
  type: 'unified_todo' | 'claude_code_todo' | 'todo_list';
  title?: string;
  timestamp?: number;
  todos?: TodoItem[];
  tasks?: TodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
    overdue: number;
    highPriority: number;
  };
  metadata?: {
    version: string;
    lastSync: number;
    source: string;
  };
}

// Configuration compacte et professionnelle des statuts
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'TODO',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  in_progress: {
    icon: Target,
    label: 'DOING',
    color: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  completed: {
    icon: Check,
    label: 'DONE',
    color: 'text-green-400',
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    dot: 'bg-green-500',
  },
};

export const UnifiedTodoListPanel: React.FC = () => {
  const [todoData, setTodoData] = useState<TodoData | null>(null);
  const [isExpanded, setIsExpanded] = useState(true); // Développé par défaut

  const lastMessageRef = useRef<string>('');
  
  // Utiliser le store UI pour la visibilité et le jobId
  const isVisible = useUIStore((state) => state.isUnifiedTodoListVisible);
  const setIsVisible = useUIStore((state) => state.setIsUnifiedTodoListVisible);
  const jobId = useUIStore((state) => state.jobId);
  const activeCliJobId = useUIStore((state) => state.activeCliJobId);

  // Always set the todo list to be visible by default
  useEffect(() => {
    setIsVisible(true);
  }, [setIsVisible]);

  // Système de persistance et synchronisation amélioré
  const saveToLocalStorage = useCallback((data: TodoData) => {
    try {
      localStorage.setItem('agenticforge-todo-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save todo data to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback((): TodoData | null => {
    try {
      const saved = localStorage.getItem('agenticforge-todo-data');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load todo data from localStorage:', error);
      return null;
    }
  }, []);

  // Fonction de synchronisation avec retry
  const syncWithBackend = useCallback(async (data: TodoData): Promise<boolean> => {
    try {
      // Ici vous pouvez implémenter la vraie synchronisation avec le backend
      console.log('🔄 Syncing todo data with backend...', data);
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      // Échec de la synchronisation avec le serveur
      return false;
    }
  }, []);

  // Synchroniser le jobId avec le WebSocket service
  useEffect(() => {
    const currentJobId = activeCliJobId || jobId;
    if (currentJobId) {
      console.log('📋 [TodoPanel] Setting jobId in WebSocket service:', currentJobId);
      websocketService.setJobId(currentJobId);
    }
  }, [jobId, activeCliJobId]);

  // Écouter les messages de todo via WebSocket avec gestion d'erreurs améliorée
  useEffect(() => {
    console.log('📋 [TodoPanel] Setting up WebSocket listener...');

    const unsubscribe = websocketService.subscribeToTodos(async (message: TodoWebSocketMessage) => {
      const messageString = JSON.stringify(message);

      if (messageString === lastMessageRef.current) {
        return; // Éviter les doublons
      }

      lastMessageRef.current = messageString;
      const backendData = message.data;

      console.log('📋 [TodoPanel] Received todo message:', message.type, backendData);

      try {
        if (backendData) {
          // Extraire les todos en fonction du type de données avec validation
          let todos: TodoItem[] = [];
          
          if (backendData.todos && Array.isArray(backendData.todos)) {
            todos = backendData.todos.map((task: any, index: number) => ({
              id: task.id || `task-${index}`,
              content: task.content || task.description || task.title || 'Tâche sans titre',
              status: task.status || 'pending',
              priority: task.priority || 'medium',
              createdAt: task.createdAt || Date.now(),
              updatedAt: task.updatedAt || Date.now(),
              dueDate: task.dueDate,
              tags: task.tags || [],
              assignee: task.assignee,
              estimatedTime: task.estimatedTime,
              actualTime: task.actualTime,
            }));
          // Note: WebSocket message type only defines 'todos', not 'tasks'
          }

          const enhancedData: TodoData = {
            type: message.type,
            title: backendData.title || 'Liste de tâches',
            timestamp: backendData.timestamp || Date.now(),
            todos: todos,
            stats: {
              pending: backendData.stats?.pending || todos.filter(t => t.status === 'pending').length || 0,
              in_progress: backendData.stats?.in_progress || todos.filter(t => t.status === 'in_progress').length || 0,
              completed: backendData.stats?.completed || todos.filter(t => t.status === 'completed').length || 0,
              total: backendData.stats?.total || todos.length || 0,
              overdue: todos.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== 'completed').length || 0,
              highPriority: todos.filter(t => t.priority === 'high').length || 0,
            },
            metadata: {
              version: '2.0',
              lastSync: Date.now(),
              source: message.type,
            },
          };

          // Sauvegarder en localStorage
          saveToLocalStorage(enhancedData);

          // Tenter la synchronisation avec le backend
          await syncWithBackend(enhancedData);

          setTodoData(enhancedData);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error processing todo message:', error);

        // Charger depuis le localStorage en cas d'erreur
        const cachedData = loadFromLocalStorage();
        if (cachedData) {
          setTodoData(cachedData);
          setIsVisible(true);
        }
      }
    });

    // Écouter aussi les anciens messages window.postMessage pour la compatibilité
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'toggle_chat_todo_list') {
        const newVisibility = event.data.show !== undefined ? event.data.show : !isVisible;
        setIsVisible(newVisibility);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    
    return () => {
      console.log('📋 [TodoPanel] Cleaning up WebSocket listener...');
      unsubscribe();
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [isVisible, setIsVisible, saveToLocalStorage, syncWithBackend, loadFromLocalStorage]);

  // Ne pas afficher si pas visible
  if (!isVisible) {
    return null;
  }

  // Vérification de sécurité pour éviter les erreurs si todoData est null
  if (!todoData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full border-b border-gray-700/30 bg-gray-900/95 backdrop-blur-sm shadow-lg"
      >
        <div className="px-3 py-2 flex items-center space-x-3">
          <div className="p-1.5 rounded-md bg-blue-500/15">
            <ListTodo className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-medium text-white">Tasks</h3>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const todos = todoData.todos || [];
  const inProgressTodos = todos.filter((todo) => todo.status === 'in_progress');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full border-b border-gray-700/30 bg-gray-900/95 backdrop-blur-sm shadow-lg"
    >
      {/* En-tête améliorée avec meilleur contraste */}
      <div
        className="px-3 py-2 cursor-pointer hover:bg-gray-800/30 transition-all duration-150 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-md bg-blue-500/15">
            <ListTodo className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-white">
              Tasks
            </h3>
            <div className="flex items-center space-x-3">
              {/* Compact status indicators */}
              <div className="flex items-center space-x-2">
                {inProgressTodos.length > 0 && (
                  <span className="flex items-center text-blue-400 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse" />
                    {inProgressTodos.length}
                  </span>
                )}
                <span className="text-gray-400 text-xs font-mono">
                  {todoData.stats.completed}/{todoData.stats.total}
                </span>
                {todoData.stats.pending > 0 && (
                  <span className="text-amber-400 text-xs">
                    +{todoData.stats.pending}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="p-1 hover:bg-gray-600/40 rounded text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Current task display when minimized */}
      {!isExpanded && inProgressTodos.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center space-x-2 text-xs">
            <Target className="h-3 w-3 text-blue-400" />
            <span className="text-gray-300 font-medium">Current task:</span>
            <span className="text-gray-200 truncate flex-1 ml-1">
              {inProgressTodos[0].content}
            </span>
          </div>
        </div>
      )}

      {/* Vue étendue avec meilleur style */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-700/20"
          >
            <div className="px-3 py-2">
              {/* Statistiques compactes */}
              {/* Barre de progression compacte */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4 text-xs">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const count = todoData.stats[status as keyof typeof todoData.stats] || 0;
                      if (count === 0) return null;
                      return (
                        <div key={status} className="flex items-center space-x-1.5">
                          <div className={`w-1.5 h-1.5 ${config.dot} rounded-full`} />
                          <span className={`${config.color} font-medium`}>{count}</span>
                          <span className="text-gray-500 uppercase tracking-wide font-medium">
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {todoData.stats.total > 0 && (
                    <span className="text-xs text-gray-400 font-mono">
                      {Math.round((todoData.stats.completed / todoData.stats.total) * 100)}%
                    </span>
                  )}
                </div>
                {/* Barre de progression */}
                {todoData.stats.total > 0 && (
                  <div className="w-full bg-gray-800/50 rounded-full h-1">
                    <div 
                      className="bg-green-500/80 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${(todoData.stats.completed / todoData.stats.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Liste compacte et professionnelle */}
              {todos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-700/30 rounded-full flex items-center justify-center">
                    <ListTodo className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-400">No active tasks</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/50 scrollbar-track-transparent">
                  {todos.map((todo) => {
                    const statusConfig = STATUS_CONFIG[todo.status];

                    return (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md ${statusConfig.bg} ${statusConfig.border} border hover:bg-opacity-80 transition-all duration-150 group`}
                      >
                        <div className={`w-2 h-2 ${statusConfig.dot} rounded-full ${
                          todo.status === 'in_progress' ? 'animate-pulse' : ''
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${
                            todo.status === 'completed'
                              ? 'line-through text-gray-500'
                              : 'text-gray-200'
                          } truncate group-hover:text-white transition-colors`}>
                            {todo.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity">
                          <span className={`text-xs font-medium ${statusConfig.color} uppercase tracking-wider`}>
                            {todo.status === 'in_progress' ? 'DOING' : todo.status === 'pending' ? 'TODO' : 'DONE'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};