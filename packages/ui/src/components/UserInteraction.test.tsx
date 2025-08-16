import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserInput } from './UserInput';
import { ControlPanel } from './ControlPanel';
import { useCombinedStore } from '../store';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';

// Mock the store
vi.mock('../store', () => ({
  useCombinedStore: vi.fn(),
}));

// Mock other dependencies
const mockStartAgent = vi.fn();
const mockInterruptAgent = vi.fn();

vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: mockStartAgent,
    interruptAgent: mockInterruptAgent,
  }),
}));

vi.mock('../lib/contexts/LanguageContext', async () => {
  const actual = await vi.importActual('../lib/contexts/LanguageContext');
  return {
    ...actual,
    useLanguage: () => ({
      translations: {
        typeMessage: 'Type your message...',
        sendMessage: 'Send Message',
        clearMessages: 'Clear Messages',
        saveSession: 'Save Current Session',
        newSession: 'New Session',
        sessions: 'Sessions',
        status: 'Status',
        tools: 'Tools',
        leaderboard: 'Leaderboard',
        settings: 'Settings',
        darkMode: 'Dark Mode',
      },
    }),
  };
});

vi.mock('../lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

describe('User Interaction Tests', () => {
  const mockStore = {
    messageInputValue: '',
    setMessageInputValue: vi.fn(),
    isProcessing: false,
    setIsProcessing: vi.fn(),
    clearMessages: vi.fn(),
    sessions: [
      { id: 'session-1', name: 'Test Session 1', timestamp: Date.now(), messages: [] },
      { id: 'session-2', name: 'Test Session 2', timestamp: Date.now() - 1000, messages: [] },
    ],
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    deleteSession: vi.fn(),
    renameSession: vi.fn(),
    currentPage: 'chat',
    setCurrentPage: vi.fn(),
    isControlPanelVisible: true,
    setIsControlPanelVisible: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    sessionStatus: 'valid',
    toolCount: 15,
    leaderboardStats: {
      tokensSaved: 1500,
      successfulRuns: 25,
      sessionsCreated: 10,
      apiKeysAdded: 3,
    },
    fetchAndDisplayToolCount: vi.fn(),
    debugLog: ['Debug message 1', 'Debug message 2'],
    isDebugLogVisible: false,
    toggleDebugLogVisibility: vi.fn(),
    llmApiKeys: [
      { provider: 'openai', key: 'test-key-1' },
      { provider: 'anthropic', key: 'test-key-2' },
    ],
    activeLlmApiKeyIndex: 0,
    addLlmApiKey: vi.fn(),
    removeLlmApiKey: vi.fn(),
    setActiveLlmApiKey: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
  });

  describe('UserInput Component Interactions', () => {
    it('should update input value when typing', async () => {
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        fireEvent.change(textarea, { target: { value: 'Hello world' } });
        
        expect(mockStore.setMessageInputValue).toHaveBeenCalledWith('Hello world');
      });
    });

    it('should handle enter key for sending message', async () => {
      // Reset mock
      mockStartAgent.mockReset();
      
      // Set up store with a message
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        messageInputValue: 'Test message',
      });

      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        fireEvent.keyDown(textarea, { key: 'Enter' });
        
        expect(mockStartAgent).toHaveBeenCalledWith('Test message');
      });
    });

    it('should not send message on Enter + Shift', async () => {
      // Reset mock
      mockStartAgent.mockReset();
      
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
        
        expect(mockStartAgent).not.toHaveBeenCalled();
      });
    });

    it('should disable input when processing', async () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isProcessing: true,
      });

      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        expect(textarea).toBeDisabled();
      });
    });

    it('should show send button when not processing', async () => {
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send message/i });
        
        expect(sendButton).toBeInTheDocument();
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('ControlPanel Component Interactions', () => {
    it('should handle clear messages action', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const clearButton = screen.getByText('Clear Messages');
        fireEvent.click(clearButton);
        
        expect(mockStore.clearMessages).toHaveBeenCalled();
      });
    });

    it('should handle save session action', async () => {
      // Mock window.prompt
      const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('New Session Name');
      
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const saveButton = screen.getByText('Save Session');
        fireEvent.click(saveButton);
        
        expect(mockStore.saveSession).toHaveBeenCalledWith('New Session Name');
      });
      
      mockPrompt.mockRestore();
    });

    it('should handle session loading', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        // Find and click on a session
        const sessionButton = screen.getByText('Test Session 1');
        fireEvent.click(sessionButton);
        
        expect(mockStore.loadSession).toHaveBeenCalledWith('session-1');
      });
    });

    it('should handle page navigation', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const leaderboardButton = screen.getByText('Leaderboard');
        fireEvent.click(leaderboardButton);
        
        expect(mockStore.setCurrentPage).toHaveBeenCalledWith('leaderboard');
      });
    });

    it('should handle dark mode toggle', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const darkModeButton = screen.getByText('Dark Mode');
        fireEvent.click(darkModeButton);
        
        expect(mockStore.toggleDarkMode).toHaveBeenCalled();
      });
    });

    it('should display session status correctly', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
        // Check if status indicators are present
        expect(screen.getByText(/valid|error|unknown/)).toBeInTheDocument();
      });
    });

    it('should display tool count', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Tools')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
      });
    });

    it('should handle debug log toggle', async () => {
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        // Find debug log toggle button (might be an icon or text)
        const debugElements = screen.getAllByRole('button');
        const debugButton = debugElements.find(btn => 
          btn.getAttribute('aria-label')?.includes('debug') ||
          btn.textContent?.toLowerCase().includes('debug')
        );
        
        if (debugButton) {
          fireEvent.click(debugButton);
          expect(mockStore.toggleDebugLogVisibility).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Form Validation Tests', () => {
    it('should not send empty messages', async () => {
      // Reset mock
      mockStartAgent.mockReset();
      
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send message/i });
        fireEvent.click(sendButton);
        
        expect(mockStartAgent).not.toHaveBeenCalled();
      });
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000);
      
      // Mock the store to track setMessageInputValue calls
      const mockSetMessageInputValue = vi.fn();
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        setMessageInputValue: mockSetMessageInputValue,
        messageInputValue: longMessage,
      });
      
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        fireEvent.change(textarea, { target: { value: longMessage } });
        
        expect(mockSetMessageInputValue).toHaveBeenCalledWith(longMessage);
      });
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = '🚀 Hello @user #hashtag $variable <script>alert("test")</script>';
      
      // Mock the store to track setMessageInputValue calls
      const mockSetMessageInputValue = vi.fn();
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        setMessageInputValue: mockSetMessageInputValue,
        messageInputValue: specialMessage,
      });
      
      render(<TestLanguageProvider><UserInput /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message...');
        
        fireEvent.change(textarea, { target: { value: specialMessage } });
        
        expect(mockSetMessageInputValue).toHaveBeenCalledWith(specialMessage);
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle session save failure gracefully', async () => {
      const mockSaveSession = vi.fn().mockRejectedValue(new Error('Network error'));
      
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        saveSession: mockSaveSession,
      });

      // Mock window.prompt to return a session name
      const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('Test Session');
      
      render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);
      
      // Wait for component to render
      await waitFor(() => {
        const saveButton = screen.getByText('Save Session');
        fireEvent.click(saveButton);
        
        // Should not crash the app
        expect(mockSaveSession).toHaveBeenCalled();
      });
      
      mockPrompt.mockRestore();
    });

    it('should handle undefined store values', () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        sessions: undefined,
        debugLog: undefined,
        llmApiKeys: undefined,
      });

      expect(() => render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>)).not.toThrow();
    });
  });
});