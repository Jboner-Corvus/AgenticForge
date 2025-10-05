import React from 'react';

interface Thought {
  content: string;
  isProminent?: boolean;
  timestamp?: string;
  id: string;
}

interface EnhancedAgentThoughtBubbleProps {
  thought: Thought;
  isMinimized?: boolean;
}

const EnhancedAgentThoughtBubble: React.FC<EnhancedAgentThoughtBubbleProps> = ({ 
  thought, 
  isMinimized = false 
}) => {
  const { content, isProminent, timestamp, id } = thought;

  if (isMinimized) {
    return (
      <div className="thought-bubble minimized" data-thought-id={id}>
        <span className="thought-content">
          {content.length > 50 ? `${content.substring(0, 50)}...` : content}
        </span>
      </div>
    );
  }

  return (
    <div className={`thought-bubble ${isProminent ? 'prominent' : ''}`} data-thought-id={id}>
      {isProminent && <span className="sparkle-indicator">✨</span>}
      <div className="thought-content">{content}</div>
      {timestamp && (
        <div className="thought-timestamp">{new Date(timestamp).toLocaleTimeString()}</div>
      )}
    </div>
  );
};

export default EnhancedAgentThoughtBubble;
