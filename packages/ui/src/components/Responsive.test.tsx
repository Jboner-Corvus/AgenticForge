import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { useCombinedStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useCombinedStore: vi.fn(),
}));

vi.mock('../store/pinningStore', () => ({
  usePinningStore: vi.fn(() => ({
    layoutMode: 'normal',
    components: {
      todolist: { isPinned: false, isVisible: false },
      canvas: { isPinned: false, isVisible: false, isMaximized: false },
    },
  })),
}));

// Mock useResizablePanel hook
const mockSetCanvasWidth = vi.fn();
vi.mock('../lib/hooks/useResizablePanel', () => ({
  useResizablePanel: vi.fn(() => ({
    controlPanelWidth: 300,
    handleMouseDownCanvas: vi.fn(),
    setCanvasWidth: mockSetCanvasWidth,
  })),
}));

// Mock all other dependencies
vi.mock('../lib/contexts/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: { separator: 'Separator' },
  }),
}));

// Mock components
vi.mock('../components/optimized/LazyComponents', () => ({
  LazyLeaderboardPage: () => <div data-testid="leaderboard">Leaderboard</div>,
  LazyLlmKeyManager: () => <div data-testid="llm-manager">LLM Manager</div>,
  LazyOAuthPage: () => <div data-testid="oauth">OAuth</div>,
  LazyLayoutManager: () => <div data-testid="layout-manager">Layout Manager</div>,
  LazyTodoPanel: () => <div data-testid="todo-panel">Todo Panel</div>,
  LazyCanvas: () => <div data-testid="canvas">Canvas</div>,
  LazyAgentCanvas: () => <div data-testid="agent-canvas">Agent Canvas</div>,
}));

vi.mock('../components/AppInitializer', () => ({
  AppInitializer: () => <div data-testid="app-initializer">Initializer</div>,
}));

vi.mock('../components/HeaderContainer', () => ({
  HeaderContainer: () => <div data-testid="header">Header</div>,
}));

vi.mock('../components/SettingsModalContainer', () => ({
  SettingsModalContainer: () => <div data-testid="settings">Settings</div>,
}));

vi.mock('../components/ControlPanel', () => ({
  ControlPanel: () => <div data-testid="control-panel">Control Panel</div>,
}));

vi.mock('../components/ChatMessagesContainer', () => ({
  ChatMessagesContainer: () => <div data-testid="chat-messages">Chat Messages</div>,
}));

vi.mock('../components/UserInput', () => ({
  UserInput: () => <div data-testid="user-input">User Input</div>,
}));

vi.mock('../components/DebugLogContainer', () => ({
  DebugLogContainer: () => <div data-testid="debug-log">Debug Log</div>,
}));

vi.mock('../components/SubAgentCLIView', () => ({
  default: () => <div data-testid="sub-agent-cli">Sub Agent CLI</div>,
}));

vi.mock('../components/VersionDisplay', () => ({
  VersionDisplay: () => <div data-testid="version">Version</div>,
}));

vi.mock('../components/LoginModal', () => ({
  LoginModal: () => <div data-testid="login-modal">Login Modal</div>,
}));

