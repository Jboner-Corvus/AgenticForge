import { useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './EpicAnimations.css';
import { useCombinedStore as useStore } from '../../store';
import { Button } from '../ui/button';
import { 
  X, Clock, Plus, Trash2, AlertTriangle, Download, Upload,
  Star, Sparkles, Target, Rocket, Crown, Shield, Trophy,
  Search, Maximize2, Minimize2,
  Volume2, VolumeX
} from 'lucide-react';
import { useTodoList } from './useTodoList';

// CONFIGURATIONS ÉPIQUES
const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    label: '⏳ QUEUED', 
    color: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/50',
    particle: '✨'
  },
  in_progress: { 
    icon: Rocket, 
    label: '🚀 ACTIVE', 
    color: 'from-blue-400 to-cyan-500',
    glow: 'shadow-blue-500/50',
    particle: '⚡'
  },
  completed: { 
    icon: Trophy, 
    label: '🏆 CRUSHED', 
    color: 'from-green-400 to-emerald-500',
    glow: 'shadow-green-500/50',
    particle: '🎉'
  }
};

const PRIORITY_CONFIG = {
  high: { 
    label: '🔥 LEGENDARY', 
    color: 'from-red-500 to-pink-600',
    glow: 'shadow-red-500/50',
    border: 'border-red-500/30'
  },
  medium: { 
    label: '⚡ EPIC', 
    color: 'from-purple-500 to-indigo-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-500/30'
  },
  low: { 
    label: '🌟 RARE', 
    color: 'from-green-400 to-teal-500',
    glow: 'shadow-green-500/50',
    border: 'border-green-500/30'
  }
};

const THEMES = {
  cyberpunk: {
    bg: 'from-slate-900 via-purple-900 to-slate-900',
    panel: 'bg-black/80 border-cyan-500/50',
    accent: 'text-cyan-400'
  },
  neon: {
    bg: 'from-pink-900 via-purple-900 to-indigo-900',
    panel: 'bg-black/80 border-pink-500/50',
    accent: 'text-pink-400'
  },
  matrix: {
    bg: 'from-green-900 via-black to-green-900',
    panel: 'bg-black/90 border-green-500/50',
    accent: 'text-green-400'
  },
  galaxy: {
    bg: 'from-indigo-900 via-purple-900 to-pink-900',
    panel: 'bg-black/80 border-indigo-500/50',
    accent: 'text-indigo-400'
  }
};

