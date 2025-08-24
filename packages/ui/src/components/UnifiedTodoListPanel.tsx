import React, { useState, useEffect, useRef } from 'react';
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
  Minimize2,
  Pin,
  PinOff,
  List,
  MessageSquare,
  Check,
  X,
  Plus,
  Search,
  Filter,
  Eye,
  Brain,
  Zap,
  Users,
  Trash2
} from 'lucide-react';


// Unified interfaces for todo list
interface UnifiedTodoItem {
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
  notes?: string;
  comments?: TaskComment[];
  executionHistory?: TaskExecution[];
  resources?: TaskResource[];
  agentActions?: AgentAction[];
  progress?: number; // 0-100 for multi-step tasks
}

interface TaskComment {
  id: string;
  content: string;
  author: string;
  timestamp: number;
}

interface TaskExecution {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'started' | 'paused' | 'completed' | 'failed';
  notes?: string;
}

interface TaskResource {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'link' | 'file';
}

interface AgentAction {
  id: string;
  action: string;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
}

interface UnifiedProject {
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

interface UnifiedTodoData {
  type: 'unified_todo';
  title: string;
  timestamp: number;
  project?: UnifiedProject | null;
  tasks?: UnifiedTodoItem[];
  todos?: UnifiedTodoItem[];
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    cancelled: number;
    total: number;
    projectProgress?: number;
  };
  agentContext?: {
    currentAgent?: string;
    agentThoughts?: AgentThought[];
    toolExecutions?: ToolExecution[];
    executionProgress?: ExecutionProgress;
  };
  collaborators?: Collaborator[];
}

interface AgentThought {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  type: 'reasoning' | 'planning' | 'reflection';
}

