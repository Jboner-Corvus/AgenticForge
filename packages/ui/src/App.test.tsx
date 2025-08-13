import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import App from './App';

// Mock all store dependencies
vi.mock('./store', () => ({
  useCombinedStore: vi.fn(() => ({
    currentPage: 'chat',
    isControlPanelVisible: true,
    isCanvasVisible: false,
    isCanvasPinned: false,
    isCanvasFullscreen: false,
    canvasWidth: 500,
    canvasContent: '',
    activeCliJobId: null,
    initializeSessionAndMessages: vi.fn(),
  })),
}));

vi.mock('./store/pinningStore', () => ({
  usePinningStore: vi.fn(() => ({
    layoutMode: 'normal',
    components: {
      todolist: { isPinned: false, isVisible: false },
      canvas: { isPinned: false, isVisible: false, isMaximized: false },
    },
  })),
}));

vi.mock('./lib/hooks/useResizablePanel', () => ({
  useResizablePanel: vi.fn(() => ({
    controlPanelWidth: 300,
    handleMouseDownCanvas: vi.fn(),
    setCanvasWidth: vi.fn(),
  })),
}));

vi.mock('./lib/contexts/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="language-provider">{children}</div>,
}));

vi.mock('./lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      separator: 'Separator',
    },
  }),
}));

// Mock all lazy components
vi.mock('./components/optimized/LazyComponents', () => ({
  LazyLeaderboardPage: () => <div data-testid="leaderboard-page">Leaderboard</div>,
  LazyLlmKeyManager: () => <div data-testid="llm-key-manager">LLM Key Manager</div>,
  LazyOAuthPage: () => <div data-testid="oauth-page">OAuth</div>,
  LazyLayoutManager: () => <div data-testid="layout-manager">Layout Manager</div>,
  LazyTodoPanel: () => <div data-testid="todo-panel">Todo Panel</div>,
  LazyCanvas: () => <div data-testid="canvas">Canvas</div>,
  LazyAgentCanvas: () => <div data-testid="agent-canvas">Agent Canvas</div>,
}));

// Mock main components
vi.mock('./components/AppInitializer', () => ({
  AppInitializer: () => <div data-testid="app-initializer">App Initializer</div>,
}));

vi.mock('./components/HeaderContainer', () => ({
  HeaderContainer: () => <div data-testid="header-container">Header</div>,
}));

vi.mock('./components/SettingsModalContainer', () => ({
  SettingsModalContainer: () => <div data-testid="settings-modal">Settings Modal</div>,
}));

vi.mock('./components/ControlPanel', () => ({
  ControlPanel: () => <div data-testid="control-panel">Control Panel</div>,
}));

vi.mock('./components/ChatMessagesContainer', () => ({
  ChatMessagesContainer: () => <div data-testid="chat-messages">Chat Messages</div>,
}));

vi.mock('./components/UserInput', () => ({
  UserInput: () => <div data-testid="user-input">User Input</div>,
}));

vi.mock('./components/DebugLogContainer', () => ({
  DebugLogContainer: () => <div data-testid="debug-log">Debug Log</div>,
}));

vi.mock('./components/SubAgentCLIView', () => ({
  default: () => <div data-testid="sub-agent-cli">Sub Agent CLI</div>,
}));

vi.mock('./components/VersionDisplay', () => ({
  VersionDisplay: () => <div data-testid="version-display">Version</div>,
}));

vi.mock('./components/LoginModal', () => ({
  LoginModal: () => <div data-testid="login-modal">Login Modal</div>,
}));

