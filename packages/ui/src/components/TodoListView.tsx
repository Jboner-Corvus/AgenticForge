import React from 'react';
import { motion } from 'framer-motion';
import { Move } from 'lucide-react';
import { useDraggable } from '../lib/hooks/useDraggable';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

interface TodoListData {
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
  pending: { 
    emoji: '⏳', 
    label: 'À FAIRE', 
    desc: '⏳ En attente', 
    class: 'todo-pending',
    color: '#f59e0b'
  },
  in_progress: { 
    emoji: '🚀', 
    label: 'EN COURS', 
    desc: '🚀 En cours d\'exécution...', 
    class: 'todo-in-progress',
    color: '#3b82f6'
  },
  completed: { 
    emoji: '✅', 
    label: 'TERMINÉ', 
    desc: '✅ Tâche terminée', 
    class: 'todo-completed',
    color: '#10b981'
  }
};

const PRIORITY_CONFIG = {
  high: { 
    label: '🔥 HIGH', 
    bg: 'bg-red-100 text-red-800 border-red-200' 
  },
  medium: { 
    label: '⚡ MEDIUM', 
    bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
  },
  low: { 
    label: '🌱 LOW', 
    bg: 'bg-green-100 text-green-800 border-green-200' 
  }
};

const TodoListView: React.FC<{ data: TodoListData }> = ({ data }) => {
  const { title, timestamp, todos, stats } = data;
  const { position, handleDragStart, elementRef } = useDraggable({ x: 20, y: 120 });

  return (
    <div
      ref={elementRef}
      className="fixed z-40 shadow-2xl rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="w-full h-8 cursor-move bg-gray-800 flex items-center justify-center z-10"
        onMouseDown={handleDragStart}
      >
        <Move className="h-4 w-4 text-gray-400" />
      </div>
      <div className="overflow-y-auto flex-grow">
        <div className="container mx-auto p-4">
          <div className="header mb-6 pb-4 border-b border-gray-700">
            <h1 className="title text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
              🚀 {title}
            </h1>
          <p className="text-gray-400 text-sm opacity-80">
            Suivi intelligent des tâches • Temps réel
          </p>
          
          <div className="stats grid grid-cols-3 gap-4 mt-4">
            <div className="stat bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-lg p-4 text-center border border-amber-700/30 backdrop-blur-sm">
              <div className="stat-value text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {stats.pending}
              </div>
              <div className="stat-label text-xs text-gray-400 uppercase font-semibold tracking-wider mt-1">
                ⏳ À FAIRE
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.pending > 0 ? 'En attente' : 'Aucune'}
              </div>
            </div>
            
            <div className="stat bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-4 text-center border border-blue-700/30 backdrop-blur-sm">
              <div className="stat-value text-2xl font-bold" style={{ color: '#3b82f6' }}>
                {stats.in_progress}
              </div>
              <div className="stat-label text-xs text-gray-400 uppercase font-semibold tracking-wider mt-1">
                🚀 EN COURS
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.in_progress > 0 ? 'En cours d\'exécution' : 'Rien en cours'}
              </div>
            </div>
            
            <div className="stat bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-4 text-center border border-green-700/30 backdrop-blur-sm">
              <div className="stat-value text-2xl font-bold" style={{ color: '#10b981' }}>
                {stats.completed}
              </div>
              <div className="stat-label text-xs text-gray-400 uppercase font-semibold tracking-wider mt-1">
                ✅ TERMINÉ
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.completed > 0 ? 'Complétées' : 'Aucune encore'}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <div className="inline-flex items-center bg-cyan-900/30 px-3 py-1 rounded-full text-xs text-cyan-400 font-semibold border border-cyan-700/30">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Mise à jour automatique
            </div>
          </div>
        </div>
        
        <div id="todo-list" className="todo-list">
          {todos.length === 0 ? (
            <div className="empty-state text-center py-12 text-gray-500">
              <div className="empty-emoji text-5xl mb-4 animate-bounce">🎯</div>
              <h3 className="text-xl text-gray-300 mb-2">Aucune tâche active</h3>
              <p className="opacity-80">L'agent créera automatiquement des tâches lors de vos demandes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todos.map((todo, index) => {
                const status = STATUS_CONFIG[todo.status];
                const priority = PRIORITY_CONFIG[todo.priority];
                const progressWidth = todo.status === 'completed' ? '100%' : todo.status === 'in_progress' ? '66%' : '25%';
                const progressColor = todo.status === 'completed' ? '#10b981' : todo.status === 'in_progress' ? '#3b82f6' : '#6b7280';
                
                return (
                  <motion.div
                    key={todo.id}
                    className={`todo-item rounded-xl p-4 border backdrop-blur-sm transition-all duration-300 ${
                      todo.status === 'pending' 
                        ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/10 border-amber-700/30' 
                        : todo.status === 'in_progress' 
                          ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-700/30 animate-pulse' 
                          : 'bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-700/30'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-900/30 shadow-lg">
                          <span className="text-xl">{status.emoji}</span>
                        </div>
                        <div>
                          <div 
                            className="text-lg font-bold"
                            style={{ color: todo.status === 'completed' ? '#16a34a' : todo.status === 'in_progress' ? '#2563eb' : '#d97706' }}
                          >
                            {status.label}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            {status.desc}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${priority.bg} border`}>
                          {priority.label}
                        </span>
                        {todo.category && (
                          <div className="mt-2">
                            <span className="bg-purple-900/30 text-purple-300 border border-purple-700/30 px-2 py-1 rounded-full text-xs font-semibold">
                              #{todo.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p 
                      className={`mb-4 text-gray-300 ${todo.status === 'completed' ? 'line-through opacity-70' : ''}`}
                    >
                      {todo.content}
                    </p>
                    
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold" style={{ color: progressColor }}>
                          Progression
                        </span>
                        <span className="text-xs font-bold" style={{ color: progressColor }}>
                          {todo.status === 'completed' ? '100%' : todo.status === 'in_progress' ? '66%' : '25%'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: progressWidth, 
                            backgroundColor: progressColor 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {todo.status === 'in_progress' && (
                      <div className="mt-3 flex items-center gap-2 text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">L'agent travaille actuellement sur cette tâche...</span>
                      </div>
                    )}
                    
                    {todo.status === 'completed' && (
                      <div className="mt-3 bg-green-900/20 border border-green-700/30 px-3 py-2 rounded-lg flex items-center gap-2 text-green-400">
                        <span>✅</span>
                        <span className="text-sm font-medium">Tâche complétée avec succès !</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="text-center mt-8 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Généré par <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AgenticForge</span> •{' '}
            <span id="timestamp">
              {new Date(timestamp).toLocaleTimeString('fr-FR')}
            </span>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TodoListView;