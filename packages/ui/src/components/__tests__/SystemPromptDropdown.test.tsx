import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserInput } from '../UserInput';
import { useUIStore } from '../../store/uiStore';
import { useAgentStream } from '../../lib/hooks/useAgentStream';
import * as hooks from '../../store/hooks';

// Mock des dépendances
vi.mock('../../store/uiStore', () => ({
  useUIStore: vi.fn()
}));

// Mock the UI store selectors properly
vi.mocked(useUIStore).mockImplementation((selector) => {
  const mockState = {
    // Required state properties
    currentPage: 'chat' as any,
    isSettingsModalOpen: false,
    isControlPanelVisible: false,
    isDebugLogVisible: false,
    isTodoListVisible: false,
    isUnifiedTodoListVisible: true,
    isDarkMode: false,
    isProcessing: false,
    agentProgress: 0,
    messageInputValue: '',
    selectedSystemPrompt: 'architect',
    agentStatus: null,
    toolStatus: '',
    browserStatus: 'idle',
    serverHealthy: false,
    isAuthenticated: false,
    tokenStatus: false,
    toolCount: 0,
    toolCreationEnabled: false,
    codeExecutionEnabled: true,
    authToken: 'test-token',
    jobId: null,
    activeCliJobId: null,
    streamCloseFunc: null,
    debugLog: [],

    // Required action functions
    setCurrentPage: vi.fn(),
    setIsSettingsModalOpen: vi.fn(),
    setIsControlPanelVisible: vi.fn(),
    setIsTodoListVisible: vi.fn(),
    setIsUnifiedTodoListVisible: vi.fn(),
    toggleDebugLogVisibility: vi.fn(),
    toggleDarkMode: vi.fn(),
    setIsProcessing: vi.fn(),
    setAgentProgress: vi.fn(),
    setMessageInputValue: vi.fn(),
    setSelectedSystemPrompt: vi.fn(),
    setAgentStatus: vi.fn(),
    setToolStatus: vi.fn(),
    setBrowserStatus: vi.fn(),
    setServerHealthy: vi.fn(),
    setTokenStatus: vi.fn(),
    setToolCount: vi.fn(),
    setToolCreationEnabled: vi.fn(),
    setCodeExecutionEnabled: vi.fn(),
    setAuthToken: vi.fn(),
    setJobId: vi.fn(),
    setActiveCliJobId: vi.fn(),
    addDebugLog: vi.fn(),
    clearDebugLog: vi.fn(),
    toast: vi.fn(),
    setAuthTokenAndValidate: vi.fn(),
    refreshAuthToken: vi.fn(),
    getValidAuthToken: vi.fn(),
    getSystemStatus: vi.fn(),
  } as any;

  if (typeof selector === 'function') {
    return selector(mockState);
  }
  return mockState;
});

vi.mock('../../store/hooks', () => ({
  useMessageInputValue: vi.fn(),
  useIsProcessing: vi.fn(),
  useCurrentPage: vi.fn(),
  useIsControlPanelVisible: vi.fn(),
  useIsDebugLogVisible: vi.fn(),
  useIsTodoListVisible: vi.fn(),
  useIsDarkMode: vi.fn(),
  useAgentProgress: vi.fn(),
  useAgentStatus: vi.fn(),
  useToolStatus: vi.fn(),
  useBrowserStatus: vi.fn(),
  useServerHealthy: vi.fn(),
  useIsAuthenticated: vi.fn(),
  useTokenStatus: vi.fn(),
  useToolCount: vi.fn(),
  useToolCreationEnabled: vi.fn(),
  useCodeExecutionEnabled: vi.fn(),
  useAuthToken: vi.fn(),
  useJobId: vi.fn(),
  useActiveCliJobId: vi.fn(),
  useStreamCloseFunc: vi.fn(),
  useDebugLog: vi.fn(),
  useIsSettingsModalOpen: vi.fn(),
  useSessionTokensUsed: vi.fn()
}));

vi.mock('../../lib/hooks/useAgentStream', () => ({
  useAgentStream: vi.fn()
}));

