import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgentStream } from './useAgentStream';
import { useStore } from '../store';
import { sendMessage, interrupt } from '../api';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock external modules
vi.mock('../api', () => ({
  sendMessage: vi.fn(),
  interrupt: vi.fn(),
}));
vi.mock('event-source-polyfill', () => {
  return {
    EventSourcePolyfill: vi.fn().mockImplementation(() => ({
      onmessage: null,
      onerror: null,
      close: vi.fn(),
      onopen: null,
      readyState: 0,
      url: 'mock-url',
      withCredentials: false,
      OPEN: 1,
      CONNECTING: 0,
      CLOSED: 2,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  };
});

describe('useAgentStream', () => {
  const initialStoreState = useStore.getState();

  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.setState(initialStoreState, true);
    vi.clearAllMocks();

    // Mock console.log and console.error to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock sendMessage to return a mock jobId and EventSource
    (sendMessage as Mock).mockReturnValue({
      jobId: 'mockJobId',
      eventSource: new EventSourcePolyfill('mock-url'),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not start agent if messageInputValue is empty', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: '' });

    await act(async () => {
      await result.current.startAgent();
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(useStore.getState().isProcessing).toBe(false);
  });

  it('should start agent and set processing state', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    expect(useStore.getState().isProcessing).toBe(true);
    expect(useStore.getState().jobId).toBe('mockJobId');
    expect(sendMessage).toHaveBeenCalledWith(
      'test prompt',
      'test_token',
      'test_session',
      expect.any(Function),
      expect.any(Function),
    );
    expect(useStore.getState().messages).toContainEqual({
      type: 'user',
      content: 'test prompt',
    });
    expect(useStore.getState().messageInputValue).toBe('');
  });

  it('should handle agent_thought stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    // Get the EventSource instance from the mock
    const mockReturn = (sendMessage as Mock).mock.results[0].value;
    const eventSourceInstance = mockReturn.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'agent_thought', content: 'Thinking...' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'agent_thought',
      content: 'Thinking...',
    });
  });

  it('should handle tool_call stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const mockReturn = (sendMessage as Mock).mock.results[0].value;
    const eventSourceInstance = mockReturn.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool.start', data: { name: 'testTool', args: { arg1: 'value1' } } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_call',
      toolName: 'testTool',
      params: { arg1: 'value1' },
    });
    expect(useStore.getState().agentStatus).toBe('Executing tool: testTool...');
  });

  it('should handle tool_result stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const mockReturn = (sendMessage as Mock).mock.results[0].value;
    const eventSourceInstance = mockReturn.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_result', toolName: 'testTool', result: { output: 'Tool output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_result',
      toolName: 'testTool',
      result: { output: 'Tool output' },
    });
    expect(useStore.getState().agentStatus).toBe(null);
  });

  it('should handle agent_response stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'agent_response', content: 'Final response' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'agent_response',
      content: 'Final response',
    });
    expect(useStore.getState().agentProgress).toBeGreaterThan(0);
  });

  it('should handle close stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'close' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    await waitFor(() => {
      expect(useStore.getState().isProcessing).toBe(false);
      expect(useStore.getState().jobId).toBe(null);
      expect(eventSourceInstance.close).toHaveBeenCalled();
      expect(useStore.getState().agentStatus).toBe(null);
      expect(useStore.getState().agentProgress).toBe(100);
    });
  });

  it('should handle error stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'error', message: 'Stream error' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'error',
      content: 'An error occurred: Stream error',
    });
    expect(useStore.getState().isProcessing).toBe(false);
    expect(eventSourceInstance.close).toHaveBeenCalled();
  });

  it('should interrupt agent and close event source', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;

    await act(async () => {
      await result.current.interruptAgent();
    });

    expect(interrupt).toHaveBeenCalledWith(
      'mockJobId',
      'test_token',
      'test_session',
    );
    expect(eventSourceInstance.close).toHaveBeenCalled();
    expect(useStore.getState().isProcessing).toBe(false);
    expect(useStore.getState().jobId).toBe(null);
  });

  it('should handle agent_canvas_output stream message', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'agent_canvas_output', content: '<html>test</html>', contentType: 'html' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'agent_canvas_output',
      content: '<html>test</html>',
      contentType: 'html',
    });
  });

  it('should handle tool_stream message and update last tool_result', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    // Simulate an initial tool_result message
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_result', toolName: 'executeShellCommand', result: { output: 'Initial output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    // Simulate a tool_stream message
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_stream', data: { content: ' additional output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_result',
      toolName: 'executeShellCommand',
      result: { output: 'Initial output additional output' },
    });
  });

  it('should handle tool_stream message and add new tool_result if no previous one', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    // Simulate a tool_stream message without a preceding tool_result
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_stream', data: { content: 'New output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_result',
      toolName: 'unknown_tool',
      result: { output: 'New output' },
    });
  });

  it('should handle tool_stream message and infer toolName from previous tool_call', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    // Simulate a tool_call message with a different toolName
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool.start', data: { name: 'anotherTool', args: {} } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    // Simulate a tool_stream message
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_stream', data: { content: 'Output from another tool' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_result',
      toolName: 'anotherTool',
      result: { output: 'Output from another tool' },
    });
  });

  it('should handle tool_stream message and update previous tool_result with non-executeShellCommand toolName', async () => {
    const { result } = renderHook(() => useAgentStream());
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });

    await act(async () => {
      await result.current.startAgent();
    });

    const eventSourceInstance = (sendMessage as Mock).mock.results[0].value.eventSource;
    const onMessage = eventSourceInstance.onmessage;

    // Simulate an initial tool_result message with a non-executeShellCommand toolName
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_result', toolName: 'someOtherTool', result: { output: 'Initial output for other tool' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    // Simulate a tool_stream message
    act(() => {
      if (onMessage) {
        onMessage.call(eventSourceInstance, { data: JSON.stringify({ type: 'tool_stream', data: { content: ' streamed content' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
      }
    });

    expect(useStore.getState().messages).toContainEqual({
      type: 'tool_result',
      toolName: 'someOtherTool',
      result: { output: 'Initial output for other tool streamed content' },
    });
  });
});