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
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
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

describe('System Prompt Integration Tests - End-to-End', () => {
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

  describe('Architect Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'architect',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should send architect-specific system prompt', async () => {
      render(<UserInput />);

      // Entrer un message d'architecture
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Design a microservices architecture' } });

      // Cliquer sur envoyer
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Design a microservices architecture');
      });

      // Vérifier que le mode architect est sélectionné
      const select = screen.getByTestId('system-prompt-dropdown') as HTMLSelectElement;
      expect(select.value).toBe('architect');
    });

    it('should display architect mode in dropdown', () => {
      render(<UserInput />);
      expect(screen.getByText('Architect')).toBeInTheDocument();
    });
  });

  describe('Coder Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'coder',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should send coder-specific system prompt', async () => {
      render(<UserInput />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Write a React component' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Write a React component');
      });
    });

    it('should switch to coder mode from dropdown', async () => {
      // Commencer avec architect
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        setMessageInputValue: vi.fn(),
        selectedSystemPrompt: 'architect',
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        isProcessing: false,
        authToken: 'test-token'
      });

      const { rerender } = render(<UserInput />);

      // Changer vers coder
      const select = screen.getByTestId('system-prompt-dropdown');
      fireEvent.change(select, { target: { value: 'coder' } });

      await waitFor(() => {
        expect(mockSetSelectedSystemPrompt).toHaveBeenCalledWith('coder');
      });

      // Re-render avec le nouveau mode
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        setMessageInputValue: vi.fn(),
        selectedSystemPrompt: 'coder',
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        isProcessing: false,
        authToken: 'test-token'
      });

      rerender(<UserInput />);

      const updatedSelect = screen.getByTestId('system-prompt-dropdown') as HTMLSelectElement;
      expect(updatedSelect.value).toBe('coder');
    });
  });

  describe('Explain Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'explain',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should handle educational queries', async () => {
      render(<UserInput />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Explain how closures work in JavaScript' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Explain how closures work in JavaScript');
      });
    });
  });

  describe('Debug Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'debug',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should handle debugging queries', async () => {
      render(<UserInput />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Debug this error: TypeError: Cannot read property' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Debug this error: TypeError: Cannot read property');
      });
    });
  });

  describe('Orchestrate Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'orchestrate',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should handle project management queries', async () => {
      render(<UserInput />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Plan the development of a new feature' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Plan the development of a new feature');
      });
    });
  });

  describe('FrontEnd Mode', () => {
    beforeEach(() => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: 'frontend',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });
    });

    it('should handle frontend development queries', async () => {
      render(<UserInput />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Create a responsive navigation component' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Create a responsive navigation component');
      });
    });
  });

  describe('Mode Switching Workflow', () => {
    it('should allow seamless mode switching during conversation', async () => {
      // Commencer avec architect
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        setMessageInputValue: vi.fn(),
        selectedSystemPrompt: 'architect',
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        isProcessing: false,
        authToken: 'test-token'
      });

      const { rerender } = render(<UserInput />);

      // Premier message en mode architect
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Design system architecture' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Design system architecture');
      });

      // Changer vers coder
      const select = screen.getByTestId('system-prompt-dropdown');
      fireEvent.change(select, { target: { value: 'coder' } });

      // Vérifier que le changement est enregistré
      expect(mockSetSelectedSystemPrompt).toHaveBeenCalledWith('coder');

      // Re-render avec le nouveau mode
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        setMessageInputValue: vi.fn(),
        selectedSystemPrompt: 'coder',
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        isProcessing: false,
        authToken: 'test-token'
      });

      rerender(<UserInput />);

      // Deuxième message en mode coder
      fireEvent.change(textarea, { target: { value: 'Implement the designed architecture' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockStartAgent).toHaveBeenCalledWith('Implement the designed architecture');
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle empty system prompt gracefully', () => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: '',
        selectedSystemPrompt: '',
        isProcessing: false,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });

      // Ne devrait pas planter avec un mode vide
      expect(() => render(<UserInput />)).not.toThrow();
    });

    it('should handle processing state correctly', () => {
      (useUIStore as any).mockReturnValue({
        messageInputValue: 'Test message',
        selectedSystemPrompt: 'architect',
        isProcessing: true,
        authToken: 'test-token',
        setMessageInputValue: vi.fn(),
        setSelectedSystemPrompt: mockSetSelectedSystemPrompt,
        setIsProcessing: vi.fn()
      });

      render(<UserInput />);

      const sendButton = screen.getByRole('button', { name: /stop/i });
      expect(sendButton).toBeInTheDocument();

      fireEvent.click(sendButton);
      expect(mockInterruptAgent).toHaveBeenCalled();
    });
  });
});