describe('App Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render App component without crashing', () => {
    render(<App />);
    
    expect(screen.getByTestId('language-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-initializer')).toBeInTheDocument();
    expect(screen.getByTestId('header-container')).toBeInTheDocument();
  });

  it('should render chat page by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    expect(screen.getByTestId('user-input')).toBeInTheDocument();
  });

  it('should render control panel when visible', () => {
    render(<App />);
    
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
  });

  it('should render all essential components', () => {
    render(<App />);
    
    // Core components should be present
    expect(screen.getByTestId('app-initializer')).toBeInTheDocument();
    expect(screen.getByTestId('header-container')).toBeInTheDocument();
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    expect(screen.getByTestId('debug-log')).toBeInTheDocument();
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    expect(screen.getByTestId('version-display')).toBeInTheDocument();
  });

  it('should handle different page states', async () => {
    const { useCombinedStore } = await import('./store');
    
    // Test leaderboard page
    useCombinedStore.mockReturnValue({
      currentPage: 'leaderboard',
      isControlPanelVisible: true,
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasContent: '',
      activeCliJobId: null,
    });
    
    const { rerender } = render(<App />);
    expect(screen.getByTestId('leaderboard-page')).toBeInTheDocument();
    
    // Test LLM keys page
    useCombinedStore.mockReturnValue({
      currentPage: 'llm-api-keys',
      isControlPanelVisible: true,
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasContent: '',
      activeCliJobId: null,
    });
    
    rerender(<App />);
    expect(screen.getByTestId('llm-key-manager')).toBeInTheDocument();
    
    // Test OAuth page
    useCombinedStore.mockReturnValue({
      currentPage: 'oauth',
      isControlPanelVisible: true,
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasContent: '',
      activeCliJobId: null,
    });
    
    rerender(<App />);
    expect(screen.getByTestId('oauth-page')).toBeInTheDocument();
  });

  it('should handle canvas visibility states', async () => {
    const { useCombinedStore } = await import('./store');
    
    // Test canvas visible
    useCombinedStore.mockReturnValue({
      currentPage: 'chat',
      isControlPanelVisible: true,
      isCanvasVisible: true,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasContent: 'test content',
      activeCliJobId: null,
    });
    
    render(<App />);
    expect(screen.getByTestId('agent-canvas')).toBeInTheDocument();
  });

  it('should handle fullscreen canvas', async () => {
    const { useCombinedStore } = await import('./store');
    
    useCombinedStore.mockReturnValue({
      currentPage: 'chat',
      isControlPanelVisible: true,
      isCanvasVisible: true,
      isCanvasPinned: false,
      isCanvasFullscreen: true,
      canvasWidth: 500,
      canvasContent: 'test content',
      activeCliJobId: null,
    });
    
    render(<App />);
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  it('should handle CLI job display', async () => {
    const { useCombinedStore } = await import('./store');
    
    useCombinedStore.mockReturnValue({
      currentPage: 'chat',
      isControlPanelVisible: true,
      isCanvasVisible: false,
      isCanvasPinned: false,
      isCanvasFullscreen: false,
      canvasWidth: 500,
      canvasContent: '',
      activeCliJobId: 'test-job-123',
    });
    
    render(<App />);
    expect(screen.getByTestId('sub-agent-cli')).toBeInTheDocument();
  });

  it('should handle pinned components layout', async () => {
    const { usePinningStore } = await import('./store/pinningStore');
    
    usePinningStore.mockReturnValue({
      layoutMode: 'battlefield',
      components: {
        todolist: { isPinned: true, isVisible: true },
        canvas: { isPinned: true, isVisible: true, isMaximized: false },
      },
    });
    
    render(<App />);
    expect(screen.getByTestId('layout-manager')).toBeInTheDocument();
  });

  it('should handle window resize events', async () => {
    const mockSetCanvasWidth = vi.fn();
    const { useCombinedStore } = await import('./store');
    
    // Mock getState to return setCanvasWidth function
    useCombinedStore.getState = vi.fn(() => ({
      canvasWidth: 800,
      setCanvasWidth: mockSetCanvasWidth,
    }));
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    
    render(<App />);
    
    // Simulate window resize
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      window.dispatchEvent(new Event('resize'));
    });
    
    // Wait for resize handler to execute
    await waitFor(() => {
      expect(mockSetCanvasWidth).toHaveBeenCalled();
    }, { timeout: 100 });
  });

  it('should not crash with undefined props', async () => {
    const { useCombinedStore } = await import('./store');
    
    useCombinedStore.mockReturnValue({
      currentPage: undefined,
      isControlPanelVisible: undefined,
      isCanvasVisible: undefined,
      isCanvasPinned: undefined,
      isCanvasFullscreen: undefined,
      canvasWidth: undefined,
      canvasContent: undefined,
      activeCliJobId: undefined,
    });
    
    expect(() => render(<App />)).not.toThrow();
  });
});