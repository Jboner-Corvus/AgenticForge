import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, Pin, RefreshCw, 
  Maximize2, Minimize2, Settings2, 
  MonitorPlay, Target, Zap, Crown, Shield, ChevronDown, ArrowDown,
  Volume2, VolumeX, Headphones
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { Slider } from './ui/slider';
import { useCanvasStore } from '../store/canvasStore';
// import { useToast } from '../lib/hooks/useToast';

// MODES D'AFFICHAGE ÉPIQUES
export type DisplayMode = 'minimal' | 'windowed' | 'theater' | 'immersive' | 'battlefield';

const DISPLAY_MODES = {
  minimal: {
    label: 'MINIMAL',
    description: 'Compact interface',
    canvasSize: 'small',
    showPanels: false,
    headerHeight: '3rem'
  },
  windowed: {
    label: 'WINDOWED', 
    description: 'Standard windowed mode',
    canvasSize: 'medium',
    showPanels: true,
    headerHeight: '4rem'
  },
  theater: {
    label: 'THEATER',
    description: 'Large screen view', 
    canvasSize: 'large',
    showPanels: true,
    headerHeight: '3rem'
  },
  immersive: {
    label: 'IMMERSIVE',
    description: 'Full screen mode',
    canvasSize: 'fullscreen',
    showPanels: false,
    headerHeight: '2rem'
  },
  battlefield: {
    label: 'EXPANDED',
    description: 'All panels + full screen',
    canvasSize: 'fullscreen',
    showPanels: true,
    headerHeight: '3rem'
  }
};

