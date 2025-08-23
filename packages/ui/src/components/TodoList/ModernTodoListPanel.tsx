import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable, DragEndEvent } from '@dnd-kit/core';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/button';
import { 
  X, Clock, Plus, Trash2, AlertTriangle, Download, Upload,
  CheckCircle, Target, Trophy,
  Search, Maximize2, Minimize2,
  GripVertical, Calendar
} from 'lucide-react';
import { useEnhancedTodoList, EnhancedTodoItem } from './useEnhancedTodoList';

// Sortable task item component
interface SortableTaskItemProps {
  task: EnhancedTodoItem;
  onUpdateStatus: (id: string, status: EnhancedTodoItem['status']) => void;
  onDelete: (id: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, 
  onUpdateStatus, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Status configuration
  const STATUS_CONFIG: Record<string, { 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
    color: string;
    glow: string;
    border: string;
    bg: string;
  }> = {
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
    }
  };

  // Priority configuration
  const PRIORITY_CONFIG: Record<string, { 
    label: string; 
    color: string;
    glow: string;
    border: string;
  }> = {
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

  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`mb-3 rounded-xl border ${statusConfig.border} ${statusConfig.bg} backdrop-blur-sm hover:shadow-lg transition-all duration-200 ${isDragging ? 'z-10 rotate-3' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Drag handle */}
            <div 
              {...listeners}
              className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            {/* Task content */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {task.content}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${priorityConfig.color} text-white`}>
                    {priorityConfig.label}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mt-2 space-x-3">
                <button
                  onClick={() => onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                  className={`flex items-center text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    task.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {task.status === 'completed' ? 'Terminé' : 'Marquer terminé'}
                </button>
                
                {task.category && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                    {task.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Delete button */}
          <Button
            onClick={() => onDelete(task.id)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Status indicator */}
        <div className="mt-3 flex items-center">
          <div className={`flex items-center text-xs font-medium bg-gradient-to-r ${statusConfig.color} bg-clip-text text-transparent`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </div>
          <div className="ml-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            Ajouté aujourd'hui
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main modern todo list panel component
export function ModernTodoListPanel() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // In a real implementation, we would update the task order here
      console.log(`Task ${String(active.id)} moved to position of task ${String(over.id)}`);
      // This would require updating the task order in the state
    }
  }, []);

  // Filter tasks
  const filteredTodos = todoData?.todos.filter(todo => {
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesSearch = todo.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importTodoList(file);
      event.target.value = ''; // Reset input
    }
  };


  // Panel dimensions
  const panelWidth = isMaximized ? 'w-[90vw]' : 'w-96';
  const panelHeight = isMaximized ? 'h-[90vh]' : 'max-h-[calc(100vh-2rem)]';

  // Only show the panel when it's visible
  if (!isTodoListVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`fixed left-4 top-4 ${panelWidth} ${panelHeight} z-50`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50" />
      
      {/* Main container */}
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

        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-cyan-400" />
              Mission Control
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsMaximized(!isMaximized)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setIsTodoListVisible(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          {todoData && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-amber-500/20 rounded-lg p-2 text-center">
                <div className="text-amber-400 text-sm font-bold">{todoData.stats.pending}</div>
                <div className="text-amber-300 text-xs">À faire</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                <div className="text-blue-400 text-sm font-bold">{todoData.stats.in_progress}</div>
                <div className="text-blue-300 text-xs">En cours</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-2 text-center">
                <div className="text-green-400 text-sm font-bold">{todoData.stats.completed}</div>
                <div className="text-green-300 text-xs">Terminé</div>
              </div>
            </div>
          )}
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher des missions..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all" className="bg-gray-800">Toutes</option>
              <option value="pending" className="bg-gray-800">À faire</option>
              <option value="in_progress" className="bg-gray-800">En cours</option>
              <option value="completed" className="bg-gray-800">Terminé</option>
            </select>
          </div>
        </div>

        {/* Add task form */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Nouvelle mission..."
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-medium"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
            </div>
            <select
              value={newTodoPriority}
              onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
              className="bg-white/10 border border-white/20 rounded-lg text-white py-3 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="low" className="bg-gray-800">🌱</option>
              <option value="medium" className="bg-gray-800">🔸</option>
              <option value="high" className="bg-gray-800">⚡</option>
              <option value="critical" className="bg-gray-800">🔥</option>
            </select>
            <Button
              onClick={addTodo}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task list with drag and drop */}
        <div className="flex-1 overflow-y-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredTodos.map(todo => todo.id)} 
              strategy={verticalListSortingStrategy}
            >
              {filteredTodos.length > 0 ? (
                filteredTodos.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onUpdateStatus={updateTodoStatus}
                    onDelete={removeTodo}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="font-medium">Aucune mission en cours</p>
                  <p className="text-sm mt-1">Ajoutez votre première mission pour commencer</p>
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-700/50 flex justify-between">
          <div className="flex space-x-2">
            <label className="cursor-pointer">
              <Upload className="h-5 w-5 text-gray-400 hover:text-white transition-colors" />
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            <Button
              onClick={exportTodoList}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            {filteredTodos.length} mission{filteredTodos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </motion.div>
  );
}