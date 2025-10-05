import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EnhancedAgentThoughtBubble from './EnhancedAgentThoughtBubble';

describe('EnhancedAgentThoughtBubble - Minimal Test', () => {
  it('should render thought with minimal props', () => {
    const thought = {
      id: 'test-min',
      content: 'Minimal',
    };
    
    render(<EnhancedAgentThoughtBubble thought={thought} />);
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });
});
