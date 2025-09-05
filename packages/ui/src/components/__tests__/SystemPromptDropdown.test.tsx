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

// Mock functions
const mockSetMessageInputValue = vi.fn();
const mockSetSelectedSystemPrompt = vi.fn();

// Create a mutable state for testing
let currentSelectedSystemPrompt = 'architect';

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
    selectedSystemPrompt: currentSelectedSystemPrompt,
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
    setMessageInputValue: mockSetMessageInputValue,
    setSelectedSystemPrompt: (mode: string) => {
      currentSelectedSystemPrompt = mode;
      mockSetSelectedSystemPrompt(mode);
    },
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
  useSessionTokensUsed: vi.fn(),
  useLatestTokenStats: vi.fn()
}));

vi.mock('../../lib/hooks/useAgentStream', () => ({
  useAgentStream: vi.fn()
}));

vi.mock('../../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      typeYourMessage: 'Tapez votre message...',
      sendMessage: 'Send message',
      stop: 'Stop'
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
      <select
        value={value}
        onChange={(e) => {
          if (onValueChange) {
            onValueChange(e.target.value);
          }
        }}
        data-testid="system-prompt-dropdown"
      >
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
  const mockStartAgent = vi.fn();
  const mockInterruptAgent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mutable state
    currentSelectedSystemPrompt = 'architect';

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

    it('should render the system prompt dropdown', () => {
      render(<UserInput />);
      expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
    });

    it('should render with default architect mode', () => {
      render(<UserInput />);
      // Test that the component renders correctly with the default architect mode
      expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
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

    it('should render different system prompt modes', () => {
      // Test that the component can render with different modes
      const modes = ['architect', 'coder', 'explain', 'debug', 'orchestrate', 'frontend'];

      modes.forEach(mode => {
        vi.mocked(useUIStore).mockImplementation((selector) => {
          const mockState = {
            selectedSystemPrompt: mode,
            messageInputValue: '',
            isProcessing: false,
            authToken: 'test-token',
            setMessageInputValue: vi.fn(),
            setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
            setIsProcessing: vi.fn(),
            currentPage: 'chat' as any,
            isSettingsModalOpen: false,
            isControlPanelVisible: false,
            isDebugLogVisible: false,
            isTodoListVisible: false,
            isUnifiedTodoListVisible: true,
            isDarkMode: false,
            agentProgress: 0,
            agentStatus: null,
            toolStatus: '',
            browserStatus: 'idle',
            serverHealthy: false,
            isAuthenticated: false,
            tokenStatus: false,
            toolCount: 0,
            toolCreationEnabled: false,
            codeExecutionEnabled: true,
            jobId: null,
            activeCliJobId: null,
            streamCloseFunc: null,
            debugLog: [],
            latestTokenStats: null,
            setCurrentPage: vi.fn(),
            setIsSettingsModalOpen: vi.fn(),
            setIsControlPanelVisible: vi.fn(),
            setIsTodoListVisible: vi.fn(),
            setIsUnifiedTodoListVisible: vi.fn(),
            toggleDebugLogVisibility: vi.fn(),
            toggleDarkMode: vi.fn(),
            setAgentProgress: vi.fn(),
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
            getSystemStatus: vi.fn()
          } as any;
          if (typeof selector === 'function') {
            return selector(mockState);
          }
          return mockState;
        });

        const { unmount } = render(<UserInput />);
        expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('System Prompt Content Validation', () => {
    it('should render with different system prompt modes', () => {
      // Test that the component renders correctly with different system prompt modes
      const modes = ['architect', 'coder', 'explain'];

      modes.forEach(mode => {
        vi.mocked(useUIStore).mockImplementation((selector) => {
          const mockState = {
            messageInputValue: 'Test input',
            selectedSystemPrompt: mode,
            isProcessing: false,
            authToken: 'test-token',
            setMessageInputValue: vi.fn(),
            setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
            setIsProcessing: vi.fn(),
            currentPage: 'chat' as any,
            isSettingsModalOpen: false,
            isControlPanelVisible: false,
            isDebugLogVisible: false,
            isTodoListVisible: false,
            isUnifiedTodoListVisible: true,
            isDarkMode: false,
            agentProgress: 0,
            agentStatus: null,
            toolStatus: '',
            browserStatus: 'idle',
            serverHealthy: false,
            isAuthenticated: false,
            tokenStatus: false,
            toolCount: 0,
            toolCreationEnabled: false,
            codeExecutionEnabled: true,
            jobId: null,
            activeCliJobId: null,
            streamCloseFunc: null,
            debugLog: [],
            latestTokenStats: null,
            setCurrentPage: vi.fn(),
            setIsSettingsModalOpen: vi.fn(),
            setIsControlPanelVisible: vi.fn(),
            setIsTodoListVisible: vi.fn(),
            setIsUnifiedTodoListVisible: vi.fn(),
            toggleDebugLogVisibility: vi.fn(),
            toggleDarkMode: vi.fn(),
            setAgentProgress: vi.fn(),
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
            getSystemStatus: vi.fn()
          } as any;
          if (typeof selector === 'function') {
            return selector(mockState);
          }
          return mockState;
        });

        const { unmount } = render(<UserInput />);
        expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('UI State Persistence', () => {
    it('should render consistently across re-renders', () => {
      const { rerender } = render(<UserInput />);

      // Vérifier que le composant se rend correctement
      expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Re-render et vérifier que le composant reste stable
      rerender(<UserInput />);
      expect(screen.getByTestId('system-prompt-dropdown')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid system prompt mode gracefully', () => {
      // Mock store avec mode invalide
      vi.mocked(useUIStore).mockImplementation((selector) => {
        const mockState = {
          messageInputValue: '',
          selectedSystemPrompt: 'invalid_mode',
          isProcessing: false,
          authToken: 'test-token',
          setMessageInputValue: vi.fn(),
          setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
          setIsProcessing: vi.fn(),
          currentPage: 'chat' as any,
          isSettingsModalOpen: false,
          isControlPanelVisible: false,
          isDebugLogVisible: false,
          isTodoListVisible: false,
          isUnifiedTodoListVisible: true,
          isDarkMode: false,
          agentProgress: 0,
          agentStatus: null,
          toolStatus: '',
          browserStatus: 'idle',
          serverHealthy: false,
          isAuthenticated: false,
          tokenStatus: false,
          toolCount: 0,
          toolCreationEnabled: false,
          codeExecutionEnabled: true,
          jobId: null,
          activeCliJobId: null,
          streamCloseFunc: null,
          debugLog: [],
          // Add missing properties
          latestTokenStats: null,
          setCurrentPage: vi.fn(),
          setIsSettingsModalOpen: vi.fn(),
          setIsControlPanelVisible: vi.fn(),
          setIsTodoListVisible: vi.fn(),
          setIsUnifiedTodoListVisible: vi.fn(),
          toggleDebugLogVisibility: vi.fn(),
          toggleDarkMode: vi.fn(),
          setAgentProgress: vi.fn(),
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
          getSystemStatus: vi.fn()
        } as any;
        if (typeof selector === 'function') {
          return selector(mockState);
        }
        return mockState;
      });

      // Le composant devrait gérer le mode invalide sans planter
      expect(() => render(<UserInput />)).not.toThrow();
    });
  });
});