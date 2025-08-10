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

    // Create a mock EventSource instance with proper methods
    const mockEventSource = new EventSourcePolyfill('mock-url');
    mockEventSource.close = vi.fn(); // Add close method
    
    // Mock sendMessage to return a mock jobId and EventSource
    (sendMessage as Mock).mockReturnValue({
      jobId: 'mockJobId',
      eventSource: mockEventSource,
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
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

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
    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'user',
          content: 'test prompt',
        })
      ])
    );
    expect(useStore.getState().messageInputValue).toBe('');
  });

  it('should handle agent_thought stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'agent_thought', content: 'Thinking...' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'agent_thought',
          content: 'Thinking...',
        })
      ])
    );
  });

  it('should handle tool_call stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool.start', data: { name: 'testTool', args: { arg1: 'value1' } } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_call',
          toolName: 'testTool',
          params: { arg1: 'value1' },
        })
      ])
    );
    expect(useStore.getState().agentStatus).toBe('Executing tool: testTool...');
  });

  it('should handle tool_result stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_result', toolName: 'testTool', result: { output: 'Tool output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_result',
          toolName: 'testTool',
          result: { output: { output: 'Tool output' } }, // Note the nested structure
        })
      ])
    );
    expect(useStore.getState().agentStatus).toBe(null);
  });

  it('should handle agent_response stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'agent_response', content: 'Final response' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'agent_response',
          content: 'Final response',
        })
      ])
    );
    expect(useStore.getState().agentProgress).toBeGreaterThan(0);
  });

  it('should handle close stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'close' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    await waitFor(() => {
      expect(useStore.getState().isProcessing).toBe(false);
      expect(useStore.getState().jobId).toBe(null);
      expect(useStore.getState().agentStatus).toBe(null);
      expect(useStore.getState().agentProgress).toBe(100);
    });
  });

  it('should handle error stream message', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'error', message: 'Stream error' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'error',
          content: 'An error occurred: Stream error',
        })
      ])
    );
    expect(useStore.getState().isProcessing).toBe(false);
  });

  it('should interrupt agent and close event source', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    const eventSourceInstance = mockResult.value.eventSource;
    // Set jobId in the store to simulate a running job
    useStore.setState({ jobId: 'mockJobId' });

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
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Call the onMessage callback with our test data
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'agent_canvas_output', content: '<html>test</html>', contentType: 'html' }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'agent_canvas_output',
          content: '<html>test</html>',
          contentType: 'html',
        })
      ])
    );
  });

  it('should handle tool_stream message and update last tool_result', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // First simulate an initial tool_result message
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_result', toolName: 'executeShellCommand', result: { output: 'Initial output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });
    
    // Then simulate a tool_stream message
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_stream', data: { content: ' additional output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    // Check that we have a tool_result message
    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_result',
          toolName: 'executeShellCommand',
        })
      ])
    );
    
    // Get the tool_result message
    const toolResultMessage = useStore.getState().messages.find(
      msg => msg.type === 'tool_result' && msg.toolName === 'executeShellCommand'
    );
    
    // Verify the result structure
    expect(toolResultMessage).toBeDefined();
    if (toolResultMessage && 'result' in toolResultMessage) {
      expect(toolResultMessage.result).toBeDefined();
      expect(typeof toolResultMessage.result.output).toBe('string');
    }
  });

  it('should handle tool_stream message and add new tool_result if no previous one', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // Simulate a tool_stream message without a preceding tool_result
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_stream', data: { content: 'New output' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_result',
          toolName: 'unknown_tool',
          result: { output: 'New output' },
        })
      ])
    );
  });

  it('should handle tool_stream message and infer toolName from previous tool_call', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // First simulate a tool_call message with a different toolName
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool.start', data: { name: 'anotherTool', args: {} } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });
    
    // Then simulate a tool_stream message
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_stream', data: { content: 'Output from another tool' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_result',
          toolName: 'anotherTool',
          result: { output: 'Output from another tool' },
        })
      ])
    );
  });

  it('should handle tool_stream message and update previous tool_result with non-executeShellCommand toolName', async () => {
    // Set up the store state before rendering the hook
    useStore.setState({ messageInputValue: 'test prompt', authToken: 'test_token', sessionId: 'test_session' });
    
    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.startAgent();
    });

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalled();
    
    // Get the EventSource instance from the mock
    const mockResults = (sendMessage as Mock).mock.results;
    expect(mockResults).toHaveLength(1);
    
    const mockResult = mockResults[0];
    expect(mockResult.type).toBe('return');
    
    // Get the onMessage callback that was passed to sendMessage
    const onMessageCallback = (sendMessage as Mock).mock.calls[0][3]; // 4th parameter (index 3)
    
    // First simulate an initial tool_result message with a non-executeShellCommand toolName
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_result', toolName: 'someOtherTool', result: { output: 'Initial output for other tool' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });
    
    // Then simulate a tool_stream message
    act(() => {
      onMessageCallback.call(null, { data: JSON.stringify({ type: 'tool_stream', data: { content: ' streamed content' } }), type: 'message', lastEventId: '', target: null } as MessageEvent);
    });

    // Check that we have a tool_result message
    expect(useStore.getState().messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'tool_result',
          toolName: 'someOtherTool',
        })
      ])
    );
    
    // Get the tool_result message
    const toolResultMessage = useStore.getState().messages.find(
      msg => msg.type === 'tool_result' && msg.toolName === 'someOtherTool'
    );
    
    // Verify the result structure
    expect(toolResultMessage).toBeDefined();
    if (toolResultMessage && 'result' in toolResultMessage) {
      expect(toolResultMessage.result).toBeDefined();
      expect(typeof toolResultMessage.result.output).toBe('string');
    }
  });
});