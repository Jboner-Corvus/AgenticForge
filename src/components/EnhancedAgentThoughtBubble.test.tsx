import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnhancedAgentThoughtBubble from './EnhancedAgentThoughtBubble';

describe('EnhancedAgentThoughtBubble', () => {
  const baseThought = {
    id: 'test-thought-1',
    content: 'This is a test thought',
  };

  it('should render the thought content', () => {
    render(<EnhancedAgentThoughtBubble thought={baseThought} />);
    expect(screen.getByText('This is a test thought')).toBeInTheDocument();
  });

  it('should not show sparkle icon for regular thoughts', () => {
    render(<EnhancedAgentThoughtBubble thought={baseThought} />);
    expect(screen.queryByText('✨')).not.toBeInTheDocument();
  });

  it('should show sparkle indicator for prominent thoughts', () => {
    const prominentThought = { ...baseThought, isProminent: true };
    render(<EnhancedAgentThoughtBubble thought={prominentThought} />);
    expect(screen.getByText('✨')).toBeInTheDocument();
  });

  it('should render without timestamp when not provided', () => {
    render(<EnhancedAgentThoughtBubble thought={baseThought} />);
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('should render with timestamp when provided', () => {
    const thoughtWithTimestamp = { 
      ...baseThought, 
      timestamp: '2023-01-01T12:00:00Z' 
    };
    render(<EnhancedAgentThoughtBubble thought={thoughtWithTimestamp} />);
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
  });

  it('should render minimized view', () => {
    const longThought = {
      ...baseThought,
      content: 'This is a very long thought that should be truncated when minimized',
    };
    render(<EnhancedAgentThoughtBubble thought={longThought} isMinimized />);
    expect(screen.getByText(/This is a very long thought that should be/)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });
});
