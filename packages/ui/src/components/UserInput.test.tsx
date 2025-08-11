import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserInput } from './UserInput';
import { useStore } from '../lib/store';
import { resetMockStore } from '../lib/__mocks__/store';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';

vi.mock('../lib/store', async () => {
  const actual = await vi.importActual('../lib/store');
  const mod = await import('../lib/__mocks__/store');
  return {
    ...actual,
    useStore: mod.useStore,
    resetMockStore: mod.resetMockStore,
  };
});

// Mock the useLanguage hook directly
vi.mock('../lib/contexts/LanguageContext', async () => {
  const actualReact = await vi.importActual('react') as typeof import('react');
  return {
    ...actualReact,
    LanguageContext: actualReact.createContext(undefined),
    useLanguage: () => ({
      language: 'en',
      translations: {
        typeYourMessage: 'Type your message...',
        send: 'Send',
        processing: 'Processing...',
      },
      setLanguage: vi.fn(),
    }),
  };
});

let mockStartAgent = vi.fn();

vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: mockStartAgent,
    interruptAgent: vi.fn(),
  }),
}));

describe('UserInput', () => {

  beforeEach(() => {
    resetMockStore(); // Reset the store before each test
    mockStartAgent = vi.fn(() => Promise.resolve()); 
    
    useStore.setState({
      isProcessing: false, // Reset to default for most tests
      messageInputValue: '',
      tokenStatus: true, // Assuming tokenStatus is true by default for most tests
    });
  });

  it('should render the input field and send button', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should update the input value on change', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'New message' } });
    // Note: The component uses local state, not the store for input value
    expect(textarea).toHaveValue('New message');
  });

  it('should call startAgent and clear input on send button click', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Click send button
    fireEvent.click(sendButton);

    expect(mockStartAgent).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue(''); // Input should be cleared
  });

  it('should call startAgent and clear input on Enter key press (without Shift)', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Press Enter (without Shift)
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    
    // Verify startAgent was called
    expect(mockStartAgent).toHaveBeenCalledWith('Test message');
    
    // Verify input was cleared
    expect(textarea).toHaveValue('');
  });

  it('should not call startAgent or clear input on Shift+Enter key press', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message via Shift+Enter' } });
    
    // Press Shift+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockStartAgent).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Test message via Shift+Enter'); // Input should not be cleared
  });

  it('should not send empty messages', () => {
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    expect(mockStartAgent).not.toHaveBeenCalled();
  });

  it('should disable input and show loading spinner when processing', () => {
    useStore.setState({ isProcessing: true });
    render(
      <TestLanguageProvider>
        <UserInput />
      </TestLanguageProvider>
    );
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    expect(textarea).toBeDisabled();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument(); // Check for the LoadingSpinner
  });
});
