
/// <reference types="vitest-dom/extend-expect" />

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useStore } from '../lib/store';
import type { AppState } from '../lib/store';
import { useToast } from '../lib/hooks/useToast';
import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { ControlPanel } from './ControlPanel';

// Mock external hooks and modules
vi.mock('../lib/store', async () => {
  const actual = await vi.importActual('../lib/store');
  return {
    ...actual,
    useStore: vi.fn(),
  };
});
vi.mock('../lib/hooks/useToast');
vi.mock('../lib/hooks/useDraggablePane');

describe('ControlPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockState: AppState = {
      addDebugLog: vi.fn(),
      addMessage: vi.fn(),
      agentStatus: null,
      toolStatus: '',
      authToken: 'test-token',
      browserStatus: 'idle',
      clearDebugLog: vi.fn(),
      clearMessages: vi.fn(),
      codeExecutionEnabled: true,
      debugLog: [],
      messages: [],
      fetchAndDisplayToolCount: vi.fn(),
      isProcessing: false,
      jobId: null,
      messageInputValue: '',
      serverHealthy: true,
      sessionId: 'test-session-id',
      agentProgress: 0,
      canvasContent: '',
      canvasType: 'text',
      isCanvasVisible: false,
      isControlPanelVisible: true,
      isSettingsModalOpen: false,
      isDarkMode: false,
      isHighContrastMode: false,
      toggleHighContrastMode: vi.fn(),
      llmApiKeys: [{ provider: 'openai', key: 'sk-12345' }],
      activeLlmApiKeyIndex: 0,
      addLlmApiKey: vi.fn(),
      removeLlmApiKey: vi.fn(),
      setActiveLlmApiKey: vi.fn(),
      cache: {},
      setCache: vi.fn(),
      clearCache: vi.fn(),
      leaderboardStats: {
        tokensSaved: 100,
        successfulRuns: 10,
        sessionsCreated: 5,
        apiKeysAdded: 1,
      },
      updateLeaderboardStats: vi.fn(),
      sessions: [
        { id: 'session1', name: 'Session One', messages: [], timestamp: 1 },
        { id: 'session2', name: 'Session Two', messages: [], timestamp: 2 },
      ],
      activeSessionId: 'session1',
      sessionStatus: 'valid',
      setAgentStatus: vi.fn(),
      setToolStatus: vi.fn(),
      setAuthToken: vi.fn(),
      setBrowserStatus: vi.fn(),
      setCodeExecutionEnabled: vi.fn(),
      setIsProcessing: vi.fn(),
      setJobId: vi.fn(),
      setMessageInputValue: vi.fn(),
      setServerHealthy: vi.fn(),
      setAgentProgress: vi.fn(),
      setSessionId: vi.fn(),
      setSessionStatus: vi.fn(),
      streamCloseFunc: null,
      setTokenStatus: vi.fn(),
      setToolCount: vi.fn(),
      setToolCreationEnabled: vi.fn(),
      setSessions: vi.fn(),
      setMessages: vi.fn(),
      setActiveSessionId: vi.fn(),
      setCanvasContent: vi.fn(),
      setCanvasType: vi.fn(),
      setIsCanvasVisible: vi.fn(),
      setIsControlPanelVisible: vi.fn(),
      setIsSettingsModalOpen: vi.fn(),
      toggleDarkMode: vi.fn(),
      toggleIsCanvasVisible: vi.fn(),
      clearCanvas: vi.fn(),
      saveSession: vi.fn(),
      loadSession: vi.fn(),
      deleteSession: vi.fn(),
      renameSession: vi.fn(),
      tokenStatus: false,
      toolCount: 5,
      toolCreationEnabled: true,
      updateSessionStatus: vi.fn(),
      startAgent: vi.fn(),
    };

    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));
    (useToast as Mock).mockReturnValue({ toast: vi.fn() });
    (useDraggableSidebar as Mock).mockReturnValue({ handleDragStart: vi.fn(), width: 320 });

    // Mock window.prompt and window.confirm
    vi.spyOn(window, 'prompt').mockReturnValue('New Session Name');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Mock console.log to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should render status tab with correct information', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Status'));

    expect(screen.getByText(/test-session-id/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // toolCount
    expect(screen.getByText('Online')).toBeInTheDocument(); // serverHealthy
    expect(screen.getByText('idle')).toBeInTheDocument(); // browserStatus
  });

  it('should render capabilities tab with toggles', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Capabilities'));

    expect(screen.getByLabelText('Tool Creation')).toBeInTheDocument();
    expect(screen.getByLabelText('Code Execution')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /tool creation/i })).toBeChecked();
    expect(screen.getByRole('switch', { name: /code execution/i })).toBeChecked();
  });

  it('should toggle code execution enabled state', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Capabilities'));

    const codeExecutionToggle = screen.getByRole('switch', { name: /code execution/i });
    fireEvent.click(codeExecutionToggle);
    expect(useStore.getState().setCodeExecutionEnabled).toHaveBeenCalledWith(false);
  });

  it('should toggle tool creation enabled state', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Capabilities'));

    const toolCreationToggle = screen.getByRole('switch', { name: /tool creation/i });
    fireEvent.click(toolCreationToggle);
    expect(useStore.getState().setToolCreationEnabled).toHaveBeenCalledWith(false);
  });

  it('should handle new session creation', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Actions'));
    fireEvent.click(screen.getByRole('button', { name: /new session/i }));

    expect(useStore.getState().setSessionId).toHaveBeenCalled();
    expect(useStore.getState().addMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'agent_response' }));
    expect(useStore.getState().clearMessages).toHaveBeenCalled();
    expect(useStore.getState().fetchAndDisplayToolCount).toHaveBeenCalled();
    expect(useStore.getState().addDebugLog).toHaveBeenCalled();
  });

  it('should clear history', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Actions'));
    fireEvent.click(screen.getByRole('button', { name: /clear history/i }));

    expect(useStore.getState().clearMessages).toHaveBeenCalled();
    expect(useStore.getState().addDebugLog).toHaveBeenCalled();
  });

  it('should save current session', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Actions'));
    fireEvent.click(screen.getByRole('button', { name: /save current session/i }));

    expect(window.prompt).toHaveBeenCalledWith("Enter a name for the current session:");
    expect(useStore.getState().saveSession).toHaveBeenCalledWith('New Session Name');
  });

  it('should render session history and allow loading/deleting/renaming', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('History'));

    expect(screen.getByText('Session One')).toBeInTheDocument();
    expect(screen.getByText('Session Two')).toBeInTheDocument();
    expect(screen.getByText('Session One')).toHaveTextContent('Active');

    // Load session
    fireEvent.click(screen.getByLabelText('Load session', { selector: 'button' }));
    expect(useStore.getState().loadSession).toHaveBeenCalledWith('session1');

    // Delete session
    fireEvent.click(screen.getByLabelText('Delete session', { selector: 'button' }));
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this session?");
    expect(useStore.getState().deleteSession).toHaveBeenCalledWith('session1');

    // Rename session
    fireEvent.click(screen.getByLabelText('Rename session', { selector: 'button' }));
    expect(screen.getByRole('dialog', { name: /rename session/i })).toBeInTheDocument();
    const renameInput = screen.getByLabelText('New session name');
    fireEvent.change(renameInput, { target: { value: 'Updated Session Name' } });
    fireEvent.click(screen.getByRole('button', { name: /rename/i }));
    expect(useStore.getState().renameSession).toHaveBeenCalledWith('session1', 'Updated Session Name');
    expect(screen.queryByRole('dialog', { name: /rename session/i })).not.toBeInTheDocument();
  });

  it('should render leaderboard stats', () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Leaderboard'));

    expect(screen.getByText('Tokens Saved:')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Successful Runs:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Sessions Created:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('API Keys Added:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should handle LLM API key management', async () => {
    render(<ControlPanel />);
    fireEvent.click(screen.getByText('Login'));

    // Add API Key
    const openaiInput = screen.getByLabelText('OpenAI API Key Input') as HTMLInputElement;
    fireEvent.change(openaiInput, { target: { value: 'new-openai-key' } });
    fireEvent.click(screen.getByLabelText('Add OpenAI API Key'));
    expect(useStore.getState().addLlmApiKey).toHaveBeenCalledWith('openai', 'new-openai-key');
    expect(openaiInput.value).toBe('');

    // Set as active
    fireEvent.click(screen.getByLabelText('Set as active'));
    expect(useStore.getState().setActiveLlmApiKey).toHaveBeenCalledWith(0);

    // Remove API Key
    fireEvent.click(screen.getByLabelText('Remove API Key'));
    expect(useStore.getState().removeLlmApiKey).toHaveBeenCalledWith(0);
  });
});
