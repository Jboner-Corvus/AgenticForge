import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';

// Mock all external dependencies - same as minimal test
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

describe('EnhancedAgentThoughtBubble - Comparison Test', () => {
  it('should render with content only', async () => {
    const { container } = render(
      <EnhancedAgentThoughtBubble content="Test content" />,
    );
    console.log('Content only - Container HTML:', container.innerHTML);

    await waitFor(() => {
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });
  });

  it('should render with all props', async () => {
    const { container } = render(
      <EnhancedAgentThoughtBubble
        content="This is a test thought"
        timestamp="10:30:45"
        isProminent={false}
      />,
    );
    console.log('All props - Container HTML:', container.innerHTML);

    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
    });
  });
});
