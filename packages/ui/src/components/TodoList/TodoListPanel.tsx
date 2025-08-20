import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/button';
import { X, CheckCircle, Clock, Play, Plus, Trash2, AlertTriangle, Download, Upload } from 'lucide-react';
import { useTodoList } from './useTodoList';

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
  } = useTodoList();
  
  const isTodoListVisible = useUIStore((state) => state.isTodoListVisible);
  const setIsTodoListVisible = useUIStore((state) => state.setIsTodoListVisible);

  // Only show the panel when it's visible
  if (!isTodoListVisible) {
    return null;
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importTodoList(file);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="fixed left-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 flex flex-col max-h-[calc(100vh-5rem)]">
      {/* Recovery alert */}
      {isRecovered && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-200">
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
        </div>
      )}

      {/* Stats at the top */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {todoData?.stats.pending || 0}
            </div>
            <div className="text-xs text-amber-500 dark:text-amber-400">⏳ À FAIRE</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {todoData?.stats.in_progress || 0}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-400">🚀 EN COURS</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {todoData?.stats.completed || 0}
            </div>
            <div className="text-xs text-green-500 dark:text-green-400">✅ TERMINÉ</div>
          </div>
        </div>
      </div>
      
      {/* Header with title and controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {todoData?.title || 'Liste des Tâches'}
        </h2>
        <div className="flex items-center space-x-2">
          {/* Export button */}
          <Button
            onClick={exportTodoList}
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            title="Exporter la todo list"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {/* Import button */}
          <label htmlFor="simple-todo-import" className="cursor-pointer">
            <input
              id="simple-todo-import"
              name="simple-todo-import"
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
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
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Add new todo form */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Nouvelle tâche..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <select
            value={newTodoPriority}
            onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="low">🌱</option>
            <option value="medium">⚡</option>
            <option value="high">🔥</option>
          </select>
          <Button
            onClick={addTodo}
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Todo items list */}
      <div className="flex-1 overflow-y-auto p-4">
        {todoData?.todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-500 dark:text-gray-400">
              Aucune tâche
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Ajoutez une nouvelle tâche pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...(todoData?.todos || [])].sort((a, b) => {
              // Tri par statut : en cours, à faire, terminé
              const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
              return statusOrder[a.status] - statusOrder[b.status];
            }).map((todo) => {
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
                      <button 
                        onClick={() => updateTodoStatus(
                          todo.id, 
                          todo.status === 'completed' ? 'pending' : 
                          todo.status === 'in_progress' ? 'completed' : 'in_progress'
                        )}
                        className={`mt-1 p-1 rounded ${statusConfig.color} hover:bg-gray-200 dark:hover:bg-gray-600`}
                      >
                        <StatusIcon className="h-4 w-4" />
                      </button>
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
                      <span>En cours de traitement...</span>
                    </div>
                  )}
                  
                  {todo.status === 'completed' && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Tâche terminée !</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}