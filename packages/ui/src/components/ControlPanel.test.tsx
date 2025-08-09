import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { ControlPanel } from './ControlPanel';
import { TestLanguageProvider } from '../lib/__mocks__/TestLanguageProvider';
import { useToast } from '../lib/hooks/useToast';

// Mock external hooks and modules
vi.mock('../lib/store', async () => {
  const mod = await import('../lib/__mocks__/store');
  return {
    useStore: mod.useStore,
  };
});
vi.mock('../lib/hooks/useToast');
vi.mock('../lib/hooks/useDraggablePane', async () => {
  const mod = await import('../lib/__mocks__/useDraggablePane');
  return mod;
});
vi.mock('./ui/modal', async () => {
  const mod = await import('../components/__mocks__/Modal');
  return mod;
});



describe('ControlPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useToast as Mock).mockReturnValue({ toast: vi.fn() });
    (useDraggableSidebar as Mock).mockReturnValue({ handleDragStart: vi.fn(), width: 320 });

    // Mock window.prompt and window.confirm
    vi.spyOn(window, 'prompt').mockImplementation(() => 'New Session Name');
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Mock console.log to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should render status tab with correct information', () => {
    render(<TestLanguageProvider><ControlPanel /></TestLanguageProvider>);

    expect(screen.getByTestId('session-id-label')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-label')).toBeInTheDocument();
    expect(screen.getByText('✅ Online')).toBeInTheDocument();
    expect(screen.getByText('Browser Status')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('Tools Detected')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Assuming 0 tools initially
  });
});