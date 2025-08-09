import React from 'react';
import { motion, Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Bot, Pin, PinOff } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../lib/store';
import { useLanguage } from '../lib/contexts/LanguageContext';

const AgentOutputCanvas: React.FC = () => {
  const { translations } = useLanguage();
  const clearCanvas = useStore((state) => state.clearCanvas);
  const { canvasContent, canvasType, isCanvasPinned } = useStore();

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
    useStore.getState().setCanvasPinned(!isCanvasPinned);
  };

  const renderContent = () => {
    if (!canvasContent) {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center h-full text-muted-foreground"
          variants={contentVariants}
        >
          <Bot size={48} className="mb-4 text-cyan-500" />
          <p className="text-lg">{translations.agentContentWillAppearHere}</p>
        </motion.div>
      );
    }
    switch (canvasType) {
      case 'html':
        return (
          <motion.iframe 
            srcDoc={canvasContent} 
            title={translations.agentHtmlOutput} 
            className="w-full h-full border-0 rounded-lg"
            sandbox="allow-scripts"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          />
        );
      case 'markdown':
        return (
          <motion.div 
            className="p-4 prose dark:prose-invert max-w-none"
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
      className="h-full w-full flex flex-col bg-background/80 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl shadow-cyan-500/10 rounded-l-2xl overflow-hidden"
      style={{
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(0, 255, 255, 0.05)'
      }}
    >
      <motion.header 
        className="flex items-center justify-between p-4 flex-shrink-0 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20"
        variants={headerVariants}
      >
        <motion.h2 
          className="text-xl font-bold ml-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
          variants={headerVariants}
        >
          {translations.agentOutputCanvas}
        </motion.h2>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePin}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30"
          >
            {isCanvasPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearCanvas}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </motion.header>
      <motion.div 
        className="flex-1 overflow-auto p-4 relative"
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