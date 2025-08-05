import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserInput } from './UserInput';
import { LanguageProvider } from '../lib/contexts/LanguageProvider';

// Mock the useStore hook
vi.mock('../lib/store', async () => {
  const mod = await import('../lib/__mocks__/store');
  return {
    useStore: mod.useStore,
  };
});

vi.mock('../lib/contexts/LanguageProvider', async () => {
  const mod = await import('../lib/__mocks__/LanguageProvider');
  return mod;
});

import { useStore } from '../lib/store';
import { mockState } from '../lib/__mocks__/store';

describe('UserInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all mock functions in mockState
    Object.keys(mockState).forEach(key => {
      const k = key as keyof typeof mockState;
      if (typeof mockState[k] === 'function') {
        (mockState[k] as ReturnType<typeof vi.fn>).mockClear();
      }
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

    expect(useStore.getState().startAgent).toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue(''); // Input should be cleared
  });

  it('should call startAgent and clear input on Enter key press (without Shift)', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message via Enter' } });
    
    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(useStore.getState().startAgent).toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).toHaveBeenCalledWith('Test message via Enter');
    expect(textarea).toHaveValue(''); // Input should be cleared
  });

  it('should not call startAgent or clear input on Shift+Enter key press', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Set input value
    fireEvent.change(textarea, { target: { value: 'Test message via Shift+Enter' } });
    
    // Press Shift+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(useStore.getState().startAgent).not.toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Test message via Shift+Enter'); // Input should not be cleared
  });

  it('should not send empty messages', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    expect(useStore.getState().startAgent).not.toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).not.toHaveBeenCalled();
  });

  it('should disable input and button when processing', () => {
    // Set processing state
    mockState.isProcessing = true;

    render(<LanguageProvider><UserInput /></LanguageProvider>);
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    // Check that the send button is not in the document (replaced by spinner)
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
    expect(textarea).toBeDisabled();
  });
});