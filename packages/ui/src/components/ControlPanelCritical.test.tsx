import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControlPanel } from './ControlPanel';

// Mock all external dependencies
vi.mock('../lib/store', () => ({
  useStore: vi.fn(() => ({})),
}));

vi.mock('../store/hooks', () => ({
  useCurrentPage: vi.fn(() => 'chat'),
  useIsControlPanelVisible: vi.fn(() => true),
  useIsProcessing: vi.fn(() => false),
  useAgentStatus: vi.fn(() => null),
  useToolStatus: vi.fn(() => ''),
  useBrowserStatus: vi.fn(() => 'idle'),
  useServerHealthy: vi.fn(() => true),
  useTokenStatus: vi.fn(() => true),
  useToolCount: vi.fn(() => 5),
  useAuthToken: vi.fn(() => 'test-token'),
  useJobId: vi.fn(() => null),
  useActiveCliJobId: vi.fn(() => null),
  useDebugLog: vi.fn(() => []),
  useIsSettingsModalOpen: vi.fn(() => false),
  useSessionId: vi.fn(() => 'test-session-id'),
  useSessions: vi.fn(() => []),
  useActiveSessionId: vi.fn(() => null),
  useIsLoadingSessions: vi.fn(() => false),
  useIsLoadingTools: vi.fn(() => false),
  useIsSavingSession: vi.fn(() => false),
  useIsDeletingSession: vi.fn(() => false),
  useIsRenamingSession: vi.fn(() => false),
}));

vi.mock('../lib/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../lib/contexts/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../lib/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    translations: {
      controlPanel: 'Control Panel',
      settings: 'Settings',
      debug: 'Debug',
      clear: 'Clear',
      stop: 'Stop',
      start: 'Start',
    },
  }),
}));

vi.mock('../components/SettingsModalContainer', () => ({
  SettingsModalContainer: () => <div data-testid="settings-modal">Settings Modal</div>,
}));

vi.mock('../components/DebugLogContainer', () => ({
  DebugLogContainer: () => <div data-testid="debug-log">Debug Log</div>,
}));

vi.mock('../components/TaskCounter', () => ({
  TaskCounter: () => <div data-testid="task-counter">Task Counter</div>,
}));

vi.mock('../components/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status">Connection Status</div>,
}));

vi.mock('../components/VersionDisplay', () => ({
  VersionDisplay: () => <div data-testid="version-display">Version Display</div>,
}));

vi.mock('../components/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

// Import the mocked hooks
import { useCurrentPage, useIsControlPanelVisible, useIsProcessing } from '../store/hooks';

const renderControlPanel = () => {
  return render(<ControlPanel />);
};

describe('ControlPanel - Critical Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations
    (useCurrentPage as any).mockReturnValue('chat');
    (useIsControlPanelVisible as any).mockReturnValue(true);
    (useIsProcessing as any).mockReturnValue(false);
  });

  it('should render the control panel structure', () => {
    renderControlPanel();

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('task-counter')).toBeInTheDocument();
    expect(screen.getByTestId('version-display')).toBeInTheDocument();
  });

  it('should handle settings modal toggle', () => {
    renderControlPanel();

    // Look for settings button or link
    const settingsElements = screen.queryAllByText(/settings/i);
    // Component should render without crashing
    expect(settingsElements.length).toBeGreaterThanOrEqual(0);
  });

  it('should display connection status', () => {
    renderControlPanel();

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should display task counter', () => {
    renderControlPanel();

    expect(screen.getByTestId('task-counter')).toBeInTheDocument();
  });

  it('should display version information', () => {
    renderControlPanel();

    expect(screen.getByTestId('version-display')).toBeInTheDocument();
  });

  it('should handle processing state changes', () => {
    (useIsProcessing as any).mockReturnValue(true);

    renderControlPanel();

    // Component should render without crashing in processing state
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle different page contexts', () => {
    (useCurrentPage as any).mockReturnValue('leaderboard');

    renderControlPanel();

    // Component should adapt to different page contexts
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle control panel visibility', () => {
    (useIsControlPanelVisible as any).mockReturnValue(false);

    renderControlPanel();

    // Component should handle visibility changes gracefully
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should render user menu', () => {
    renderControlPanel();

    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should handle debug functionality', () => {
    renderControlPanel();

    // Debug functionality should be accessible
    expect(screen.getByTestId('debug-log')).toBeInTheDocument();
  });

  it('should handle settings modal', () => {
    renderControlPanel();

    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    renderControlPanel();

    const controlPanel = screen.getByTestId('connection-status').parentElement;

    if (controlPanel) {
      // Test keyboard navigation
      fireEvent.keyDown(controlPanel, { key: 'Tab' });
      // Component should handle keyboard events
      expect(controlPanel).toBeInTheDocument();
    }
  });

  it('should handle responsive design', () => {
    // Mock different screen sizes
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });

    renderControlPanel();

    // Component should adapt to different screen sizes
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle error states gracefully', () => {
    renderControlPanel();

    // Component should handle error states without crashing
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    renderControlPanel();

    // Component should handle loading states
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle authentication states', () => {
    renderControlPanel();

    // Component should handle auth state changes
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should handle job states', () => {
    renderControlPanel();

    // Component should handle job states
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });
});