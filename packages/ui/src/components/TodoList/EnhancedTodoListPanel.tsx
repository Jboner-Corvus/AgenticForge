import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/button';
import { 
  X, Clock, Plus, Trash2, AlertTriangle, Download, Upload,
  CheckCircle, Shield, Target, Trophy, Pause, XCircle,
  Search, Maximize2, Minimize2, User, Tag,
  TrendingUp
} from 'lucide-react';
import { useEnhancedTodoList } from './useEnhancedTodoList';

// Enhanced configurations
const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    label: 'À FAIRE', 
    color: 'from-amber-500 to-amber-400',
    glow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    bg: 'bg-amber-50 dark:bg-amber-900/20'
  },
  in_progress: { 
    icon: Target, 
    label: 'EN COURS', 
    color: 'from-blue-500 to-blue-400',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-500/30',
    bg: 'bg-blue-50 dark:bg-blue-900/20'
  },
  completed: { 
    icon: Trophy, 
    label: 'TERMINÉ', 
    color: 'from-green-500 to-green-400',
    glow: 'shadow-green-500/30',
    border: 'border-green-500/30',
    bg: 'bg-green-50 dark:bg-green-900/20'
  },
  blocked: { 
    icon: Pause, 
    label: 'BLOQUÉ', 
    color: 'from-red-500 to-red-400',
    glow: 'shadow-red-500/30',
    border: 'border-red-500/30',
    bg: 'bg-red-50 dark:bg-red-900/20'
  },
  cancelled: { 
    icon: XCircle, 
    label: 'ANNULÉ', 
    color: 'from-gray-500 to-gray-400',
    glow: 'shadow-gray-500/30',
    border: 'border-gray-500/30',
    bg: 'bg-gray-50 dark:bg-gray-900/20'
  }
};

const PRIORITY_CONFIG = {
  critical: { 
    label: '🔥 CRITIQUE', 
    color: 'from-red-600 to-red-500',
    glow: 'shadow-red-500/30',
    border: 'border-red-500/50'
  },
  high: { 
    label: '⚡ HIGH', 
    color: 'from-orange-600 to-orange-500',
    glow: 'shadow-orange-500/30',
    border: 'border-orange-500/50'
  },
  medium: { 
    label: '🔸 MEDIUM', 
    color: 'from-yellow-600 to-yellow-500',
    glow: 'shadow-yellow-500/30',
    border: 'border-yellow-500/50'
  },
  low: { 
    label: '🌱 LOW', 
    color: 'from-green-600 to-green-500',
    glow: 'shadow-green-500/30',
    border: 'border-green-500/50'
  }
};

