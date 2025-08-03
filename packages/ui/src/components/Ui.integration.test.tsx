import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { ControlPanel } from './ControlPanel';
import { UserInput } from './UserInput';
import { useStore } from '../lib/store';
import type { AppState } from '../lib/store';
import type { UseBoundStore, StoreApi } from 'zustand';
import { useToast } from '../lib/hooks/useToast';

// Mock external hooks and modules
vi.mock('../lib/store', async () => {
  const actual = await vi.importActual('../lib/store');
  const useStore = vi.fn() as unknown as UseBoundStore<StoreApi<AppState>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (useStore as any).getState = vi.fn();
  return {
    ...actual,
    useStore,
  };
});

vi.mock('../lib/hooks/useToast');
vi.mock('../lib/hooks/useDraggablePane');

import { mockState } from '../lib/__mocks__/store';
import { LanguageProvider } from '../lib/contexts/LanguageProvider';

describe('UI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(mockState));
    (useStore.getState as Mock).mockReturnValue(mockState);
    (useToast as Mock).mockReturnValue({ toast: vi.fn() });
    
    // Mock window.prompt and window.confirm
    vi.spyOn(window, 'prompt').mockReturnValue('Test Session Name');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Mock console.log to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should display API quota exceeded error in ControlPanel', () => {
    // Modify mock state to simulate API quota exceeded
    const errorState = {
      ...mockState,
      debugLog: [
        ...mockState.debugLog,
        'API quota exceeded: 429 RESOURCE_EXHAUSTED',
      ]
    };
    
    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(errorState));
    
    render(<LanguageProvider><ControlPanel /></LanguageProvider>);
    fireEvent.click(screen.getByText('Status'));
    
    // Check that error is displayed
    expect(screen.getByText(/API quota exceeded/i)).toBeInTheDocument();
  });

  it('should display browser launch failure in ControlPanel', () => {
    // Modify mock state to simulate browser launch failure
    const errorState = {
      ...mockState,
      debugLog: [
        ...mockState.debugLog,
        'Browser launch failed: Chrome not found',
      ]
    };
    
    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(errorState));
    
    render(<LanguageProvider><ControlPanel /></LanguageProvider>);
    fireEvent.click(screen.getByText('Status'));
    
    // Check that error is displayed
    expect(screen.getByText(/Browser launch failed/i)).toBeInTheDocument();
  });

  it('should disable UI elements when processing', () => {
    // Modify mock state to simulate processing state
    const processingState = {
      ...mockState,
      isProcessing: true,
    };
    
    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(processingState));
    
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Check that UI elements are disabled during processing
    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should handle empty user input gracefully', () => {
    render(<LanguageProvider><UserInput /></LanguageProvider>);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Try to send empty message
    fireEvent.click(sendButton);
    
    // Verify that startAgent is not called for empty input
    expect(useStore.getState().startAgent).not.toHaveBeenCalled();
  });

  it('should handle network errors in session management', () => {
    // Modify mock state to simulate network error
    const errorState = {
      ...mockState,
      debugLog: [
        ...mockState.debugLog,
        'Network error: Failed to save session',
      ]
    };
    
    (useStore as unknown as Mock).mockImplementation((selector: (state: AppState) => unknown) => selector(errorState));
    
    render(<LanguageProvider><ControlPanel /></LanguageProvider>);
    fireEvent.click(screen.getByText('Actions'));
    fireEvent.click(screen.getByRole('button', { name: /save current session/i }));
    
    // Check that error is displayed
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });
});