// packages/ui/src/components/AgentOutputCanvas.tsx

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../lib/store';
import { useLanguage } from '../lib/contexts/LanguageContext';

const AgentOutputCanvas: React.FC = () => {
  const { translations } = useLanguage();
  const clearCanvas = useStore((state) => state.clearCanvas);
  const { canvasContent, canvasType } = useStore();

  const canvasVariants = {
    hidden: { opacity: 0, scale: 0.98, x: 20 },
    visible: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.98, x: 20 },
  };

  const renderContent = () => {
    if (!canvasContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Bot size={48} className="mb-4" />
          <p>{translations.agentContentWillAppearHere}</p>
        </div>
      );
    }
    switch (canvasType) {
      case 'html':
        return <iframe srcDoc={canvasContent} title={translations.agentHtmlOutput} className="w-full h-full border-0" sandbox="allow-scripts" />;
      case 'markdown':
        return <div className="p-4 prose dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{canvasContent}</ReactMarkdown></div>;
      case 'url':
        return <iframe src={canvasContent} title={translations.agentUrlOutput} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />;
      case 'text':
      default:
        return <pre className="p-4 text-sm whitespace-pre-wrap h-full overflow-y-auto">{canvasContent}</pre>;
    }
  };

  return (
    <motion.div
      variants={canvasVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full w-full flex flex-col bg-background/50 border-l border-border shadow-lg rounded-lg p-4"
    >
      <header className="flex items-center justify-between p-2 flex-shrink-0">
        <h2 className="text-lg font-semibold ml-2">{translations.agentOutputCanvas}</h2>
        <Button variant="ghost" size="icon" onClick={clearCanvas}>
          <X className="h-5 w-5" />
        </Button>
      </header>
      <div className="flex-1 overflow-auto p-4 relative">
        <div className="w-full h-full bg-white dark:bg-black rounded-md shadow-inner">
         {renderContent()}
        </div>
        
      </div>
    </motion.div>
  );
};

export default AgentOutputCanvas;