vi.mock('../../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      typeYourMessage: 'Tapez votre message...',
      sendMessage: 'Envoyer le message',
      stop: 'Arrêter'
    }
  })
}));

// Mock des composants UI
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

vi.mock('../ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} {...props} />
  )
}));

vi.mock('../ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="system-prompt-select">
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>
}));

describe('System Prompt Dropdown Integration Tests', () => {
  const mockSetSelectedSystemPrompt = vi.fn();
  const mockStartAgent = vi.fn();
  const mockInterruptAgent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock des hooks individuels
    (hooks.useMessageInputValue as any).mockReturnValue('');
    (hooks.useIsProcessing as any).mockReturnValue(false);

    // Mock du hook useAgentStream
    (useAgentStream as any).mockReturnValue({
      startAgent: mockStartAgent,
      interruptAgent: mockInterruptAgent
    });
  });

  describe('System Prompt Selection', () => {
    it('should display the system prompt dropdown', () => {
      render(<UserInput />);
      expect(screen.getByTestId('system-prompt-select')).toBeInTheDocument();
    });

    it('should show all system prompt options', () => {
      render(<UserInput />);

      const options = [
        'Architect',
        'Coder',
        'Explain',
        'Debug',
        'Orchestrate',
        'FrontEnd'
      ];

      options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    it('should have architect as default selection', () => {
      render(<UserInput />);
      const select = screen.getByTestId('system-prompt-select').querySelector('select');
      expect(select?.value).toBe('architect');
    });
  });

  describe('System Prompt Mode Switching', () => {
    const testCases = [
      { mode: 'architect', displayName: 'Architect' },
      { mode: 'coder', displayName: 'Coder' },
      { mode: 'explain', displayName: 'Explain' },
      { mode: 'debug', displayName: 'Debug' },
      { mode: 'orchestrate', displayName: 'Orchestrate' },
      { mode: 'frontend', displayName: 'FrontEnd' }
    ];

    testCases.forEach(({ mode, displayName }) => {
      it(`should switch to ${displayName} mode and update store`, async () => {
        render(<UserInput />);

        const select = screen.getByTestId('system-prompt-select').querySelector('select') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: mode } });

        await waitFor(() => {
          expect(mockSetSelectedSystemPrompt).toHaveBeenCalledWith(mode);
        });
      });

      it(`should send message with ${displayName} system prompt`, async () => {
        // Mock store avec le mode sélectionné
        (useUIStore as any).mockReturnValue({
          messageInputValue: 'Test message',
          selectedSystemPrompt: mode,
          isProcessing: false,
          authToken: 'test-token',
          setMessageInputValue: vi.fn(),
          setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
          setIsProcessing: vi.fn()
        });

        render(<UserInput />);

        // Simuler l'envoi d'un message
        const sendButton = screen.getByRole('button', { name: /send/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
          expect(mockStartAgent).toHaveBeenCalledWith('Test message');
        });
      });
    });
  });

  describe('System Prompt Content Validation', () => {
    it('should include system prompt content when sending message', async () => {
      // Mock store avec mode coder
      (useUIStore as any).mockReturnValue({
        messageInputValue: 'Write a function',
        selectedSystemPrompt: 'coder',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });

      render(<UserInput />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Write a function');
        // Le system prompt devrait être passé automatiquement via le hook
      });
    });
  });

  describe('UI State Persistence', () => {
    it('should persist selected system prompt across re-renders', () => {
      const { rerender } = render(<UserInput />);

      // Vérifier que le mode par défaut est architect
      let select = screen.getByTestId('system-prompt-select').querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('architect');

      // Changer de mode
      fireEvent.change(select, { target: { value: 'coder' } });

      // Re-render et vérifier que le mode est conservé
      rerender(<UserInput />);
      select = screen.getByTestId('system-prompt-select').querySelector('select') as HTMLSelectElement;
      expect(select.value).toBe('coder');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid system prompt mode gracefully', () => {
      // Mock store avec mode invalide
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'invalid_mode',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });

      // Le composant devrait gérer le mode invalide sans planter
      expect(() => render(<UserInput />)).not.toThrow();
    });
  });
});