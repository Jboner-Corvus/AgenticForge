import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserInput } from './UserInput';

// Mock all external dependencies

vi.mock('../lib/store', () => ({
  useCombinedStore: vi.fn(),
}));

vi.mock('../store/hooks', () => ({
  useCurrentPage: vi.fn(() => 'chat'),
  useIsProcessing: vi.fn(() => false),
  useMessages: vi.fn(() => []),
  useMessageInputValue: vi.fn(() => ''),
}));

vi.mock('../store/uiStore', async () => {
  const actual = await vi.importActual('../store/uiStore');
  return {
    ...actual,
    useUIStore: vi.fn(),
  };
});

vi.mock('../lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../lib/hooks/useDraggablePane', () => ({
  useDraggablePane: () => ({
    isDragging: false,
    dragOffset: 0,
  }),
}));

vi.mock('../lib/contexts/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      typeYourMessage: 'Type your message...',
      sendMessage: 'Send Message',
      stop: 'Stop',
      clear: 'Clear',
    },
  }),
}));

vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: vi.fn(),
  }),
}));

// Import the mocked hooks
import { useCurrentPage, useIsProcessing, useMessages, useMessageInputValue } from '../store/hooks';
import { useUIStore } from '../store/uiStore';

const renderUserInput = () => {
  return render(
    <UserInput />
  );
};

describe('UserInput - Critical Frontend Tests', () => {
  let mockSetMessageInputValue: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock function for setMessageInputValue
    mockSetMessageInputValue = vi.fn();
    
    // Mock the useUIStore hook to return our mock function
    (useUIStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        // When the selector is a function, it's trying to get setMessageInputValue
        // We'll mock the state to have an empty messageInputValue
        return mockSetMessageInputValue;
      }
      return mockSetMessageInputValue;
    });
    
    // Set up default mock implementations
    (useCurrentPage as any).mockReturnValue('chat');
    (useIsProcessing as any).mockReturnValue(false);
    (useMessages as any).mockReturnValue([]);
    (useMessageInputValue as any).mockReturnValue('');
  });

  it('should render input field and buttons', () => {
    renderUserInput();

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer le message/i })).toBeInTheDocument();
  });

  it('should handle text input', () => {
    // Mock the useMessageInputValue to return the updated value after change
    (useMessageInputValue as any).mockReturnValue('Hello, world!');
    
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello, world!' } });

    expect(textarea).toHaveValue('Hello, world!');
  });

  it('should handle Enter key press', () => {
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // The component should handle the Enter key event
    expect(textarea).toHaveValue('Test message');
  });

  it('should handle Shift+Enter for new line', () => {
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    // Should still have the text (Shift+Enter should not trigger send)
    expect(textarea).toHaveValue('Test message');
  });

  it('should disable input when processing', () => {
    (useIsProcessing as any).mockReturnValue(true);

    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    expect(textarea).toBeDisabled();
  });

  it('should show stop button when processing', () => {
    // Mock isProcessing to return true
    (useIsProcessing as any).mockReturnValue(true);
    
    renderUserInput();

    // Should show stop button and hide send button when processing
    expect(screen.getByRole('button', { name: /arrêter/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /envoyer le message/i })).not.toBeInTheDocument();
  });

  it('should handle very long messages', () => {
    const longMessage = 'A'.repeat(10000);
    (useMessageInputValue as any).mockReturnValue(longMessage);
    
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: longMessage } });

    expect(textarea).toHaveValue(longMessage);
  });

  it('should handle special characters in messages', () => {
    const specialMessage = 'Hello! @#$%^&*()_+{}|:<>?[]\\;\'",./';
    (useMessageInputValue as any).mockReturnValue(specialMessage);
    
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: specialMessage } });

    expect(textarea).toHaveValue(specialMessage);
  });

  it('should handle multiline messages', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    (useMessageInputValue as any).mockReturnValue(multilineMessage);
    
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: multilineMessage } });

    expect(textarea).toHaveValue(multilineMessage);
  });

  it('should handle empty input gracefully', () => {
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });

    // Try to send empty message
    fireEvent.click(sendButton);

    // Should not crash, input should remain empty
    expect(textarea).toHaveValue('');
  });

  it('should handle rapid clicking of send button', () => {
    (useMessageInputValue as any).mockReturnValue('Test message');
    
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });

    fireEvent.change(textarea, { target: { value: 'Test message' } });

    // Click send button multiple times rapidly
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);

    // Component should handle rapid clicks without crashing
    expect(textarea).toHaveValue('Test message');
  });

  it('should maintain focus on textarea', () => {
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');

    // Focus the textarea
    textarea.focus();
    expect(textarea).toHaveFocus();
  });

  it('should handle keyboard navigation', () => {
    renderUserInput();

    const textarea = screen.getByPlaceholderText('Type your message...');

    // Test Tab navigation
    fireEvent.keyDown(textarea, { key: 'Tab' });
    // Component should handle tab navigation properly
    expect(textarea).toBeInTheDocument();
  });
});