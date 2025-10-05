import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../lib/store';
import UserInput from './UserInput';
import ControlPanel from './ControlPanel';

// Mock implementations
const mockStartAgent = vi.fn();
const mockClearMessages = vi.fn();
const mockSaveSession = vi.fn();
const mockLoadSession = vi.fn();
const mockSetPage = vi.fn();
const mockToggleDarkMode = vi.fn();
const mockSetDebugLog = vi.fn();

// Mock store
const mockStore = {
  messages: [],
  processing: false,
  darkMode: false,
  currentPage: 'chat' as const,
  debugLog: false,
  tools: [],
  sessionStatus: {
    currentSessionId: 'test-session',
    hasUnsavedChanges: false,
    isLoading: false,
    lastSaved: null,
  },
  startAgent: mockStartAgent,
  clearMessages: mockClearMessages,
  saveSession: mockSaveSession,
  loadSession: mockLoadSession,
  setPage: mockSetPage,
  toggleDarkMode: mockToggleDarkMode,
  setDebugLog: mockSetDebugLog,
};

// Mock store hook
vi.mock('../lib/store', () => ({
  useStore: () => mockStore,
}));

// Mock Electron API
const mockElectronAPI = {
  saveSession: vi.fn().mockResolvedValue(undefined),
  loadSession: vi.fn().mockResolvedValue(undefined),
};

global.window.electronAPI = mockElectronAPI;

describe('User Interaction Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.messages = [];
    mockStore.processing = false;
  });

  describe('UserInput Component Interactions', () => {
    it('should handle message input and submission', async () => {
      render(<UserInput />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(mockStartAgent).toHaveBeenCalledWith('Test message');
      expect(input).toHaveValue('');
    });

    it('should handle keyboard shortcuts', async () => {
      render(<UserInput />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      expect(mockStartAgent).toHaveBeenCalledWith('Test message');
      expect(input).toHaveValue('');
    });

    it('should show loading state during processing', async () => {
      mockStore.processing = true;
      render(<UserInput />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should handle clear messages action', async () => {
      render(<ControlPanel />);
      
      const clearButton = screen.getByText(/Clear Messages/i);
      fireEvent.click(clearButton);

      expect(mockClearMessages).toHaveBeenCalled();
    });

    it('should handle save session action', async () => {
      render(<ControlPanel />);
      
      const saveButton = screen.getByText(/Save Session/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSaveSession).toHaveBeenCalled();
        expect(mockElectronAPI.saveSession).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation Tests', () => {
    it('should not send empty messages', () => {
      render(<UserInput />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);

      expect(mockStartAgent).not.toHaveBeenCalled();
    });

    it('should handle very long messages', () => {
      render(<UserInput />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const longMessage = 'A'.repeat(10000);
      
      fireEvent.change(input, { target: { value: longMessage } });
      fireEvent.click(input);

      expect(mockStartAgent).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters in messages', () => {
      render(<UserInput />);
      
      const input = screen.getByPlaceholderText(/Type your message/i);
      const specialMessage = 'Test with émojis 🎉 and spéci@l chars!';
      
      fireEvent.change(input, { target: { value: specialMessage } });
      fireEvent.click(input);

      expect(mockStartAgent).toHaveBeenCalledWith(specialMessage);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle session save failure gracefully', async () => {
      mockElectronAPI.saveSession.mockRejectedValue(new Error('Save failed'));
      
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ControlPanel />);
      
      const saveButton = screen.getByText(/Save Session/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSaveSession).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle undefined store values', () => {
      const problematicStore = {
        ...mockStore,
        messages: undefined,
        tools: undefined,
      };
      
      vi.mocked('../lib/store').useStore.mockReturnValue(problematicStore);
      
      expect(() => render(<ControlPanel />)).not.toThrow();
    });
  });
});
