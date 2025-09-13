import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnhancedAgentThoughtBubble } from './EnhancedAgentThoughtBubble';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';

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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
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

describe('EnhancedAgentThoughtBubble', () => {
  const defaultProps = {
    content: 'This is a test thought',
    timestamp: '10:30:45',
  };

  it('should render the thought content', async () => {
    render(
      <TestLanguageProvider>
        <EnhancedAgentThoughtBubble {...defaultProps} />
      </TestLanguageProvider>,
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
    });
  });

  it('should not show sparkle icon for regular thoughts', async () => {
    render(
      <TestLanguageProvider>
        <EnhancedAgentThoughtBubble {...defaultProps} isProminent={false} />
      </TestLanguageProvider>,
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
      // Check that the sparkle icon is not present
      expect(screen.queryByTestId('sparkles-icon')).not.toBeInTheDocument();
    });
  });

  it('should show sparkle indicator for prominent thoughts', async () => {
    render(
      <TestLanguageProvider>
        <EnhancedAgentThoughtBubble {...defaultProps} isProminent={true} />
      </TestLanguageProvider>,
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
      // Check that the sparkle icon is present
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  it('should render without timestamp when not provided', async () => {
    render(
      <TestLanguageProvider>
        <EnhancedAgentThoughtBubble content="Test content" />
      </TestLanguageProvider>,
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });
  });
});
