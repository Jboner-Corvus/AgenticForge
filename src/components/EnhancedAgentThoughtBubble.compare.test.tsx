import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnhancedAgentThoughtBubble from './EnhancedAgentThoughtBubble';

describe('EnhancedAgentThoughtBubble - Comparison Test', () => {
  it('should render with content only', () => {
    const thought = {
      id: 'test-1',
      content: 'Simple thought',
    };
    
    const { container } = render(<EnhancedAgentThoughtBubble thought={thought} />);
    expect(container.querySelector('.thought-bubble')).toBeInTheDocument();
    expect(screen.getByText('Simple thought')).toBeInTheDocument();
  });

  it('should render with all props', () => {
    const thought = {
      id: 'test-2',
      content: 'Full thought',
      isProminent: true,
      timestamp: '2023-01-01T12:00:00Z',
    };
    
    render(<EnhancedAgentThoughtBubble thought={thought} />);
    expect(screen.getByText('Full thought')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
  });
});
