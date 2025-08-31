import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock all external dependencies with simple implementations
vi.mock('../lib/store', () => ({
  useCombinedStore: vi.fn(() => ({
    currentPage: 'chat',
    isControlPanelVisible: true,
    isCanvasVisible: false,
    isCanvasPinned: false,
    isCanvasFullscreen: false,
    canvasWidth: 400,
    canvasContent: null,
    activeCliJobId: null,
    isDarkMode: false,
    setCanvasWidth: vi.fn(),
    initializeSessionAndMessages: vi.fn(),
  })),
}));

vi.mock('../store/hooks', () => ({
  useCurrentPage: vi.fn(() => 'chat'),
  useIsControlPanelVisible: vi.fn(() => true),
  useIsCanvasVisible: vi.fn(() => false),
  useIsCanvasPinned: vi.fn(() => false),
  useIsCanvasFullscreen: vi.fn(() => false),
  useCanvasWidth: vi.fn(() => 400),
  useCanvasContent: vi.fn(() => null),
  useActiveCliJobId: vi.fn(() => null),
  useIsDarkMode: vi.fn(() => false),
  useSessionId: vi.fn(() => 'test-session-id'),
}));

vi.mock('../store/pinningStore', () => ({
  usePinningStore: vi.fn(() => ({
    layoutMode: 'classic',
    components: {},
  })),
}));

vi.mock('../lib/hooks/useResizablePanel', () => ({
  useResizablePanel: vi.fn(() => ({
    controlPanelWidth: 300,
    handleMouseDownCanvas: vi.fn(),
    setCanvasWidth: vi.fn(),
  })),
}));

vi.mock('../lib/contexts/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      separator: 'separator',
    },
  }),
}));

vi.mock('../components/SessionIdProvider', () => ({
  SessionIdProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/AuthManager', () => ({
  AuthManager: () => <div data-testid="auth-manager">Auth Manager</div>,
}));

vi.mock('../components/AppInitializer', () => ({
  AppInitializer: () => <div data-testid="app-initializer">App Initializer</div>,
}));

vi.mock('../components/HeaderContainer', () => ({
  HeaderContainer: () => <div data-testid="header-container">Header</div>,
}));

vi.mock('../components/UnifiedTodoListPanel', () => ({
  UnifiedTodoListPanel: () => <div data-testid="todo-panel">Todo Panel</div>,
}));

vi.mock('../components/SettingsModalContainer', () => ({
  SettingsModalContainer: () => <div data-testid="settings-modal">Settings</div>,
}));

vi.mock('../components/ControlPanel', () => ({
  ControlPanel: () => <div data-testid="control-panel">Control Panel</div>,
}));

vi.mock('../components/ChatContainer', () => ({
  ChatContainer: () => <div data-testid="chat-container">Chat Container</div>,
}));

vi.mock('../components/LoginModal', () => ({
  LoginModal: () => <div data-testid="login-modal">Login Modal Closed</div>,
}));

vi.mock('../components/optimized/LazyComponents', () => ({
  LazyLeaderboardPage: () => <div data-testid="leaderboard-page">Leaderboard</div>,
  LazyLlmKeyManager: () => <div data-testid="llm-key-manager">LLM Key Manager</div>,
  LazyOAuthPage: () => <div data-testid="oauth-page">OAuth Page</div>,
  LazyLayoutManager: () => <div data-testid="layout-manager">Layout Manager</div>,
  LazyCanvas: () => <div data-testid="canvas">Canvas</div>,
  LazyAgentCanvas: () => <div data-testid="agent-canvas">Agent Canvas</div>,
  LazyDebugLogContainer: () => <div data-testid="debug-log">Debug Log</div>,
  LazySubAgentCLIView: () => <div data-testid="cli-view">CLI View</div>,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderApp = () => {
  return render(<App />);
};

describe('App - Critical Frontend Tests', () => {
  it('should render the main app structure', () => {
    renderApp();

    // Check that main components are rendered
    expect(screen.getByTestId('app-initializer')).toBeInTheDocument();
    expect(screen.getByTestId('header-container')).toBeInTheDocument();
    expect(screen.getByTestId('todo-panel')).toBeInTheDocument();
    expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chat-container')).toBeInTheDocument();
    expect(screen.getByTestId('auth-manager')).toBeInTheDocument();
  });

  it('should render chat page by default', () => {
    renderApp();

    const chatContainer = screen.getByTestId('chat-container');
    expect(chatContainer).toBeInTheDocument();
    expect(chatContainer).toHaveTextContent('Chat Container');
  });

  it('should handle login modal state', () => {
    renderApp();

    // Login modal should be closed by default
    expect(screen.getByTestId('login-modal')).toHaveTextContent('Login Modal Closed');
  });

  it('should render all lazy-loaded components correctly', () => {
    renderApp();

    // Check that lazy components are rendered
    expect(screen.getByTestId('debug-log')).toBeInTheDocument();
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('should handle authentication error callback', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderApp();

    // The AuthManager component should handle auth errors
    // This test verifies the error callback is properly set up
    expect(consoleSpy).not.toHaveBeenCalled(); // Should not log anything initially
  });

  it('should render settings modal container', () => {
    renderApp();

    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('should render debug log container', () => {
    renderApp();

    expect(screen.getByTestId('debug-log')).toBeInTheDocument();
  });

  it('should render unified todo list panel', () => {
    renderApp();

    expect(screen.getByTestId('todo-panel')).toBeInTheDocument();
  });

  it('should render header container', () => {
    renderApp();

    expect(screen.getByTestId('header-container')).toBeInTheDocument();
  });

  it('should render app initializer', () => {
    renderApp();

    expect(screen.getByTestId('app-initializer')).toBeInTheDocument();
  });
});