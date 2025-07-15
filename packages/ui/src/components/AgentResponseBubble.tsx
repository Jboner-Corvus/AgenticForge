import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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
  return (
    <div className="flex justify-start items-start gap-4 animate-slide-up" key={id}>
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/agent.png" alt="Agent Avatar" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <div className="max-w-[70%] p-3 rounded-lg bg-secondary text-secondary-foreground shadow-md">
        <div className="message-content prose prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {timestamp}
        </div>
      </div>
    </div>
  );
};