const EpicCanvas: React.FC = () => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('windowed');
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false);
  const [canvasScale, setCanvasScale] = useState(100);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasIframeError, setHasIframeError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [canvasAudioMuted, setCanvasAudioMuted] = useState(false);
  const [canvasVolume, setCanvasVolume] = useState(50);

  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canvasControls = useAnimation();
  // const { toast } = useToast(); // Unused
  
  // STORE STATE
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasContent = useCanvasStore((state) => state.canvasContent);
  const canvasType = useCanvasStore((state) => state.canvasType);
  const isCanvasPinned = useCanvasStore((state) => state.isCanvasPinned);
  const setCanvasPinned = useCanvasStore((state) => state.setCanvasPinned);
  const setCanvasFullscreen = useCanvasStore((state) => state.setCanvasFullscreen);
  
  const setIsCanvasVisible = useCanvasStore((state) => state.setIsCanvasVisible);

  console.log('🎨 [EpicCanvas] Mode:', displayMode, 'Content:', canvasContent?.length || 0);
  
  // DÉTECTION DE SCROLL UTILISATEUR
  const handleUserScroll = useCallback(() => {
    if (contentContainerRef.current) {
      const container = contentContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      
      // Si l'utilisateur scroll loin du bas, considérer qu'il contrôle manuellement
      setIsUserScrolling(!isNearBottom);
      
      console.log('👤 [EpicCanvas] User scroll detected, near bottom:', isNearBottom);
    }
  }, []);

  // AUTO-SCROLL DÉBONCÉ POUR LE CANVAS
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (contentContainerRef.current && autoScrollEnabled) {
        const container = contentContainerRef.current;
        
        // Log pour débug
        console.log('🔄 [EpicCanvas] Auto-scrolling canvas, type:', canvasType);
        
        // Calculer si l'utilisateur était déjà proche du bas (tolérance de 100px)
        const isNearBottom = container.scrollTop >= (container.scrollHeight - container.clientHeight - 100);
        
        // Ne faire le scroll automatique que si :
        // 1. L'utilisateur était déjà en bas
        // 2. C'est du nouveau contenu (première fois)
        // 3. L'utilisateur ne scroll pas manuellement
        if ((isNearBottom || container.scrollTop === 0) && !isUserScrolling) {
          if (canvasType === 'html' || canvasType === 'url') {
            // Pour les iframes, on s'assure que le container est visible
            // et on scroll doucement pour éviter de perturber l'utilisateur
            container.scrollTop = container.scrollHeight;
            console.log('🎯 [EpicCanvas] Scrolled iframe container to bottom');
          } else {
            // Pour markdown/text, on scroll vers le bas du contenu
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
            console.log('🎯 [EpicCanvas] Scrolled text/markdown content to bottom');
          }
        } else {
          console.log('📍 [EpicCanvas] User scrolling manually or not at bottom, skipping auto-scroll');
        }
      }
    }, 150); // Débonce de 150ms pour éviter les scrolls trop fréquents
  }, [canvasType, autoScrollEnabled, isUserScrolling]);

  // Défilement automatique quand le contenu change
  useEffect(() => {
    if (canvasContent && autoScrollEnabled) {
      scrollToBottom();
    }
  }, [canvasContent, autoScrollEnabled, scrollToBottom]);

  // Ajout de l'écoute des événements de scroll
  useEffect(() => {
    const container = contentContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleUserScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleUserScroll);
    }
  }, [handleUserScroll]);

  // Nettoyage du timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // EFFETS SONORES ÉPIQUES
  const playCanvasSound = (type: 'maximize' | 'minimize' | 'switch' | 'refresh') => {
    if (!audioEnabled) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    const frequencies = {
      maximize: [523, 659, 784], // C5 E5 G5
      minimize: [784, 659, 523], // G5 E5 C5  
      switch: [440, 523, 659],   // A4 C5 E5
      refresh: [659, 523, 659, 784] // E5 C5 E5 G5
    };
    
    frequencies[type].forEach((freq, i) => {
      setTimeout(() => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        osc.frequency.setValueAtTime(freq, context.currentTime);
        gain.gain.setValueAtTime(0.05, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
        osc.start();
        osc.stop(context.currentTime + 0.2);
      }, i * 80);
    });
  };

  // GESTION DES MODES D'AFFICHAGE
  const switchDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode);
    playCanvasSound('switch');
    
    // Configuration automatique selon le mode
    const config = DISPLAY_MODES[mode];
    if (config.canvasSize === 'fullscreen') {
      setCanvasFullscreen(true);
      setIsCanvasMaximized(true);
    } else {
      setCanvasFullscreen(false);
      setIsCanvasMaximized(false);
    }
    
    // Animation de transition
    canvasControls.start({
      scale: [0.95, 1.05, 1],
      rotateY: [0, 10, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    });
  };

  const toggleMaximize = () => {
    const newState = !isCanvasMaximized;
    setIsCanvasMaximized(newState);
    setCanvasFullscreen(newState);
    playCanvasSound(newState ? 'maximize' : 'minimize');
    
    if (newState) {
      setDisplayMode('immersive');
    } else {
      setDisplayMode('windowed');
    }
  };

  // CALCUL DES DIMENSIONS ÉPIQUES
  const getCanvasDimensions = () => {
    const mode = DISPLAY_MODES[displayMode];
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight;
    
    switch (mode.canvasSize) {
      case 'small':
        return { width: Math.min(600, baseWidth * 0.7), height: Math.min(400, baseHeight * 0.5) };
      case 'medium':
        return { width: Math.min(900, baseWidth * 0.8), height: Math.min(600, baseHeight * 0.7) };
      case 'large':
        return { width: Math.min(1200, baseWidth * 0.9), height: Math.min(800, baseHeight * 0.8) };
      case 'fullscreen':
        return { width: baseWidth * 0.95, height: baseHeight * 0.9 };
      default:
        return { width: canvasWidth, height: 600 };
    }
  };

  const { width: canvasWidthCalc, height: canvasHeightCalc } = getCanvasDimensions();

  // FONCTION POUR CONTRÔLER L'AUDIO DE L'IFRAME
  const controlCanvasAudio = useCallback((action: 'mute' | 'unmute' | 'volume', value?: number) => {
    if (iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const iframeWindow = iframe.contentWindow;
        
        if (iframeWindow) {
          // Essayer de contrôler l'audio via postMessage
          iframeWindow.postMessage({
            type: 'audio_control',
            action,
            value
          }, '*');
        }
      } catch (error) {
        console.log('🔊 [EpicCanvas] Audio control not available for this content');
      }
    }
  }, []);

  // RESET IFRAME ON CONTENT CHANGE
  useEffect(() => {
    setHasIframeError(false);
    setIframeKey(prev => prev + 1);
    
    // Appliquer les paramètres audio après le chargement
    setTimeout(() => {
      if (canvasAudioMuted) {
        controlCanvasAudio('mute');
      } else {
        controlCanvasAudio('volume', canvasVolume);
      }
    }, 1000);
  }, [canvasContent, canvasAudioMuted, canvasVolume, controlCanvasAudio]);

  // VARIANTS D'ANIMATION PROFESSIONNELLES
  const canvasVariants: Variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const controlsVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // RENDERING FUNCTIONS
  const renderContent = () => {
    if (!canvasContent) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-center text-white">
            <div className="text-6xl mb-6 opacity-30">
              <MonitorPlay className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-4">
              Canvas Ready
            </h3>
            <p className="text-lg opacity-70">
              Waiting for content...
            </p>
            <div className="mt-6 flex justify-center gap-4">
              {['•', '•', '•', '•'].map((dot, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity 
                  }}
                  className="text-2xl text-gray-500"
                >
                  {dot}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Support étendu pour les jeux et applications
    if ((canvasType === 'html' || canvasType === 'webapp' || canvasType === 'game' || canvasType === 'wasm') && !hasIframeError) {
      return (
        <iframe
          key={iframeKey}
          ref={iframeRef}
          srcDoc={canvasContent}
          className="w-full h-full border-0 bg-white rounded-lg"
          title="Agent Output"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          allow="autoplay; microphone; camera; midi; encrypted-media; fullscreen"
          onError={() => setHasIframeError(true)}
          style={{ 
            transform: `scale(${canvasScale / 100})`,
            transformOrigin: 'top left'
          }}
        />
      );
    }

    if (canvasType === 'url' || canvasType === 'embed') {
      return (
        <iframe
          key={iframeKey}
          src={canvasContent}
          className="w-full h-full border-0 rounded-lg"
          title={canvasType === 'embed' ? "Embedded Game" : "External Content"}
          allow="autoplay; microphone; camera; midi; encrypted-media; fullscreen"
          sandbox={canvasType === 'embed' ? "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads" : undefined}
          style={{ 
            transform: `scale(${canvasScale / 100})`,
            transformOrigin: 'top left'
          }}
        />
      );
    }

    // MARKDOWN/TEXT with epic styling
    return (
      <div className="w-full h-full overflow-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6">
        <div className="prose prose-invert prose-cyan max-w-none">
          {canvasType === 'markdown' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {canvasContent}
            </ReactMarkdown>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-green-400 bg-black/50 p-4 rounded-lg border border-green-500/20">
              {canvasContent}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const currentModeConfig = DISPLAY_MODES[displayMode];

  return (
    <AnimatePresence>
      <motion.div
        variants={canvasVariants}
        initial="hidden"
        animate={canvasControls}
        exit="exit"
        className={`
          fixed top-0 left-0 z-30 bg-gradient-to-br from-gray-900/95 to-gray-800/95 
          backdrop-blur-sm rounded-2xl border border-gray-600/30 shadow-2xl
          ${displayMode === 'immersive' || displayMode === 'battlefield' ? 
            'inset-4' : 
            'top-20 left-1/2 transform -translate-x-1/2'
          }
        `}
        style={{
          width: displayMode === 'immersive' || displayMode === 'battlefield' ? 'calc(100vw - 2rem)' : canvasWidthCalc,
          height: displayMode === 'immersive' || displayMode === 'battlefield' ? 'calc(100vh - 2rem)' : canvasHeightCalc
        }}
      >
        {/* HEADER ÉPIQUE */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              variants={controlsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex items-center justify-between p-4 border-b border-gray-600/20 bg-black/30"
            >
              {/* LEFT CONTROLS */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <MonitorPlay className="h-4 w-4 text-gray-300" />
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-200 text-sm">Canvas</h3>
                  <p className="text-xs text-gray-400">{currentModeConfig.description}</p>
                </div>
              </div>

              {/* DISPLAY MODE SELECTOR */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-300 border border-gray-600/30 hover:bg-gray-700/50"
                    >
                      {currentModeConfig.label}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-600/30">
                    <DropdownMenuLabel className="text-gray-300">Display Modes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(DISPLAY_MODES).map(([mode, config]) => (
                      <DropdownMenuItem
                        key={mode}
                        onClick={() => switchDisplayMode(mode as DisplayMode)}
                        className="text-white hover:bg-gray-700/50"
                      >
                        {config.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* SCALE CONTROL */}
                <div className="flex items-center gap-2 min-w-20">
                  <span className="text-xs text-gray-400">{canvasScale}%</span>
                  <Slider
                    value={[canvasScale]}
                    onValueChange={([value]) => setCanvasScale(value)}
                    min={50}
                    max={150}
                    step={10}
                    className="w-16"
                  />
                </div>
              </div>

              {/* RIGHT CONTROLS */}
              <div className="flex items-center gap-1">
                {/* Auto-scroll Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                  className={`${autoScrollEnabled ? 'text-blue-400' : 'text-gray-500'} hover:bg-blue-500/10`}
                  title={autoScrollEnabled ? 'Désactiver le défilement automatique' : 'Activer le défilement automatique'}
                >
                  <ArrowDown className={`h-4 w-4 ${autoScrollEnabled ? 'animate-bounce' : ''}`} />
                </Button>

                {/* Audio Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`${audioEnabled ? 'text-cyan-400' : 'text-gray-500'} hover:bg-cyan-500/10`}
                  title={audioEnabled ? 'Désactiver les effets sonores' : 'Activer les effets sonores'}
                >
                  {audioEnabled ? <Zap className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </Button>

                {/* Canvas Audio Controls - Show for interactive content */}
                {(canvasType === 'html' || canvasType === 'webapp' || canvasType === 'game' || canvasType === 'wasm' || canvasType === 'embed' || canvasType === 'url') && (
                  <>
                    {/* Canvas Audio Mute */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newMuted = !canvasAudioMuted;
                        setCanvasAudioMuted(newMuted);
                        controlCanvasAudio(newMuted ? 'mute' : 'unmute');
                      }}
                      className={`${!canvasAudioMuted ? 'text-green-400' : 'text-red-400'} hover:bg-green-500/10`}
                      title={canvasAudioMuted ? 'Réactiver le son du canvas' : 'Couper le son du canvas'}
                    >
                      {canvasAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 min-w-16">
                      <Headphones className="h-3 w-3 text-gray-400" />
                      <Slider
                        value={[canvasVolume]}
                        onValueChange={([value]) => {
                          setCanvasVolume(value);
                          if (!canvasAudioMuted) {
                            controlCanvasAudio('volume', value);
                          }
                        }}
                        min={0}
                        max={100}
                        step={10}
                        className="w-12"
                      />
                    </div>
                  </>
                )}

                {/* Pin Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCanvasPinned(!isCanvasPinned)}
                  className={`${isCanvasPinned ? 'text-yellow-400' : 'text-gray-400'} hover:bg-yellow-500/10`}
                >
                  {isCanvasPinned ? <Crown className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>

                {/* Maximize Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMaximize}
                  className="text-purple-400 hover:bg-purple-500/10"
                >
                  {isCanvasMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIframeKey(prev => prev + 1);
                    playCanvasSound('refresh');
                  }}
                  className="text-green-400 hover:bg-green-500/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    clearCanvas();
                    setIsCanvasVisible(false);
                  }}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CANVAS CONTENT AREA */}
        <motion.div 
          ref={contentContainerRef}
          className="flex-1 p-4 overflow-auto relative"
          style={{ 
            height: showControls ? 'calc(100% - 4rem)' : '100%'
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => displayMode === 'immersive' && setShowControls(false)}
        >
          {renderContent()}
          
          {/* FLOATING ACTION BUTTONS */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            {/* Manual Scroll Button - Only show when auto-scroll is disabled or when there's scrollable content */}
            <AnimatePresence>
              {(!autoScrollEnabled || (contentContainerRef.current && contentContainerRef.current.scrollHeight > contentContainerRef.current.clientHeight)) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/25"
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (contentContainerRef.current) {
                      contentContainerRef.current.scrollTo({
                        top: contentContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  title="Défiler vers le bas"
                >
                  <ArrowDown className="h-4 w-4 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
            
            {/* Settings Button */}
            <motion.button
              className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-cyan-500/25"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowControls(!showControls)}
            >
              <Settings2 className="h-5 w-5 text-white" />
            </motion.button>
          </div>

          {/* EPIC FRAME EFFECTS */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-purple-500 to-cyan-500 opacity-50"></div>
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
          </div>
        </motion.div>

        {/* STATUS BAR ÉPIQUE */}
        <div className="px-4 py-2 bg-black/50 border-t border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-cyan-400">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-cyan-500 rounded-full"
              />
              <span>SYSTEM ONLINE</span>
            </div>
            <div className="text-purple-400">
              MODE: {currentModeConfig.label}
            </div>
            <div className="text-gray-400">
              {(canvasType as string)?.toUpperCase() || 'EMPTY'} • {canvasWidthCalc}×{canvasHeightCalc}
            </div>
            <div className={`${autoScrollEnabled ? 'text-blue-400' : 'text-gray-500'}`}>
              AUTO-SCROLL: {autoScrollEnabled ? 'ON' : 'OFF'}
            </div>
            {(canvasType === 'html' || canvasType === 'webapp' || canvasType === 'game' || canvasType === 'wasm' || canvasType === 'embed' || canvasType === 'url') && (
              <div className={`${!canvasAudioMuted ? 'text-green-400' : 'text-red-400'}`}>
                AUDIO: {canvasAudioMuted ? 'MUTED' : `${canvasVolume}%`}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="h-3 w-3" />
            <span>SECURE RENDERING</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EpicCanvas;
export { EpicCanvas };