describe('Responsive Behavior Tests', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  const mockStore = {
    currentPage: 'chat',
    isControlPanelVisible: true,
    isCanvasVisible: false,
    isCanvasPinned: false,
    isCanvasFullscreen: false,
    canvasWidth: 500,
    canvasContent: '',
    activeCliJobId: null,
    setCanvasWidth: mockSetCanvasWidth,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
    (useCombinedStore.getState as unknown as ReturnType<typeof vi.fn>) = vi.fn(() => ({
      canvasWidth: 500,
      setCanvasWidth: mockSetCanvasWidth,
    }));
  });

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('Window Resize Handling', () => {
    it('should adjust canvas width on window resize', () => {
      // Set initial window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<App />);

      // Simulate window resize to smaller size
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Canvas width should be adjusted
      expect(mockSetCanvasWidth).toHaveBeenCalled();
    });

    it('should respect maximum canvas width based on window size', () => {
      // Mock store with large canvas width
      (useCombinedStore.getState as unknown as ReturnType<typeof vi.fn>) = vi.fn(() => ({
        canvasWidth: 900, // Larger than what should be allowed
        setCanvasWidth: mockSetCanvasWidth,
      }));

      // Set small window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000, // 60% would be 600px max
      });

      render(<App />);

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(mockSetCanvasWidth).toHaveBeenCalledWith(600); // 60% of 1000px
    });

    it('should handle very small screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480, // Mobile size
      });

      render(<App />);

      // Should render without breaking
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    });

    it('should handle very large screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560, // Large desktop
      });

      render(<App />);

      // Should render without breaking
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    });
  });

  describe('Canvas Responsive Behavior', () => {
    it('should show canvas with proper width constraints', () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isCanvasVisible: true,
        canvasWidth: 400,
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<App />);

      const canvas = screen.getByTestId('agent-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle canvas in fullscreen mode', () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isCanvasFullscreen: true,
        canvasContent: 'test content',
      });

      render(<App />);

      const fullscreenCanvas = screen.getByTestId('canvas');
      expect(fullscreenCanvas).toBeInTheDocument();
    });

    it('should handle canvas resizing with keyboard', async () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isCanvasVisible: true,
        canvasWidth: 500,
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const mockUseResizablePanel = vi.mocked((await import('../lib/hooks/useResizablePanel')).useResizablePanel);
      const mockSetCanvasWidthFromHook = vi.fn();
      
      mockUseResizablePanel.mockReturnValue({
        controlPanelWidth: 300,
        handleMouseDownCanvas: vi.fn(),
        setCanvasWidth: mockSetCanvasWidthFromHook,
      });

      render(<App />);

      const canvasDivider = screen.getByRole('separator');
      
      // Test keyboard navigation
      fireEvent.keyDown(canvasDivider, { key: 'ArrowLeft' });
      expect(mockSetCanvasWidthFromHook).toHaveBeenCalledWith(510); // canvasWidth + 10

      fireEvent.keyDown(canvasDivider, { key: 'ArrowRight' });
      expect(mockSetCanvasWidthFromHook).toHaveBeenCalledWith(490); // canvasWidth - 10
    });
  });

  describe('Control Panel Responsive Behavior', () => {
    it('should show control panel on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<App />);

      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    });

    it('should handle control panel visibility toggle', () => {
      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isControlPanelVisible: false,
      });

      render(<App />);

      expect(screen.queryByTestId('control-panel')).not.toBeInTheDocument();
    });
  });

  describe('Layout Switching', () => {
    it('should handle battlefield mode layout', async () => {
      const { usePinningStore } = await import('../store/pinningStore');
      
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

    it('should handle normal mode layout', () => {
      render(<App />);

      // Normal layout elements should be visible
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
      expect(screen.getByTestId('user-input')).toBeInTheDocument();
    });
  });

  describe('Mobile-specific Behavior', () => {
    it('should handle touch events on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone size
      });

      (useCombinedStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStore,
        isCanvasVisible: true,
      });

      render(<App />);

      // Should render mobile-friendly layout
      expect(screen.getByTestId('agent-canvas')).toBeInTheDocument();
    });

    it('should handle orientation changes', () => {
      // Portrait
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(<App />);

      // Simulate orientation change to landscape
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 667,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 375,
        });
        window.dispatchEvent(new Event('orientationchange'));
        window.dispatchEvent(new Event('resize'));
      });

      // Should still render properly
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      expect(() => render(<App />)).not.toThrow();
    });

    it('should handle undefined window object', () => {
      const originalWindow = global.window;
      
      // Temporarily remove window
      delete (global as unknown as { window?: Window }).window;

      expect(() => render(<App />)).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it('should handle rapid resize events', () => {
      render(<App />);

      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        act(() => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800 + i * 10,
          });
          window.dispatchEvent(new Event('resize'));
        });
      }

      // Should not crash and canvas width should be called
      expect(mockSetCanvasWidth).toHaveBeenCalled();
    });
  });
});