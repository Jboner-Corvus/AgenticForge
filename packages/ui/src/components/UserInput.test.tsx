
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { UserInput } from './UserInput';
import { useStore } from '../lib/store';
import type { AppState } from '../lib/store';
import type { UseBoundStore, StoreApi } from 'zustand';

// Mock the useStore hook
vi.mock('../lib/store', async () => {
  const actual = await vi.importActual<typeof import('../lib/store')>('../lib/store');
  return {
    ...actual,
    useStore: vi.fn() as Mock,
  };
});

describe('UserInput', () => {

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
      initializeSessionAndMessages: vi.fn(),
    };

    // @ts-expect-error: Mocking useStore
    (useStore as UseBoundStore<StoreApi<AppState>>).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));
  });

  it('should render the input field and send button', () => {
    render(<UserInput />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should update the input value on change', () => {
    render(<UserInput />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'New message' } });
    expect(useStore.getState().setMessageInputValue).toHaveBeenCalledWith('New message');
  });

  it('should call startAgent and clear input on send button click', () => {
    const mockState = {
      ...useStore.getState(),
      messageInputValue: 'Test message',
    };
    // @ts-expect-error: Mocking useStore
    (useStore as UseBoundStore<StoreApi<AppState>>).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));

    render(<UserInput />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(mockState.startAgent).toHaveBeenCalled();
    expect(mockState.setMessageInputValue).toHaveBeenCalledWith('');
  });

  it('should call startAgent and clear input on Enter key press (without Shift)', () => {
    const mockState = {
      ...useStore.getState(),
      messageInputValue: 'Test message via Enter',
    };
    // @ts-expect-error: Mocking useStore
    (useStore as UseBoundStore<StoreApi<AppState>>).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));

    render(<UserInput />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockState.startAgent).toHaveBeenCalled();
    expect(mockState.setMessageInputValue).toHaveBeenCalledWith('');
  });

  it('should not call startAgent or clear input on Shift+Enter key press', () => {
    render(<UserInput />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(useStore.getState().startAgent).not.toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).not.toHaveBeenCalled();
  });

  it('should not send empty messages', () => {
    render(<UserInput />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(useStore.getState().startAgent).not.toHaveBeenCalled();
    expect(useStore.getState().setMessageInputValue).not.toHaveBeenCalled();
  });

  it('should disable input and button when processing', () => {
    const mockState = {
      ...useStore.getState(),
      isProcessing: true,
    };
    // @ts-expect-error: Mocking useStore
    (useStore as UseBoundStore<StoreApi<AppState>>).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));

    render(<UserInput />);
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});
