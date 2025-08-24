/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, Bot, Pin, PinOff, RefreshCw, ChevronDown, Trash2, History, 
  Maximize2, Minimize2, Copy, Download, Settings2
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
import { 
  useCanvasWidth, 
  useCanvasContent, 
  useCanvasType, 
  useIsCanvasPinned, 
  useIsCanvasFullscreen, 
  useCanvasHistory, 
  useCurrentCanvasIndex 
} from '../store/hooks';
import { useCanvasStore } from '../store/canvasStore';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useToast } from '../lib/hooks/useToast';

const AgentOutputCanvas: React.FC = () => {
  const { translations } = useLanguage();
  const { clearCanvas, navigateToCanvas, removeCanvasFromHistory, clearCanvasHistory, setCanvasFullscreen, setCanvasPinned } = useCanvasStore();
  const canvasWidth = useCanvasWidth();
  const canvasContent = useCanvasContent();
  const canvasType = useCanvasType();
  const isCanvasPinned = useIsCanvasPinned();
  const isCanvasFullscreen = useIsCanvasFullscreen();
  const canvasHistory = useCanvasHistory();
  const currentCanvasIndex = useCurrentCanvasIndex();
  const [iframeKey, setIframeKey] = useState(0);
  const [hasIframeError, setHasIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { toast } = useToast();
  
  console.log('🎨 [AgentOutputCanvas] Render avec:', { canvasContent: canvasContent?.length || 0, canvasType, isCanvasPinned });
  
  // Réinitialiser l'état de l'iframe quand le contenu change
  useEffect(() => {
    setHasIframeError(false);
    setIframeKey(prev => prev + 1); // Force re-render iframe
  }, [canvasContent]);

  const canvasVariants: Variants = {
    hidden: { 
      opacity: 0, 
      x: 300,
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      x: 300,
      scale: 0.95,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const togglePin = () => {
    setCanvasPinned(!isCanvasPinned);
  };

  const toggleFullscreen = () => {
    setCanvasFullscreen(!isCanvasFullscreen);
  };

  const refreshIframe = () => {
    console.log('🎨 [AgentOutputCanvas] Refresh iframe demandé');
    setIframeKey(prev => prev + 1);
    setHasIframeError(false);
  };

  const copyContent = () => {
    if (canvasContent) {
      navigator.clipboard.writeText(canvasContent);
      toast({
        title: "Contenu copié",
        description: "Le contenu du canvas a été copié dans le presse-papiers"
      });
    }
  };

  const downloadContent = () => {
    if (canvasContent) {
      const blob = new Blob([canvasContent], { 
        type: canvasType === 'html' ? 'text/html' : 
              canvasType === 'markdown' ? 'text/markdown' : 
              canvasType === 'url' ? 'text/plain' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas-content.${canvasType === 'html' ? 'html' : 
                                 canvasType === 'markdown' ? 'md' : 
                                 canvasType === 'url' ? 'txt' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderContent = () => {
    if (!canvasContent) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No content available</p>
          </div>
        </div>
      );
    }
    switch (canvasType) {
      case 'html':
        console.log('🎨 [AgentOutputCanvas] Rendu HTML iframe avec contenu:', canvasContent?.substring(0, 100) + '...');
        
        if (hasIframeError) {
          return (
            <motion.div 
              className="p-4 text-center"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-red-500 mb-4">Erreur de chargement de l'iframe</p>
              <Button onClick={refreshIframe} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger
              </Button>
            </motion.div>
          );
        }
        
        return (
          <motion.iframe 
            key={iframeKey} // Force re-render
            ref={iframeRef}
            srcDoc={canvasContent} 
            title={translations.agentHtmlOutput} 
            className="w-full h-full border-0 rounded-lg"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            onLoad={() => {
              console.log('🎨 [AgentOutputCanvas] Iframe chargée!');
              setHasIframeError(false);
            }}
            onError={(e) => {
              console.error('🎨 [AgentOutputCanvas] Erreur iframe:', e);
              setHasIframeError(true);
            }}
          />
        );
      case 'markdown':
        return (
          <motion.div 
            className="p-4 prose dark:prose-invert max-w-none h-full overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{canvasContent}</ReactMarkdown>
          </motion.div>
        );
      case 'url':
        return (
          <motion.iframe 
            src={canvasContent} 
            title={translations.agentUrlOutput} 
            className="w-full h-full border-0 rounded-lg"
            sandbox="allow-scripts allow-same-origin"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          />
        );
      case 'json':
        // Handle todo list JSON data
        try {
          const jsonData = JSON.parse(canvasContent);
          if (jsonData.type === 'todo_list') {
            return (
                            <motion.div 
                className="p-4 h-full overflow-y-auto bg-gradient-to-br from-cyan-900/5 to-blue-900/5 rounded-lg"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p>Todo List content will be displayed in the unified todo list panel</p>
                </div>
              </motion.div>
            );
          }
        } catch (e) {
          // Fall through to text display if JSON parsing fails
        }
        // If not a todo list or parsing fails, display as text
        return (
          <motion.pre 
            className="p-4 text-sm whitespace-pre-wrap h-full overflow-y-auto bg-black/5 rounded-lg"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {canvasContent}
          </motion.pre>
        );
      case 'text':
      default:
        return (
          <motion.pre 
            className="p-4 text-sm whitespace-pre-wrap h-full overflow-y-auto bg-black/5 rounded-lg"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {canvasContent}
          </motion.pre>
        );
    }
  };

  return (
    <motion.div
      variants={canvasVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`h-full w-full flex flex-col bg-background/90 backdrop-blur-2xl border-l border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden
        ${isCanvasFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-l-2xl'}`}
      style={{
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.15), inset 0 0 20px rgba(0, 255, 255, 0.05)'
      }}
    >
      <motion.header 
        className="flex items-center justify-between p-3 flex-shrink-0 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/30 to-blue-900/30"
        variants={headerVariants}
      >
        <div className="flex items-center space-x-2">
          <motion.h2 
            className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 truncate max-w-xs md:max-w-md"
            variants={headerVariants}
          >
            {translations.agentOutputCanvas}
          </motion.h2>
          
          {canvasHistory.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 px-2"
                >
                  <History className="h-4 w-4 mr-1" />
                  {canvasHistory.length > 0 && currentCanvasIndex >= 0 
                    ? `${currentCanvasIndex + 1}/${canvasHistory.length}`
                    : '0'
                  }
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Historique du Canvas
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvasHistory}
                    className="h-auto p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canvasHistory.map((canvas: unknown, index: number) => (
                  <DropdownMenuItem
                    key={(canvas as any).id}
                    className={`flex items-center justify-between cursor-pointer ${
                      index === currentCanvasIndex ? 'bg-cyan-900/20 text-cyan-300' : ''
                    }`}
                    onClick={() => navigateToCanvas(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {(canvas as any).title || `Canvas ${index + 1}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(canvas as any).type} • {new Date((canvas as any).timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCanvasFromHistory(index);
                      }}
                      className="h-auto p-1 ml-2 text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={copyContent}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
            title="Copier le contenu"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={downloadContent}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
            title="Télécharger le contenu"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {canvasType === 'html' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshIframe}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
              title="Recharger l'iframe"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
                title="Paramètres du canvas"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Paramètres du Canvas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Largeur</span>
                  <span className="text-sm font-medium">{Math.round(canvasWidth)}px</span>
                </div>
                <Slider
                  value={[canvasWidth]}
                  onValueChange={(value) => {
                    const newWidth = Math.max(300, Math.min(800, value[0]));
                    const setCanvasWidth = useCanvasStore.getState().setCanvasWidth;
                    setCanvasWidth(newWidth);
                  }}
                  min={300}
                  max={800}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>300px</span>
                  <span>800px</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
            title={isCanvasFullscreen ? "Réduire" : "Plein écran"}
          >
            {isCanvasFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePin}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
            title={isCanvasPinned ? "Détacher" : "Épingler"}
          >
            {isCanvasPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearCanvas}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 h-8 w-8"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.header>
      <motion.div 
        className="flex-1 overflow-auto p-3 relative"
        variants={contentVariants}
      >
        <div className="w-full h-full bg-gradient-to-br from-cyan-900/5 to-blue-900/5 rounded-xl border border-cyan-500/10 shadow-inner">
         {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AgentOutputCanvas;