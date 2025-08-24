import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Trophy,
  Pause,
  XCircle,
  TrendingUp,
  Minimize2
} from 'lucide-react';

// Enhanced interfaces for chat header TodoList
interface ChatHeaderTodoItem {
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

interface ChatHeaderProject {
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

interface ChatHeaderTodoData {
  type: 'chat_header_todo';
  title: string;
  timestamp: number;
  project?: ChatHeaderProject | null;
  tasks?: ChatHeaderTodoItem[];
  todos?: ChatHeaderTodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    cancelled: number;
    total: number;
    projectProgress?: number;
  };
}

// Status configuration for styling
const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    label: 'À FAIRE', 
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30'
  },
  in_progress: { 
    icon: Target, 
    label: 'EN COURS', 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  },
  completed: { 
    icon: Trophy, 
    label: 'TERMINÉ', 
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30'
  },
  blocked: { 
    icon: Pause, 
    label: 'BLOQUÉ', 
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30'
  },
  cancelled: { 
    icon: XCircle, 
    label: 'ANNULÉ', 
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30'
  }
};

export const ChatHeaderTodoList: React.FC = () => {
  const [todoData, setTodoData] = useState<ChatHeaderTodoData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Listen for chat header todo messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'chat_header_todo') {
        console.log('📝 [ChatHeaderTodoList] Chat header todo message received!', event.data);
        
        const backendData = event.data.data;
        if (backendData) {
          const chatHeaderData: ChatHeaderTodoData = {
            type: 'chat_header_todo',
            title: backendData.title || 'TodoList',
            timestamp: backendData.timestamp || Date.now(),
            project: backendData.project || null,
            tasks: backendData.tasks || backendData.todos || [],
            stats: {
              pending: backendData.stats?.pending || 0,
              in_progress: backendData.stats?.in_progress || 0,
              completed: backendData.stats?.completed || 0,
              blocked: backendData.stats?.blocked || 0,
              cancelled: backendData.stats?.cancelled || 0,
              total: backendData.stats?.total || 0,
              projectProgress: backendData.stats?.projectProgress
            }
          };
          
          setTodoData(chatHeaderData);
          setIsVisible(true);
          setIsMinimized(false); // Show when new data arrives
          console.log('📤 [ChatHeaderTodoList] Todo list updated in chat header');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Don't render if no data
  if (!isVisible || !todoData) {
    return null;
  }

  // Show floating restore button when minimized
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-20 right-4 z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="p-2 bg-gradient-to-r from-cyan-500/80 to-blue-500/80 backdrop-blur-sm rounded-full border border-cyan-400/30 shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 hover:scale-105"
          title="Restaurer la TodoList"
        >
          <Target className="h-4 w-4 text-white" />
        </button>
      </motion.div>
    );
  }

  const tasks = todoData.tasks || [];
  const currentTasks = tasks.filter(task => task.status === 'in_progress');
  const hasCurrentTasks = currentTasks.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm"
    >
      {/* Compact Header */}
      <div 
        className="px-4 py-2 cursor-pointer hover:bg-gray-700/30 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">
                {todoData.title}
              </span>
            </div>
            
            {/* Project Progress */}
            {todoData.project && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">
                  {todoData.project.progress}%
                </span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center space-x-2 text-xs">
              {hasCurrentTasks && (
                <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                  <Target className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-400 font-medium">{currentTasks.length}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1 bg-gray-600/20 px-2 py-1 rounded">
                <span className="text-gray-400">{todoData.stats.completed}/{todoData.stats.total}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Minimize button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-1 rounded hover:bg-gray-600/30 transition-colors"
              title="Minimiser la TodoList"
            >
              <Minimize2 className="h-3 w-3 text-gray-400 hover:text-white" />
            </button>
            
            {/* Expand/Collapse button */}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-gray-700/50">
              {/* Project Info */}
              {todoData.project && (
                <div className="py-2 border-b border-gray-700/30 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">
                      {todoData.project.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-400">
                        {todoData.project.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {todoData.project.description && (
                    <p className="text-xs text-gray-400 mb-2">
                      {todoData.project.description}
                    </p>
                  )}
                  
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${todoData.project.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const count = todoData.stats[status as keyof typeof todoData.stats] || 0;
                  const Icon = config.icon;
                  return (
                    <div
                      key={status}
                      className={`${config.bg} ${config.border} border rounded p-2 text-center`}
                    >
                      <Icon className={`h-3 w-3 mx-auto ${config.color} mb-1`} />
                      <div className={`text-xs font-bold ${config.color}`}>
                        {count}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {config.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current Tasks */}
              {hasCurrentTasks && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-blue-400 mb-2">
                    Tâches en cours:
                  </h4>
                  {currentTasks.slice(0, 3).map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 rounded p-2"
                    >
                      <Target className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-white truncate flex-1">
                        {task.content}
                      </span>
                      {task.priority && task.priority !== 'medium' && (
                        <span className={`text-xs px-1 py-0.5 rounded text-xs ${
                          task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {currentTasks.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{currentTasks.length - 3} autres tâches en cours
                    </div>
                  )}
                </div>
              )}

              {/* No current tasks message */}
              {!hasCurrentTasks && tasks.length > 0 && (
                <div className="text-center py-2">
                  <div className="text-xs text-gray-400">
                    Aucune tâche en cours
                  </div>
                </div>
              )}

              {/* No tasks at all */}
              {tasks.length === 0 && (
                <div className="text-center py-2">
                  <div className="text-xs text-gray-400">
                    Aucune tâche définie
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatHeaderTodoList;