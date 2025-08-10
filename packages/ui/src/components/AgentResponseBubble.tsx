import { useLanguage } from '../lib/contexts/LanguageContext';
import { useToast } from '../lib/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Clipboard } from 'lucide-react';
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
  const { toast } = useToast();
  const { translations } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ description: translations.copiedToClipboard });
  };

  return (
    <motion.div 
      className="flex justify-start items-start gap-4"
      key={id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ x: 2 }}
    >
      <Avatar className="h-10 w-10 ring-2 ring-indigo-300 dark:ring-indigo-700">
        <AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23818cf8'/%3E%3Ccircle cx='14' cy='16' r='3' fill='white'/%3E%3Ccircle cx='26' cy='16' r='3' fill='white'/%3E%3Cpath d='M14 24 Q 20 28 26 24' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E" alt={translations.agentAvatar} />
        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
          {translations.ai}
        </AvatarFallback>
      </Avatar>
      <div className="relative max-w-[80%] p-4 rounded-2xl bg-secondary text-secondary-foreground shadow-lg group border border-border hover:shadow-xl transition-shadow">
        <div className="message-content prose prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {timestamp}
        </div>
        <motion.div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background rounded-full shadow-md"
            onClick={handleCopy}
            aria-label={translations.copyAgentResponse}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};