import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Clipboard } from 'lucide-react';
import { useToast } from '../lib/hooks/useToast';

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

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({ description: "Copied to clipboard!" });
  };

  return (
    <div className="flex justify-start items-start gap-4 animate-slide-up" key={id}>
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/agent.png" alt="Agent Avatar" />
        <AvatarFallback>AI</AvatarFallback>
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
          aria-label="Copy agent response to clipboard"
        >
          <Clipboard className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};