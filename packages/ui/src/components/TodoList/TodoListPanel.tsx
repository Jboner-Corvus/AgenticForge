import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { Button } from '../ui/button';
import { X, Minus, Square, CheckCircle, Clock, Play } from 'lucide-react';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface TodoData {
  type: 'todo_list';
  title: string;
  timestamp: number;
  todos: TodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  };
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'À FAIRE', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  in_progress: { icon: Play, label: 'EN COURS', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  completed: { icon: CheckCircle, label: 'TERMINÉ', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
};

const PRIORITY_CONFIG = {
  high: { label: '🔥 HIGH', color: 'text-red-500', bg: 'bg-red-50' },
  medium: { label: '⚡ MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  low: { label: '🌱 LOW', color: 'text-green-500', bg: 'bg-green-50' }
};

export function TodoListPanel() {
  const [todoData, setTodoData] = useState<TodoData | null>(null);
  const isTodoListVisible = useStore((state) => state.isTodoListVisible);
  const setIsTodoListVisible = useStore((state) => state.setIsTodoListVisible);
  const wsRef = useRef<WebSocket | null>(null);
  const jobId = useStore((state) => state.jobId);
  const isProcessing = useStore((state) => state.isProcessing);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    if (jobId && isProcessing) {
      const wsUrl = `ws://localhost:3005/api/ws?jobId=${jobId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'todo_list') {
            setTodoData(data);
            setIsVisible(true);
          }
        } catch (error) {
          console.error('Error parsing todo data:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [jobId, isProcessing]);

  const closePanel = () => {
    setIsTodoListVisible(false);
  };

  const toggleMinimize = () => {
    setIsTodoListVisible(!isTodoListVisible);
  };

  if (!todoData || !isTodoListVisible) {
    return (
      <button
        onClick={() => setIsTodoListVisible(true)}
        className="fixed right-4 bottom-24 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-10"
        aria-label="Ouvrir la liste des tâches"
      >
        <Square className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {todoData?.title || 'Liste des Tâches'}
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={toggleMinimize}
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            onClick={closePanel}
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {todoData.todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-500 dark:text-gray-400">
              Aucune tâche active
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              L'agent créera automatiquement des tâches lors de vos demandes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todoData.todos.map((todo) => {
              const statusConfig = STATUS_CONFIG[todo.status];
              const priorityConfig = PRIORITY_CONFIG[todo.priority];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={todo.id}
                  className={`border rounded-lg p-3 ${statusConfig.bg} ${statusConfig.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 p-1 rounded ${statusConfig.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.content}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig.bg} ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                          {todo.category && (
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                              #{todo.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>
                        {todo.status === 'completed' ? '100%' : 
                         todo.status === 'in_progress' ? '66%' : '25%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          todo.status === 'completed' ? 'bg-green-500' : 
                          todo.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ 
                          width: todo.status === 'completed' ? '100%' : 
                                 todo.status === 'in_progress' ? '66%' : '25%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {todo.status === 'in_progress' && (
                    <div className="mt-2 flex items-center text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                      <span>L'agent travaille actuellement sur cette tâche...</span>
                    </div>
                  )}
                  
                  {todo.status === 'completed' && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Tâche complétée avec succès !</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {todoData.stats.pending}
            </div>
            <div className="text-xs text-amber-500 dark:text-amber-400">⏳ À FAIRE</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {todoData.stats.in_progress}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-400">🚀 EN COURS</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {todoData.stats.completed}
            </div>
            <div className="text-xs text-green-500 dark:text-green-400">✅ TERMINÉ</div>
          </div>
        </div>
      </div>
    </div>
  );
}