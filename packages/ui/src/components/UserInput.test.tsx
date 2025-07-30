
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

import { mockState } from '../lib/__mocks__/store';

describe('UserInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
