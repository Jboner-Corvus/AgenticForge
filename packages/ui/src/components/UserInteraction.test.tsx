import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserInput } from './UserInput';
import { ControlPanel } from './ControlPanel';
import { useCombinedStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useCombinedStore: vi.fn(),
}));

// Mock other dependencies
vi.mock('../lib/hooks/useAgentStream', () => ({
  useAgentStream: () => ({
    startAgent: vi.fn(),
    stopAgent: vi.fn(),
  }),
}));

vi.mock('../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      typeMessage: 'Type your message...',
      sendMessage: 'Send message',
      clearMessages: 'Clear Messages',
      saveSession: 'Save Session',
      newSession: 'New Session',
      sessions: 'Sessions',
      status: 'Status',
      tools: 'Tools',
      leaderboard: 'Leaderboard',
      settings: 'Settings',
      darkMode: 'Dark Mode',
    },
  }),
}));

vi.mock('../lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
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
    it('should update input value when typing', () => {
      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      
      expect(mockStore.setMessageInputValue).toHaveBeenCalledWith('Hello world');
    });

    it('should handle enter key for sending message', async () => {
      const mockStartAgent = vi.fn();
      const mockUseAgentStream = vi.mocked((await import('../lib/hooks/useAgentStream')).useAgentStream);
      mockUseAgentStream.mockReturnValue({
        startAgent: mockStartAgent,
        stopAgent: vi.fn(),
      });

      // Set up store with a message
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        messageInputValue: 'Test message',
      });

      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      expect(mockStartAgent).toHaveBeenCalledWith('Test message');
    });

    it('should not send message on Enter + Shift', async () => {
      const mockStartAgent = vi.fn();
      const mockUseAgentStream = vi.mocked((await import('../lib/hooks/useAgentStream')).useAgentStream);
      mockUseAgentStream.mockReturnValue({
        startAgent: mockStartAgent,
        stopAgent: vi.fn(),
      });

      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      
      expect(mockStartAgent).not.toHaveBeenCalled();
    });

    it('should disable input when processing', () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isProcessing: true,
      });

      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      expect(textarea).toBeDisabled();
    });

    it('should show send button when not processing', () => {
      render(<UserInput />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('ControlPanel Component Interactions', () => {
    it('should handle clear messages action', () => {
      render(<ControlPanel />);
      
      const clearButton = screen.getByText('Clear Messages');
      fireEvent.click(clearButton);
      
      expect(mockStore.clearMessages).toHaveBeenCalled();
    });

    it('should handle save session action', async () => {
      // Mock window.prompt
      const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('New Session Name');
      
      render(<ControlPanel />);
      
      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockStore.saveSession).toHaveBeenCalledWith('New Session Name');
      });
      
      mockPrompt.mockRestore();
    });

    it('should handle session loading', () => {
      render(<ControlPanel />);
      
      // Find and click on a session
      const sessionButton = screen.getByText('Test Session 1');
      fireEvent.click(sessionButton);
      
      expect(mockStore.loadSession).toHaveBeenCalledWith('session-1');
    });

    it('should handle page navigation', () => {
      render(<ControlPanel />);
      
      const leaderboardButton = screen.getByText('Leaderboard');
      fireEvent.click(leaderboardButton);
      
      expect(mockStore.setCurrentPage).toHaveBeenCalledWith('leaderboard');
    });

    it('should handle dark mode toggle', () => {
      render(<ControlPanel />);
      
      const darkModeButton = screen.getByText('Dark Mode');
      fireEvent.click(darkModeButton);
      
      expect(mockStore.toggleDarkMode).toHaveBeenCalled();
    });

    it('should display session status correctly', () => {
      render(<ControlPanel />);
      
      expect(screen.getByText('Status')).toBeInTheDocument();
      // Check if status indicators are present
      expect(screen.getByText(/valid|error|unknown/)).toBeInTheDocument();
    });

    it('should display tool count', () => {
      render(<ControlPanel />);
      
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should handle debug log toggle', () => {
      render(<ControlPanel />);
      
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

  describe('Form Validation Tests', () => {
    it('should not send empty messages', async () => {
      const mockStartAgent = vi.fn();
      const mockUseAgentStream = vi.mocked((await import('../lib/hooks/useAgentStream')).useAgentStream);
      mockUseAgentStream.mockReturnValue({
        startAgent: mockStartAgent,
        stopAgent: vi.fn(),
      });

      render(<UserInput />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);
      
      expect(mockStartAgent).not.toHaveBeenCalled();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(5000);
      
      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.change(textarea, { target: { value: longMessage } });
      
      expect(mockStore.setMessageInputValue).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = '🚀 Hello @user #hashtag $variable <script>alert("test")</script>';
      
      render(<UserInput />);
      
      const textarea = screen.getByPlaceholderText('Type your message...');
      
      fireEvent.change(textarea, { target: { value: specialMessage } });
      
      expect(mockStore.setMessageInputValue).toHaveBeenCalledWith(specialMessage);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle session save failure gracefully', async () => {
      const mockSaveSession = vi.fn().mockRejectedValue(new Error('Network error'));
      
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        saveSession: mockSaveSession,
      });

      const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('Test Session');
      
      render(<ControlPanel />);
      
      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);
      
      // Should not crash the app
      await waitFor(() => {
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

      expect(() => render(<ControlPanel />)).not.toThrow();
    });
  });
});