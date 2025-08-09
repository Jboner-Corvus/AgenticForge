import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Mock } from 'vitest';
import { UserInput } from './UserInput';
import { LanguageProvider } from '../lib/contexts/LanguageProvider';
import { useStore } from '../lib/store';
import { resetMockStore } from '../lib/__mocks__/store';

vi.mock('../lib/store', async () => {
  const actual = await vi.importActual('../lib/store');
  const mod = await import('../lib/__mocks__/store');
  return {
    ...actual,
    useStore: mod.useStore,
    resetMockStore: mod.resetMockStore,
  };
});
vi.mock('../lib/contexts/LanguageProvider', async () => {
  const mod = await import('../lib/__mocks__/LanguageProvider');
  return mod;
});
let mockStartAgent = vi.fn();

vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: mockStartAgent,
    interruptAgent: vi.fn(),
  }),
}));

describe('UserInput', () => {
  let setMessageInputValueSpy: Mock<[string], void>;

  beforeEach(() => {
    resetMockStore(); // Reset the store before each test
    mockStartAgent = vi.fn(() => Promise.resolve()); 
    setMessageInputValueSpy = vi.fn();
    
    useStore.setState({
      setMessageInputValue: setMessageInputValueSpy,
      isProcessing: false, // Reset to default for most tests
      messageInputValue: '',
      tokenStatus: true, // Assuming tokenStatus is true by default for most tests
    });
  });

  it('should render the input field and send button', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should update the input value on change', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'New message' } });
    // Note: The component uses local state, not the store for input value
    expect(textarea).toHaveValue('New message');
  });

  it('should call startAgent and clear input on send button click', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    // Click send button
    fireEvent.click(sendButton);

    expect(mockStartAgent).toHaveBeenCalled();
    expect(setMessageInputValueSpy).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue(''); // Input should be cleared
  });

  it('should call startAgent and clear input on Enter key press (without Shift)', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message via Enter' } });
    
    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockStartAgent).toHaveBeenCalled();
    expect(setMessageInputValueSpy).toHaveBeenCalledWith('Test message via Enter');
    expect(textarea).toHaveValue(''); // Input should be cleared
  });

  it('should not call startAgent or clear input on Shift+Enter key press', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message via Shift+Enter' } });
    
    // Press Shift+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockStartAgent).not.toHaveBeenCalled();
    expect(setMessageInputValueSpy).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Test message via Shift+Enter'); // Input should not be cleared
  });

  it('should not send empty messages', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    expect(mockStartAgent).not.toHaveBeenCalled();
    expect(setMessageInputValueSpy).not.toHaveBeenCalled();
  });

  it('should disable input and show loading spinner when processing', () => {
    useStore.setState({ isProcessing: true });
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    expect(textarea).toBeDisabled();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument(); // Check for the LoadingSpinner
  });
});
