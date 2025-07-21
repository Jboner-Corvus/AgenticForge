import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AgentOutputCanvasProps {
  content: string;
  type: 'html' | 'markdown' | 'url' | 'text';
}

const AgentOutputCanvas: React.FC<AgentOutputCanvasProps> = ({ content, type }) => {

  if (!content) {
    return <div className="flex items-center justify-center h-full text-gray-500">No content to display.</div>;
  }

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <AnimatePresence mode="wait">
      {content && (
        <motion.div
          key={type} // Key is important for AnimatePresence to detect changes
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full"
        >
          {(() => {
            switch (type) {
              case 'html':
                return (
                  <div
                    className="w-full h-full overflow-auto bg-white p-4 rounded-lg shadow-inner"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                );
              case 'markdown':
                return (
                  <div className="w-full h-full overflow-auto bg-white p-4 rounded-lg shadow-inner prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                );
              case 'url':
                return (
                  <iframe
                    src={content}
                    title="Agent Output"
                    className="w-full h-full border-0 rounded-lg shadow-inner"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals" // Basic sandbox for security
                  />
                );
              case 'text':
                return (
                  <pre className="w-full h-full overflow-auto bg-white p-4 rounded-lg shadow-inner text-sm whitespace-pre-wrap">
                    {content}
                  </pre>
                );
              default:
                return (
                  <div className="flex items-center justify-center h-full text-red-500">
                    Unsupported content type: {type}
                  </div>
                );
            }
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentOutputCanvas;
