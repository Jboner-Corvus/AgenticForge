
import React from 'react';

interface AvatarProps {
  sender: 'assistant' | 'user';
}

export const Avatar: React.FC<AvatarProps> = ({ sender }) => {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 text-white text-xs font-bold`}>
      {sender === 'user' ? 'You' : 'AI'}
    </div>
  );
};