export function EpicTodoListPanel() {
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('cyberpunk');
  const [isMaximized, setIsMaximized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showParticles, setShowParticles] = useState(true);
  const [comboPts, setComboPts] = useState(0);
  const containerControls = useAnimation();
  
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
  
  const isTodoListVisible = useStore((state) => state.isTodoListVisible);
  const setIsTodoListVisible = useStore((state) => state.setIsTodoListVisible);

  // EFFETS SONORES ÉPIQUES
  const playSound = (type: 'complete' | 'add' | 'delete' | 'levelup') => {
    if (!soundEnabled) return;
    // Sons générés via Web Audio API pour un effet futuriste
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    const frequencies = {
      complete: [440, 554, 659], // Accord majeur
      add: [262, 330, 392],
      delete: [220, 196, 174],
      levelup: [523, 659, 784, 1047]
    };
    
    frequencies[type].forEach((freq, i) => {
      setTimeout(() => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.setValueAtTime(freq, context.currentTime);
        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        osc.start();
        osc.stop(context.currentTime + 0.3);
      }, i * 100);
    });
  };

  // ANIMATIONS ÉPIQUES
  const handleCompleteTask = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 
                     currentStatus === 'in_progress' ? 'completed' : 'in_progress';
    
    updateTodoStatus(id, newStatus as 'pending' | 'in_progress' | 'completed');
    
    if (newStatus === 'completed') {
      playSound('complete');
      setComboPts(prev => prev + 100);
      // Explosion de particules !
      containerControls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 }
      });
    }
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo();
      playSound('add');
      setComboPts(prev => prev + 50);
    }
  };

  const handleDeleteTodo = (id: string) => {
    removeTodo(id);
    playSound('delete');
  };

  // FILTRAGE AVANCÉ
  const filteredTodos = todoData?.todos.filter(todo => {
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesSearch = todo.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  // PARTICULES FLOTTANTES
  const ParticleEffect = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-xs opacity-20"
          initial={{ x: Math.random() * 400, y: Math.random() * 600 }}
          animate={{
            x: Math.random() * 400,
            y: Math.random() * 600,
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {['⚡', '✨', '🚀', '💎', '🔥', '⭐'][Math.floor(Math.random() * 6)]}
        </motion.div>
      ))}
    </div>
  );

  if (!isTodoListVisible) return null;

  const theme = THEMES[currentTheme];
  const panelWidth = isMaximized ? 'w-[90vw]' : 'w-96';
  const panelHeight = isMaximized ? 'h-[90vh]' : 'max-h-[calc(100vh-2rem)]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`fixed left-4 top-4 ${panelWidth} ${panelHeight} z-50`}
    >
      {/* BACKGROUND ÉPIQUE */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} rounded-2xl ${theme.panel} shadow-2xl ${STATUS_CONFIG.in_progress.glow}`}>
        {showParticles && <ParticleEffect />}
      </div>

      {/* CONTAINER PRINCIPAL */}
      <motion.div
        animate={containerControls}
        className="relative h-full flex flex-col backdrop-blur-sm rounded-2xl border border-white/10"
      >
        {/* HEADER LÉGENDAIRE */}
        <div className="p-4 border-b border-white/10">
          {/* Recovery Alert ÉPIQUE */}
          <AnimatePresence>
            {isRecovered && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      <AlertTriangle className="h-5 w-5" />
                    </motion.div>
                    <span className="font-bold">🔄 SYSTÈME RÉCUPÉRÉ</span>
                  </div>
                  <Button
                    onClick={acknowledgeRecovery}
                    variant="ghost"
                    size="sm"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TITRE & COMBO POINTS */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-bold ${theme.accent} flex items-center gap-2`}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
                  <Crown className="h-6 w-6" />
                </motion.div>
                MISSION CONTROL
              </h2>
              <motion.div
                key={comboPts}
                initial={{ scale: 1.5, y: -10 }}
                animate={{ scale: 1, y: 0 }}
                className={`text-xs ${theme.accent} font-mono`}
              >
                COMBO: {comboPts.toLocaleString()} PTS
              </motion.div>
            </div>
            
            {/* CONTRÔLES ÉPIQUES */}
            <div className="flex items-center gap-1">
              {/* Theme Selector */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const themes = Object.keys(THEMES) as (keyof typeof THEMES)[];
                  const currentIndex = themes.indexOf(currentTheme);
                  const nextTheme = themes[(currentIndex + 1) % themes.length];
                  setCurrentTheme(nextTheme);
                }}
                className={`${theme.accent} hover:bg-white/10`}
              >
                <Sparkles className="h-4 w-4" />
              </Button>

              {/* Sound Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`${soundEnabled ? theme.accent : 'text-gray-500'} hover:bg-white/10`}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              {/* Particles Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowParticles(!showParticles)}
                className={`${showParticles ? theme.accent : 'text-gray-500'} hover:bg-white/10`}
              >
                <Star className="h-4 w-4" />
              </Button>

              {/* Maximize Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMaximized(!isMaximized)}
                className={`${theme.accent} hover:bg-white/10`}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Export/Import */}
              <Button
                variant="ghost"
                size="icon"
                onClick={exportTodoList}
                className={`${theme.accent} hover:bg-white/10`}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importTodoList(file);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${theme.accent} hover:bg-white/10`}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTodoListVisible(false)}
                className="text-red-400 hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* STATS DASHBOARD ÉPIQUE */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = todoData?.stats[status as keyof typeof todoData.stats] || 0;
              return (
                <motion.div
                  key={status}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={`p-3 rounded-lg bg-gradient-to-br ${config.color} text-white shadow-lg ${config.glow} border border-white/20`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <config.icon className="h-5 w-5" />
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <div className="text-center text-xs font-medium mt-1">
                    {config.label}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CONTRÔLES DE FILTRAGE */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search missions..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="all" className="bg-gray-800">ALL</option>
              <option value="pending" className="bg-gray-800">QUEUED</option>
              <option value="in_progress" className="bg-gray-800">ACTIVE</option>
              <option value="completed" className="bg-gray-800">CRUSHED</option>
            </select>
          </div>
        </div>

        {/* FORMULAIRE D'AJOUT ÉPIQUE */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Define new mission..."
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-medium"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              />
            </div>
            <select
              value={newTodoPriority}
              onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="low" className="bg-gray-800">🌟 RARE</option>
              <option value="medium" className="bg-gray-800">⚡ EPIC</option>
              <option value="high" className="bg-gray-800">🔥 LEGENDARY</option>
            </select>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleAddTodo}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/25 border border-cyan-400/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                DEPLOY
              </Button>
            </motion.div>
          </div>
        </div>

        {/* LISTE DES MISSIONS */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {filteredTodos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎯
                </motion.div>
                <h3 className={`text-lg font-bold ${theme.accent} mb-2`}>AWAITING ORDERS</h3>
                <p className="text-gray-400">Ready to execute missions</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredTodos
                  .sort((a, b) => {
                    const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((todo, index) => {
                    const statusConfig = STATUS_CONFIG[todo.status];
                    const priorityConfig = PRIORITY_CONFIG[todo.priority];
                    
                    return (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, x: -50, rotateX: -90 }}
                        animate={{ opacity: 1, x: 0, rotateX: 0 }}
                        exit={{ opacity: 0, x: 50, rotateX: 90 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, z: 10 }}
                        className={`relative p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border ${priorityConfig.border} shadow-lg ${priorityConfig.glow} backdrop-blur-sm`}
                      >
                        {/* STATUS INDICATOR */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 180 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleCompleteTask(todo.id, todo.status)}
                              className={`w-10 h-10 rounded-full bg-gradient-to-br ${statusConfig.color} flex items-center justify-center shadow-lg ${statusConfig.glow} border border-white/20`}
                            >
                              <statusConfig.icon className="h-5 w-5 text-white" />
                            </motion.button>
                            <div>
                              <div className={`text-xs font-bold ${theme.accent} uppercase tracking-wider`}>
                                {statusConfig.label}
                              </div>
                              <div className={`text-xs font-medium bg-gradient-to-r ${priorityConfig.color} bg-clip-text text-transparent`}>
                                {priorityConfig.label}
                              </div>
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 border border-red-500/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>

                        {/* MISSION CONTENT */}
                        <p className={`text-white font-medium mb-3 leading-relaxed ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {todo.content}
                        </p>

                        {/* PROGRESS BAR ÉPIQUE */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300">Progress</span>
                            <span className="font-bold text-cyan-400">
                              {todo.status === 'completed' ? '100%' : 
                               todo.status === 'in_progress' ? '75%' : '25%'}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ 
                                width: todo.status === 'completed' ? '100%' : 
                                       todo.status === 'in_progress' ? '75%' : '25%'
                              }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-full bg-gradient-to-r ${statusConfig.color} shadow-lg`}
                            />
                          </div>
                        </div>

                        {/* STATUS EFFECTS */}
                        {todo.status === 'in_progress' && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center text-xs text-blue-400 gap-2"
                          >
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                            <span className="font-medium">EXECUTING...</span>
                          </motion.div>
                        )}

                        {todo.status === 'completed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center text-xs text-green-400 gap-2"
                          >
                            <Trophy className="h-3 w-3" />
                            <span className="font-bold">MISSION ACCOMPLISHED!</span>
                          </motion.div>
                        )}

                        {/* PARTICLES ON HOVER */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                          <motion.div
                            whileHover={{ opacity: 1 }}
                            initial={{ opacity: 0 }}
                            className="absolute top-2 right-2 text-lg"
                          >
                            {statusConfig.particle}
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER LÉGENDAIRE */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <div className={`${theme.accent} font-mono`}>
              AGENT SYSTEM ONLINE • {filteredTodos.length} MISSIONS
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Shield className="h-3 w-3" />
              </motion.div>
              <span>SECURE CONNECTION</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}