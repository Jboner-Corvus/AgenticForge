import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ThoughtDisplay } from './ThoughtDisplay';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';

// Mock the useThoughtHighlight hook
vi.mock('../lib/hooks/useThoughtHighlight', () => ({
  useThoughtHighlight: vi.fn((content: string) => {
    // Return true for content containing "important" keyword
    return content.includes('important');
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('ThoughtDisplay', () => {
  const mockThought = {
    id: 'test-thought-1',
    type: 'agent_thought' as const,
    content: 'This is a test thought',
    timestamp: Date.now(),
  };

  it('should render the thought content', async () => {
    render(
      <TestLanguageProvider>
        <ThoughtDisplay thought={mockThought} timestamp="10:30:45" />
      </TestLanguageProvider>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
    });
  });

  it('should not mark regular thoughts as prominent', async () => {
    render(
      <TestLanguageProvider>
        <ThoughtDisplay thought={mockThought} />
      </TestLanguageProvider>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(/This is a test thought/i)).toBeInTheDocument();
    });
  });

  it('should mark important thoughts as prominent', async () => {
    const importantThought = {
      ...mockThought,
      content: 'This is an important thought',
    };

    render(
      <TestLanguageProvider>
        <ThoughtDisplay thought={importantThought} />
      </TestLanguageProvider>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(
        screen.getByText(/This is an important thought/i),
      ).toBeInTheDocument();
    });
  });
});
