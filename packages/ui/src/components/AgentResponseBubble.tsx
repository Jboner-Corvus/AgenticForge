import { useLanguage } from '../lib/contexts/LanguageContext';
import { useToast } from '../lib/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Clipboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className="flex justify-start items-start gap-4 animate-slide-up" key={id}>
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/agent.png" alt={translations.agentAvatar} />
        <AvatarFallback>{translations.ai}</AvatarFallback>
      </Avatar>
      <div className="relative max-w-[70%] p-3 rounded-2xl bg-secondary text-secondary-foreground shadow-lg group">
        <div className="message-content prose prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {timestamp}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          aria-label={translations.copyAgentResponse}
        >
          <Clipboard className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};