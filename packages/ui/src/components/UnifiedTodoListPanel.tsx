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

// Configuration simplifiée des statuts (style Claude Code)
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'À FAIRE',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  in_progress: {
    icon: Target,
    label: 'EN COURS',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  completed: {
    icon: Check,
    label: 'TERMINÉ',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
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
        className="w-full border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm"
      >
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ListTodo className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Liste de tâches
              </h3>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-gray-400">
                  Chargement...
                </span>
              </div>
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
      className="w-full border-b border-gray-700/50 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm"
    >
      {/* En-tête améliorée avec meilleur contraste */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <ListTodo className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {todoData.title || 'Liste de tâches'}
            </h3>
            <div className="flex items-center space-x-3 text-xs">
              {inProgressTodos.length > 0 && (
                <span className="flex items-center text-blue-400 font-medium">
                  <Target className="h-3 w-3 mr-1" />
                  {inProgressTodos.length} en cours
                </span>
              )}
              <span className="text-gray-400">
                {todoData.stats.completed}/{todoData.stats.total} terminées
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">


          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="p-2 hover:bg-gray-600/40 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer la liste de tâches"
          >
            <X className="h-4 w-4" />
          </button>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Vue étendue avec meilleur style */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-700/30"
          >
            <div className="px-4 py-3">
              {/* Statistiques visuelles */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const count =
                    todoData.stats[status as keyof typeof todoData.stats] || 0;
                  const Icon = config.icon;
                  return (
                    <div
                      key={status}
                      className={`${config.bg} rounded-lg p-3 flex flex-col items-center`}
                    >
                      <Icon
                        className={`h-5 w-5 ${config.color} mb-1`}
                      />
                      <div className={`text-lg font-bold ${config.color}`}>
                        {count}
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {config.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Liste des tâches améliorée */}
              {todos.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <ListTodo className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">Aucune tâche définie pour le moment</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50 rounded-lg">
                  {todos.map((todo) => {
                    const statusConfig = STATUS_CONFIG[todo.status];
                    const Icon = statusConfig.icon;

                    return (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start space-x-3 p-3 rounded-lg ${statusConfig.bg} border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200`}
                      >
                        <div className={`mt-0.5 p-1 rounded ${statusConfig.bg}`}>
                          <Icon
                            className={`h-4 w-4 ${statusConfig.color}`}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              todo.status === 'completed'
                                ? 'line-through text-gray-500'
                                : 'text-gray-200'
                            }`}
                          >
                            {todo.content}
                          </p>
                        </div>
                        {todo.status === 'in_progress' && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          </div>
                        )}
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