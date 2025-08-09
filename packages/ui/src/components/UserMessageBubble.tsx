import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface UserMessageBubbleProps {
  content: string;
  timestamp: string;
}

export const UserMessageBubble: React.FC<UserMessageBubbleProps> = ({
  content,
  timestamp,
}) => {
  return (
    <div className="flex justify-end items-end space-x-2 animate-slide-up">
      <div className="flex flex-col items-end">
        <div className="bg-primary text-primary-foreground p-3 rounded-xl max-w-xs break-words shadow-md">
          {content}
        </div>
        <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/user.png" alt="User Avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </div>
  );
};
