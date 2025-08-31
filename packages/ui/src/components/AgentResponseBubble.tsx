import { Button } from './ui/button';
import { Clipboard, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

interface AgentResponseBubbleProps {
  content: string;
  id: string;
  timestamp: string;
}

export const AgentResponseBubble: React.FC<AgentResponseBubbleProps> = ({
  content,
  id,
  timestamp,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <motion.div
      className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 group"
      key={id}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-md flex items-center justify-center">
          <MessageCircle className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
              Réponse
            </span>
            <motion.div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-sm"
                onClick={handleCopy}
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
          <div className="prose prose-sm prose-green dark:prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {timestamp}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
