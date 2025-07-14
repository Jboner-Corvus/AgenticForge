import React from 'react';
import { ThoughtMessage as ThoughtMessageType } from '../types/chat';

export const ThoughtMessage: React.FC<{ content: ThoughtMessageType['content'] }> = ({ content }) => (
    <div className="my-2">
    <details className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
      <summary className="cursor-pointer text-sm font-medium">
        Thought
      </summary>
      <div className="p-2">
        <p className="text-sm">{content}</p>
      </div>
    </details>
  </div>
);
