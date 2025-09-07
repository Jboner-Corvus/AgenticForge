import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';

// Mock all external dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: any;
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Brain: () => <div data-testid="brain-icon" />,
  Clipboard: () => <div data-testid="clipboard-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
}));

vi.mock('./ui/button', () => ({
  Button: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

describe('EnhancedAgentThoughtBubble - Minimal Test', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <EnhancedAgentThoughtBubble
        content="Test content"
        timestamp="10:30:45"
      />,
    );

    console.log('Container HTML:', container.innerHTML);
    expect(container).toBeInTheDocument();
  });
});