interface ToolExecution {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

interface ExecutionProgress {
  taskId: string;
  step: number;
  totalSteps: number;
  description: string;
  timestamp: number;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  currentTaskId?: string;
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

// Priority configuration
const PRIORITY_CONFIG = {
  low: { 
    label: '🌱 LOW', 
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  medium: { 
    label: '⚡ MEDIUM', 
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  high: { 
    label: '🔥 HIGH', 
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  critical: { 
    label: '🧨 CRITICAL', 
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  }
};

export const UnifiedTodoListPanel: React.FC = () => {
  const [todoData, setTodoData] = useState<UnifiedTodoData | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [agentViewState, setAgentViewState] = useState({
    showThoughts: false,
    showToolExecution: false,
    showProgress: false
  });
  const [collaborationState, setCollaborationState] = useState({
    showCollaborators: false,
    showPresence: false
  });
  const lastMessageRef = useRef<string>(''); // Add this ref to track last message
  
  // Get auth token and session ID from store
  

  // Listen for unified todo messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'chat_header_todo' || event.data.type === 'unified_todo' || event.data.type === 'todo_list')) {
        console.log('📝 [UnifiedTodoListPanel] Unified todo message received!', event.data);
        
        // Create a string representation of the message data for deduplication
        const messageString = JSON.stringify(event.data);
        
        // Check if this is the same as the last message we processed
        if (messageString === lastMessageRef.current) {
          console.log('📝 [UnifiedTodoListPanel] Duplicate message detected, skipping...');
          return; // Skip processing duplicate messages
        }
        
        // Store this message as the last processed message
        lastMessageRef.current = messageString;
        
        // Handle todo_list messages from the backend
        let backendData;
        if (event.data.type === 'todo_list') {
          // Extract data from todo_list message format
          backendData = event.data.data || event.data;
        } else {
          backendData = event.data.data;
        }
        
        if (backendData) {
          const unifiedData: UnifiedTodoData = {
            type: 'unified_todo',
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
            },
            agentContext: backendData.agentContext || null,
            collaborators: backendData.collaborators || null
          };
          
          setTodoData(unifiedData);
          setIsExpanded(true);
          setIsMinimized(false);
          setIsVisible(true);
          setIsPinned(true);
          console.log('📤 [UnifiedTodoListPanel] Todo list updated and auto-pinned');
        }
      } else if (event.data && event.data.type === 'toggle_chat_todo_list') {
        // Toggle visibility when receiving toggle message from header
        const newVisibility = event.data.show !== undefined ? event.data.show : !isVisible;
        setIsVisible(newVisibility);
        
        // If showing todo list and there's data, also set it as pinned
        if (newVisibility && todoData) {
          setIsPinned(true);
          setIsMinimized(false);
        } else if (!newVisibility) {
          setIsPinned(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isVisible, todoData]);

  // Don't render if no data or not visible
  if (!todoData || !isVisible) {
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
  
  // Filter tasks based on filter and search query
  const filteredTasks = tasks.filter(task => {
    // Apply status filter
    if (filter !== 'all' && task.status !== filter) {
      return false;
    }
    
    // Apply search query
    if (searchQuery && !task.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const currentTasks = tasks.filter(task => task.status === 'in_progress');
  const hasCurrentTasks = currentTasks.length > 0;

  // Focus a task
  const focusTask = (taskId: string) => {
    setFocusedTaskId(taskId);
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      // Create the prompt to delete a task using the unifiedTodoList tool
      
      
      // We'll use a simple approach for now - in a real implementation, 
      // you would want to handle the SSE response properly
      console.log('Deleting task with ID:', taskId);
      
      // Send message to backend to delete task
      // This is a simplified implementation - in practice, you'd want to handle the response
      // and update the UI accordingly
      
      
      // For now, we'll just simulate the deletion by updating the local state
      if (todoData) {
        const updatedTasks = todoData.tasks?.filter(task => task.id !== taskId) || [];
        const updatedStats = { ...todoData.stats };
        
        // Update stats based on the deleted task status
        const deletedTask = todoData.tasks?.find(task => task.id === taskId);
        if (deletedTask) {
          switch (deletedTask.status) {
            case 'pending':
              updatedStats.pending = Math.max(0, updatedStats.pending - 1);
              break;
            case 'in_progress':
              updatedStats.in_progress = Math.max(0, updatedStats.in_progress - 1);
              break;
            case 'completed':
              updatedStats.completed = Math.max(0, updatedStats.completed - 1);
              break;
            case 'blocked':
              updatedStats.blocked = Math.max(0, updatedStats.blocked - 1);
              break;
            case 'cancelled':
              updatedStats.cancelled = Math.max(0, updatedStats.cancelled - 1);
              break;
          }
          updatedStats.total = Math.max(0, updatedStats.total - 1);
        }
        
        setTodoData({
          ...todoData,
          tasks: updatedTasks,
          stats: updatedStats
        });
      }
      
      // In a full implementation, you would call the API:
      /*
      await sendMessage(
        deleteTaskPrompt,
        authToken,
        sessionId,
        () => {}, // onMessage handler
        (error) => console.error('Error deleting task:', error) // onError handler
      );
      */
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Add a new task
  const addTask = async () => {
    if (!newTaskContent.trim()) return;
    
    try {
      // Create a new task object
      const newTask: UnifiedTodoItem = {
        id: `task_${Date.now()}`,
        content: newTaskContent,
        status: 'pending',
        priority: newTaskPriority,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Update local state immediately for better UX
      if (todoData) {
        const updatedTasks = [...(todoData.tasks || []), newTask];
        const updatedStats = {
          ...todoData.stats,
          pending: todoData.stats.pending + 1,
          total: todoData.stats.total + 1
        };
        
        setTodoData({
          ...todoData,
          tasks: updatedTasks,
          stats: updatedStats
        });
      }
      
      // Reset form
      setNewTaskContent('');
      setIsAddingTask(false);
      
      // In a full implementation, you would call the API to persist the task:
      /*
      const addTaskPrompt = `Please add a new task with content "${newTaskContent}" and priority "${newTaskPriority}" using the unifiedTodoList tool with action "create_task".`;
      
      await sendMessage(
        addTaskPrompt,
        authToken,
        sessionId,
        () => {}, // onMessage handler
        (error) => console.error('Error adding task:', error) // onError handler
      );
      */
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Toggle agent thoughts view
  const toggleAgentThoughts = () => {
    setAgentViewState(prev => ({
      ...prev,
      showThoughts: !prev.showThoughts
    }));
  };

  // Toggle tool execution view
  const toggleToolExecution = () => {
    setAgentViewState(prev => ({
      ...prev,
      showToolExecution: !prev.showToolExecution
    }));
  };

  // Toggle collaborators view
  const toggleCollaborators = () => {
    setCollaborationState(prev => ({
      ...prev,
      showCollaborators: !prev.showCollaborators
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm transition-all duration-300 ${
        isPinned 
          ? 'sticky top-0 z-40 shadow-lg shadow-gray-900/20 border-yellow-400/30' 
          : ''
      }`}
    >
      {/* Compact Header */}
      <div 
        className="px-5 py-3 cursor-pointer hover:bg-gray-700/40 transition-colors duration-200 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white">
                {todoData.title}
              </span>
            </div>
            
            {/* Project Progress */}
            {todoData.project && (
              <div className="flex items-center space-x-2 bg-cyan-500/20 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">
                  {todoData.project.progress}%
                </span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-3 text-sm">
              {hasCurrentTasks && (
                <div className="flex items-center space-x-1.5 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">{currentTasks.length}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1.5 bg-gray-600/30 px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">{todoData.stats.completed}/{todoData.stats.total}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View mode toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode(viewMode === 'summary' ? 'detailed' : 'summary');
              }}
              className="p-2 rounded-lg hover:bg-gray-600/40 transition-colors text-gray-300 hover:text-white"
              title={viewMode === 'summary' ? 'Voir les détails' : 'Voir le résumé'}
            >
              {viewMode === 'summary' ? (
                <List className="h-5 w-5" />
              ) : (
                <Target className="h-5 w-5" />
              )}
            </button>

            {/* Pin/Unpin button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPinned(!isPinned);
              }}
              className={`p-2 rounded-lg hover:bg-gray-600/40 transition-colors ${
                isPinned ? 'text-yellow-400' : 'text-gray-300 hover:text-white'
              }`}
              title={isPinned ? 'Désépingler la TodoList' : 'Épingler la TodoList'}
            >
              {isPinned ? (
                <PinOff className="h-5 w-5" />
              ) : (
                <Pin className="h-5 w-5" />
              )}
            </button>

            {/* Minimize button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-2 rounded-lg hover:bg-gray-600/40 transition-colors text-gray-300 hover:text-white"
              title="Minimiser la TodoList"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            
            {/* Expand/Collapse button */}
            <div className="p-2 rounded-lg bg-gray-700/50">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-300" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-300" />
              )}
            </div>
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
                <div className="py-3 border-b border-gray-700/30 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Target className="h-5 w-5 text-cyan-400 mr-2" />
                      {todoData.project.name}
                    </h3>
                    <div className="flex items-center space-x-2 bg-cyan-500/20 px-3 py-1.5 rounded-full">
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-bold text-cyan-400">
                        {todoData.project.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {todoData.project.description && (
                    <p className="text-sm text-gray-300 mb-3">
                      {todoData.project.description}
                    </p>
                  )}
                  
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${todoData.project.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* View Mode: Summary */}
              {viewMode === 'summary' && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const count = todoData.stats[status as keyof typeof todoData.stats] || 0;
                      const Icon = config.icon;
                      return (
                        <div
                          key={status}
                          className={`${config.bg} ${config.border} border rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer transform hover:scale-105`}
                        >
                          <Icon className={`h-5 w-5 mx-auto ${config.color} mb-2`} />
                          <div className={`text-lg font-bold ${config.color}`}>
                            {count}
                          </div>
                          <div className="text-xs text-gray-300 truncate">
                            {config.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Tasks */}
                  {hasCurrentTasks && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Tâches en cours:
                      </h4>
                      {currentTasks.slice(0, 3).map((task) => {
                        const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                        return (
                          <div 
                            key={task.id}
                            className="flex items-center space-x-3 bg-blue-500/15 border border-blue-500/30 rounded-lg p-3 hover:bg-blue-500/20 transition-colors duration-200 cursor-pointer"
                            onClick={() => focusTask(task.id)}
                          >
                            <Target className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white truncate">
                                {task.content}
                              </div>
                            </div>
                            {task.priority && task.priority !== 'medium' && (
                              <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig.bg} ${priorityConfig.color} font-medium whitespace-nowrap`}>
                                {priorityConfig.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      
                      {currentTasks.length > 3 && (
                        <div className="text-xs text-gray-400 text-center py-2">
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
                </>
              )}

              {/* View Mode: Detailed */}
              {viewMode === 'detailed' && (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher des tâches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')}
                        className="pl-8 pr-3 py-1.5 text-sm bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="all">Toutes</option>
                        <option value="pending">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminées</option>
                      </select>
                    </div>
                  </div>

                  {/* Add Task Form */}
                  {isAddingTask ? (
                    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                      <div className="flex flex-col space-y-2">
                        <textarea
                          value={newTaskContent}
                          onChange={(e) => setNewTaskContent(e.target.value)}
                          placeholder="Description de la tâche..."
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">🌱 LOW</option>
                            <option value="medium">⚡ MEDIUM</option>
                            <option value="high">🔥 HIGH</option>
                            <option value="critical">🧨 CRITICAL</option>
                          </select>
                          <div className="flex space-x-1">
                            <button
                              onClick={addTask}
                              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                setIsAddingTask(false);
                                setNewTaskContent('');
                              }}
                              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter une tâche</span>
                    </button>
                  )}

                  {/* Task List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        Aucune tâche trouvée
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const statusConfig = STATUS_CONFIG[task.status];
                        const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                        const Icon = statusConfig.icon;
                        
                        const isFocused = focusedTaskId === task.id;
                        
                        return (
                          <div 
                            key={task.id}
                            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${
                              isFocused 
                                ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                                : `${statusConfig.bg} ${statusConfig.border}`
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <button 
                                  onClick={() => {
                                    // TODO: Update task status logic
                                  }}
                                  className={`mt-1 p-2 rounded-full ${statusConfig.color} hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
                                >
                                  <Icon className="h-5 w-5" />
                                </button>
                                <div className="flex-1">
                                  <div 
                                    className={`font-medium cursor-pointer text-base ${
                                      task.status === 'completed' 
                                        ? 'line-through text-gray-500' 
                                        : 'text-white'
                                    }`}
                                    onClick={() => focusTask(task.id)}
                                  >
                                    {task.content}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${priorityConfig.bg} ${priorityConfig.color} font-medium`}>
                                      {priorityConfig.label}
                                    </span>
                                    {task.category && (
                                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-medium">
                                        #{task.category}
                                      </span>
                                    )}
                                    {task.tags && task.tags.map(tag => (
                                      <span key={tag} className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full font-medium">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <button
                                  onClick={() => focusTask(task.id)}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors"
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-full transition-colors"
                                  title="Supprimer la tâche"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Progression</span>
                                <span>
                                  {task.status === 'completed' ? '100%' : 
                                   task.status === 'in_progress' ? (task.progress || '66%') : '25%'}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-500' : 
                                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                                  }`}
                                  style={{ 
                                    width: task.status === 'completed' ? '100%' : 
                                           task.status === 'in_progress' ? `${task.progress || 66}%` : '25%' 
                                  }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Status indicators */}
                            <div className="mt-3 flex items-center text-xs">
                              {task.status === 'in_progress' && (
                                <div className="flex items-center text-blue-400">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                                  <span>En cours...</span>
                                </div>
                              )}
                              {task.status === 'completed' && (
                                <div className="flex items-center text-green-400">
                                  <Check className="h-3 w-3 mr-1" />
                                  <span>Tâche terminée</span>
                                </div>
                              )}
                              {task.status === 'blocked' && (
                                <div className="flex items-center text-red-400">
                                  <Pause className="h-3 w-3 mr-1" />
                                  <span>Bloquée</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })

                    )}
                  </div>

                  {/* Agent Context Section */}
                  {todoData.agentContext && (
                    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center">
                          <Brain className="h-4 w-4 mr-1" />
                          Contexte de l'agent
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={toggleAgentThoughts}
                            className={`p-1 rounded ${agentViewState.showThoughts ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                            title="Afficher les pensées"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                          <button
                            onClick={toggleToolExecution}
                            className={`p-1 rounded ${agentViewState.showToolExecution ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                            title="Afficher les exécutions"
                          >
                            <Zap className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      {agentViewState.showThoughts && todoData.agentContext.agentThoughts && (
                        <div className="text-xs text-gray-300 space-y-1 mt-2">
                          {todoData.agentContext.agentThoughts.slice(0, 3).map(thought => (
                            <div key={thought.id} className="bg-gray-700/50 p-2 rounded">
                              <div className="font-medium text-cyan-300">{thought.type}</div>
                              <div>{thought.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {agentViewState.showToolExecution && todoData.agentContext.toolExecutions && (
                        <div className="text-xs text-gray-300 space-y-1 mt-2">
                          {todoData.agentContext.toolExecutions.slice(0, 3).map(execution => (
                            <div key={execution.id} className="bg-gray-700/50 p-2 rounded">
                              <div className="font-medium text-cyan-300">{execution.toolName}</div>
                              <div className="text-gray-400">
                                Status: {execution.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collaborators Section */}
                  {todoData.collaborators && todoData.collaborators.length > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-purple-400 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Collaborateurs
                        </h4>
                        <button
                          onClick={toggleCollaborators}
                          className={`p-1 rounded ${collaborationState.showCollaborators ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
                          title="Afficher les collaborateurs"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                      
                      {collaborationState.showCollaborators && (
                        <div className="flex flex-wrap gap-2">
                          {todoData.collaborators.map(collaborator => (
                            <div 
                              key={collaborator.id} 
                              className="flex items-center space-x-1 bg-gray-700/50 px-2 py-1 rounded-full"
                            >
                              <div className={`w-2 h-2 rounded-full ${
                                collaborator.status === 'online' ? 'bg-green-500' :
                                collaborator.status === 'busy' ? 'bg-orange-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="text-xs text-gray-300">{collaborator.name}</span>
                              {collaborator.currentTaskId && (
                                <Target className="h-3 w-3 text-blue-400" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};