export function EnhancedTodoListPanel() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isMaximized, setIsMaximized] = useState(false);
  
  const { 
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
  } = useEnhancedTodoList();
  
  const isTodoListVisible = useUIStore((state) => state.isTodoListVisible);
  const setIsTodoListVisible = useUIStore((state) => state.setIsTodoListVisible);

  // Filtrage avancé
  const filteredTodos = todoData?.todos.filter(todo => {
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesSearch = todo.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    return matchesStatus && matchesSearch && matchesPriority;
  }) || [];

  // Only show the panel when it's visible
  if (!isTodoListVisible) return null;

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importTodoList(file);
      event.target.value = ''; // Reset input
    }
  };

  const formatTime = (minutes: number | undefined) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const panelWidth = isMaximized ? 'w-[90vw]' : 'w-96';
  const panelHeight = isMaximized ? 'h-[90vh]' : 'max-h-[calc(100vh-2rem)]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`fixed left-4 top-4 ${panelWidth} ${panelHeight} z-50`}
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50" />
      
      {/* CONTAINER PRINCIPAL */}
      <div className="relative h-full flex flex-col backdrop-blur-sm rounded-2xl border border-white/10 bg-gray-800/90">
        {/* Recovery alert */}
        <AnimatePresence>
          {isRecovered && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30"
            >
              <div className="flex items-center justify-between text-amber-400">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Récupération après crash</span>
                </div>
                <Button
                  onClick={acknowledgeRecovery}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Vos tâches ont été récupérées automatiquement.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Header */}
        {todoData?.project && (
          <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white truncate">
                {todoData.project.name}
              </h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">
                  {todoData.project.progress}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
              {todoData.project.description}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                style={{ width: `${todoData.project.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats at the top */}
        <div className="p-3 border-b border-gray-700/50">
          <div className="grid grid-cols-5 gap-1 text-center">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = todoData?.stats[status as keyof typeof todoData.stats] || 0;
              const Icon = config.icon;
              return (
                <motion.div
                  key={status}
                  whileHover={{ scale: 1.05 }}
                  className={`p-2 rounded-lg ${config.bg} border ${config.border}`}
                >
                  <Icon className={`h-4 w-4 mx-auto ${config.color.includes('red') ? 'text-red-500' : config.color.includes('blue') ? 'text-blue-500' : config.color.includes('green') ? 'text-green-500' : config.color.includes('amber') ? 'text-amber-500' : 'text-gray-500'}`} />
                  <div className="text-sm font-bold mt-1">
                    {count}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {config.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Header with title and controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-lg font-bold text-white truncate">
            {todoData?.title || 'Liste des Tâches'}
          </h2>
          <div className="flex items-center space-x-1">
            {/* Maximize Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 h-8 w-8 text-gray-400 hover:text-white"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Export button */}
            <Button
              onClick={exportTodoList}
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 text-gray-400 hover:text-white"
              title="Exporter la todo list"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {/* Import button */}
            <label htmlFor="enhanced-todo-import" className="cursor-pointer">
              <input
                id="enhanced-todo-import"
                name="enhanced-todo-import"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 text-gray-400 hover:text-white"
                title="Importer une todo list"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
            </label>
            
            {/* Close button */}
            <Button
              onClick={() => setIsTodoListVisible(false)}
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 text-gray-400 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Advanced filters */}
        <div className="p-3 border-b border-gray-700/50 bg-gray-800/50">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-600 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all" className="bg-gray-800">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status} className="bg-gray-800">
                  {config.label}
                </option>
              ))}
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-600 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all" className="bg-gray-800">Toutes les priorités</option>
              {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                <option key={priority} value={priority} className="bg-gray-800">
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Add new todo form */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Nouvelle tâche..."
              className="flex-1 px-3 py-2 text-sm border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            />
            <select
              value={newTodoPriority}
              onChange={(e) => setNewTodoPriority(e.target.value as 'critical' | 'high' | 'medium' | 'low')}
              className="px-2 py-2 text-sm border border-gray-600 rounded-lg bg-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                <option key={priority} value={priority} className="bg-gray-800">
                  {config.label}
                </option>
              ))}
            </select>
            <Button
              onClick={addTodo}
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-gray-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Todo items list */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {filteredTodos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-gray-400">
                  Aucune tâche
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Ajoutez une nouvelle tâche pour commencer
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {[...filteredTodos]
                  .sort((a, b) => {
                    // Tri par statut : en cours, à faire, bloqué, terminé, annulé
                    const statusOrder = { 
                      in_progress: 0, 
                      pending: 1, 
                      blocked: 2,
                      completed: 3,
                      cancelled: 4
                    };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((todo) => {
                    const statusConfig = STATUS_CONFIG[todo.status];
                    const priorityConfig = PRIORITY_CONFIG[todo.priority];
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <motion.div 
                        key={todo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        whileHover={{ scale: 1.02 }}
                        className={`border rounded-lg p-3 ${statusConfig.bg} ${statusConfig.border} shadow-sm`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <button 
                              onClick={() => updateTodoStatus(
                                todo.id, 
                                todo.status === 'completed' ? 'pending' : 
                                todo.status === 'in_progress' ? 'completed' : 
                                todo.status === 'blocked' ? 'pending' :
                                todo.status === 'cancelled' ? 'pending' : 'in_progress'
                              )}
                              className={`mt-1 p-1 rounded ${statusConfig.color.includes('red') ? 'text-red-500' : statusConfig.color.includes('blue') ? 'text-blue-500' : statusConfig.color.includes('green') ? 'text-green-500' : statusConfig.color.includes('amber') ? 'text-amber-500' : 'text-gray-500'} hover:bg-gray-200 dark:hover:bg-gray-600`}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </button>
                            <div className="flex-1">
                              <p className={`font-medium ${todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                {todo.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig.border} ${priorityConfig.color.includes('red') ? 'text-red-500' : priorityConfig.color.includes('orange') ? 'text-orange-500' : priorityConfig.color.includes('yellow') ? 'text-yellow-500' : priorityConfig.color.includes('green') ? 'text-green-500' : 'text-gray-500'}`}>
                                  {priorityConfig.label}
                                </span>
                                {todo.category && (
                                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    #{todo.category}
                                  </span>
                                )}
                                {todo.estimatedTime && (
                                  <span className="text-xs bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(todo.estimatedTime)}
                                  </span>
                                )}
                                {todo.assignedTo && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {todo.assignedTo}
                                  </span>
                                )}
                              </div>
                              {todo.tags && todo.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {todo.tags.map((tag, index) => (
                                    <span key={index} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => removeTodo(todo.id)}
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progression</span>
                            <span>
                              {todo.status === 'completed' ? '100%' : 
                               todo.status === 'in_progress' ? '66%' : 
                               todo.status === 'blocked' ? '33%' : '0%'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                todo.status === 'completed' ? 'bg-green-500' : 
                                todo.status === 'in_progress' ? 'bg-blue-500' : 
                                todo.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                              }`}
                              style={{ 
                                width: todo.status === 'completed' ? '100%' : 
                                       todo.status === 'in_progress' ? '66%' : 
                                       todo.status === 'blocked' ? '33%' : '0%' 
                              }}
                            />
                          </div>
                        </div>
                        
                        {todo.status === 'in_progress' && (
                          <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                            <span>En cours de traitement...</span>
                          </div>
                        )}
                        
                        {todo.status === 'completed' && (
                          <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Tâche terminée !</span>
                          </div>
                        )}
                        
                        {todo.status === 'blocked' && (
                          <div className="mt-2 flex items-center text-xs text-red-600 dark:text-red-400">
                            <Pause className="h-3 w-3 mr-1" />
                            <span>Tâche bloquée</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-700/50 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>
              {filteredTodos.length} tâche{filteredTodos.length !== 1 ? 's' : ''} affichée{filteredTodos.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Connexion sécurisée</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}