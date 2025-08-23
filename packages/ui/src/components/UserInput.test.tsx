import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserInput } from './UserInput';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';

// Mock the store
vi.mock('../store', () => ({
  useCombinedStore: vi.fn(),
}));

// Mock the store hooks
vi.mock('../store/hooks', () => ({
  useIsProcessing: vi.fn(),
  useMessageInputValue: vi.fn(),
}));

// Mock the UI store
vi.mock('../store/uiStore', () => ({
  useUIStore: vi.fn(),
}));

let mockStartAgent = vi.fn();

vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: mockStartAgent,
    interruptAgent: vi.fn(),
  }),
}));

import { useIsProcessing, useMessageInputValue } from '../store/hooks';
import { useUIStore } from '../store/uiStore';

describe('UserInput', () => {
  const mockSetMessageInputValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStartAgent = vi.fn(() => Promise.resolve()); 
    
    // Mock the hooks
    (useIsProcessing as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (useMessageInputValue as unknown as ReturnType<typeof vi.fn>).mockReturnValue('');
    (useUIStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSetMessageInputValue);
  });

  it('should render the input field and send button', async () => {
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  it('should update the input value on change', async () => {
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(textarea, { target: { value: 'New message' } });
      // The component now uses store for input value
      expect(mockSetMessageInputValue).toHaveBeenCalledWith('New message');
    });
  });

  it('should call startAgent and clear input on send button click', async () => {
    // Set up store to have a message
    (useMessageInputValue as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Test message');
    
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Click send button
      fireEvent.click(sendButton);

      expect(mockStartAgent).toHaveBeenCalledWith('Test message');
      expect(mockSetMessageInputValue).toHaveBeenCalledWith(''); // Input should be cleared
    });
  });

  it('should call startAgent and clear input on Enter key press (without Shift)', async () => {
    // Set up store to have a message
    (useMessageInputValue as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Test message');
    
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      // Press Enter (without Shift)
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      
      // Verify startAgent was called
      expect(mockStartAgent).toHaveBeenCalledWith('Test message');
      
      // Verify input was cleared
      expect(mockSetMessageInputValue).toHaveBeenCalledWith('');
    });
  });

  it('should not call startAgent or clear input on Shift+Enter key press', async () => {
    // Set up store to have a message
    (useMessageInputValue as unknown as ReturnType<typeof vi.fn>).mockReturnValue('Test message via Shift+Enter');
    
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      // Press Shift+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockStartAgent).not.toHaveBeenCalled();
      // Note: Since we're using a store for the input value, we can't directly check the textarea value
      // The important thing is that startAgent was not called
    });
  });

  it('should not send empty messages', async () => {
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      expect(mockStartAgent).not.toHaveBeenCalled();
    });
  });

  it('should show loading spinner when processing', async () => {
    (useIsProcessing as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
    
    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByLabelText('Loading')).toBeInTheDocument(); // Check for the LoadingSpinner
    });
  });
});
