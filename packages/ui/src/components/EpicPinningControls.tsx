import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Pin, Layout, Grid, Eye, EyeOff, Maximize2, 
  RotateCcw, Sword, Shield, Crown, MonitorPlay, Target 
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { usePinningStore } from '../store/pinningStore';

export const EpicPinningControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    components,
    layoutMode,
    globalOpacity,
    snapToGrid,
    showGrid,
    setLayoutMode,
    activateBattlefieldMode,
    activateMinimalMode,
    activateTheaterMode,
    setGlobalOpacity,
    toggleSnapToGrid,
    toggleShowGrid,
    togglePin,
    toggleVisibility,
    resetComponent
  } = usePinningStore();

  const pinnedCount = Object.values(components).filter(c => c.isPinned).length;
  const visibleCount = Object.values(components).filter(c => c.isVisible).length;

  const layoutModes = {
    freeform: { icon: Layout, label: 'FREEFORM', color: 'text-cyan-400' },
    grid: { icon: Grid, label: 'GRID', color: 'text-purple-400' },
    cascade: { icon: Maximize2, label: 'CASCADE', color: 'text-green-400' },
    battlefield: { icon: Sword, label: 'BATTLEFIELD', color: 'text-red-400' }
  };

  const presetModes = {
    battlefield: { 
      fn: activateBattlefieldMode, 
      icon: Sword, 
      label: '⚔️ BATTLEFIELD',
      description: 'All components pinned and visible'
    },
    theater: { 
      fn: activateTheaterMode, 
      icon: MonitorPlay, 
      label: '🎬 THEATER',
      description: 'Focus on canvas with minimal UI'
    },
    minimal: { 
      fn: activateMinimalMode, 
      icon: Shield, 
      label: '🛡️ MINIMAL',
      description: 'Essential components only'
    }
  };

  const currentMode = layoutModes[layoutMode];

  return (
    <div className="relative">
      {/* TRIGGER BUTTON ÉPIQUE */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative ${currentMode.color} hover:bg-white/10 transition-all duration-300`}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Settings className="h-4 w-4" />
          </motion.div>
          
          {/* BADGE DE STATUS */}
          {pinnedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
            >
              {pinnedCount}
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* PANEL DE CONTRÔLES ÉPIQUE */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
            className="absolute right-0 top-12 w-80 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-6 z-[9999]"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                EPIC CONTROLS
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="h-4 w-4" />
                </motion.div>
                <span>{visibleCount} ACTIVE</span>
              </div>
            </div>

            {/* LAYOUT MODE SELECTOR */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-cyan-400 mb-3">LAYOUT MODE</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(layoutModes).map(([mode, config]) => (
                  <motion.button
                    key={mode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLayoutMode(mode as keyof typeof layoutModes)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      layoutMode === mode 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/50 ' + config.color
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      <span className="text-xs font-bold">{config.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* PRESET MODES ÉPIQUES */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-cyan-400 mb-3">EPIC PRESETS</label>
              <div className="space-y-2">
                {Object.entries(presetModes).map(([key, preset]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={preset.fn}
                    className="w-full p-3 rounded-lg bg-gradient-to-r from-white/5 to-white/10 border border-white/10 hover:border-cyan-500/50 text-left transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <preset.icon className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="font-bold text-white text-sm">{preset.label}</div>
                        <div className="text-xs text-gray-400">{preset.description}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* COMPONENT TOGGLES */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-cyan-400 mb-3">COMPONENTS</label>
              <div className="space-y-2">
                {Object.entries(components).map(([id, component]) => (
                  <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-white">{component.name}</div>
                      <div className={`w-2 h-2 rounded-full ${
                        component.isVisible ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(id)}
                        className="h-6 w-6 hover:bg-white/10"
                      >
                        {component.isVisible ? 
                          <Eye className="h-3 w-3 text-green-400" /> : 
                          <EyeOff className="h-3 w-3 text-red-400" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePin(id)}
                        className="h-6 w-6 hover:bg-white/10"
                      >
                        <Pin className={`h-3 w-3 ${component.isPinned ? 'text-yellow-400' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resetComponent(id)}
                        className="h-6 w-6 hover:bg-white/10"
                      >
                        <RotateCcw className="h-3 w-3 text-purple-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GLOBAL SETTINGS */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-cyan-400">OPACITY</label>
                  <span className="text-sm text-white font-mono">{Math.round(globalOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[globalOpacity * 100]}
                  onValueChange={([value]) => setGlobalOpacity(value / 100)}
                  min={20}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-cyan-400">GRID</label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleShowGrid}
                    className={`${showGrid ? 'text-cyan-400' : 'text-gray-400'} hover:bg-white/10`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSnapToGrid}
                    className={`${snapToGrid ? 'text-yellow-400' : 'text-gray-400'} hover:bg-white/10`}
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* STATUS FOOTER */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="text-gray-400">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>SYSTEM ONLINE</span>
                </motion.div>
              </div>
              <div className="text-cyan-400 font-mono">
                MODE: {layoutMode.toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};