import React from 'react';

interface ThoughtBubbleProps {
  content: string;
}

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ content }) => {
  return (
    <div className="flex items-start space-x-2 p-2 my-2 bg-gray-800 rounded-lg">
      <span className="text-2xl">💡</span>
      <p className="text-gray-300">{content}</p>
    </div>
  );
};