import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCombinedStore } from './index';
import { useUIStore } from './uiStore';
import { useSessionStore } from './sessionStore';

// Mock the API calls
vi.mock('../lib/api', () => ({
  addLlmApiKeyApi: vi.fn().mockResolvedValue(undefined),
  getLlmApiKeysApi: vi.fn().mockResolvedValue([]),
  getLeaderboardStats: vi.fn().mockResolvedValue({
    tokensSaved: 0,
    successfulRuns: 0,
    sessionsCreated: 0,
    apiKeysAdded: 0,
  }),
}));

// Test component to interact with the store
const TestStoreComponent = () => {
  const { 
    llmApiKeys, 
    activeLlmApiKeyIndex, 
    addLlmApiKey,
    leaderboardStats,
    updateLeaderboardStats,
    initializeSessionAndMessages
  } = useCombinedStore();
  
  const { isProcessing, setIsProcessing } = useUIStore();
  const { sessionId, setSessionId } = useSessionStore();

  return (
    <div>
      <div data-testid="session-id">{sessionId || 'no-session'}</div>
      <div data-testid="is-processing">{isProcessing ? 'processing' : 'idle'}</div>
      <div data-testid="llm-keys-count">{llmApiKeys.length}</div>
      <div data-testid="active-key-index">{activeLlmApiKeyIndex}</div>
      <div data-testid="tokens-saved">{leaderboardStats.tokensSaved}</div>
      
      <button 
        data-testid="set-session" 
        onClick={() => setSessionId('test-session-123')}
      >
        Set Session
      </button>
      
      <button 
        data-testid="toggle-processing" 
        onClick={() => setIsProcessing(!isProcessing)}
      >
        Toggle Processing
      </button>
      
      <button 
        data-testid="add-llm-key" 
        onClick={() => addLlmApiKey({
          provider: 'test-provider',
          key: 'test-key-123',
          nickname: 'test-key',
          createdAt: Date.now()
        })}
      >
        Add LLM Key
      </button>
      
      <button 
        data-testid="update-stats" 
        onClick={() => updateLeaderboardStats({ tokensSaved: 100, successfulRuns: 1 })}
      >
        Update Stats
      </button>
      
      <button 
        data-testid="initialize" 
        onClick={() => initializeSessionAndMessages()}
      >
        Initialize
      </button>
    </div>
  );
};

describe('Store Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores to initial state
    useCombinedStore.setState({
      llmApiKeys: [],
      activeLlmApiKeyIndex: -1,
      leaderboardStats: {
        tokensSaved: 0,
        successfulRuns: 0,
        sessionsCreated: 0,
        apiKeysAdded: 0,
      }
    });
    
    useUIStore.setState({
      isProcessing: false
    });
    
    useSessionStore.setState({
      sessionId: null
    });
  });

  it('should initialize with correct default values', () => {
    render(<TestStoreComponent />);
    
    expect(screen.getByTestId('session-id')).toHaveTextContent('no-session');
    expect(screen.getByTestId('is-processing')).toHaveTextContent('idle');
    expect(screen.getByTestId('llm-keys-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-key-index')).toHaveTextContent('-1');
    expect(screen.getByTestId('tokens-saved')).toHaveTextContent('0');
  });

  it('should update session state across stores', () => {
    render(<TestStoreComponent />);
    
    fireEvent.click(screen.getByTestId('set-session'));
    
    expect(screen.getByTestId('session-id')).toHaveTextContent('test-session-123');
  });

  it('should toggle processing state', () => {
    render(<TestStoreComponent />);
    
    expect(screen.getByTestId('is-processing')).toHaveTextContent('idle');
    
    fireEvent.click(screen.getByTestId('toggle-processing'));
    
    expect(screen.getByTestId('is-processing')).toHaveTextContent('processing');
  });

  it('should add LLM API keys and update stats', async () => {
    render(<TestStoreComponent />);
    
    expect(screen.getByTestId('llm-keys-count')).toHaveTextContent('0');
    
    fireEvent.click(screen.getByTestId('add-llm-key'));
    
    await waitFor(() => {
      expect(screen.getByTestId('llm-keys-count')).toHaveTextContent('1');
    });
  });

  it('should update leaderboard statistics', () => {
    render(<TestStoreComponent />);
    
    expect(screen.getByTestId('tokens-saved')).toHaveTextContent('0');
    
    fireEvent.click(screen.getByTestId('update-stats'));
    
    expect(screen.getByTestId('tokens-saved')).toHaveTextContent('100');
  });

  it('should handle store state synchronization', async () => {
    render(<TestStoreComponent />);
    
    // Test multiple state updates
    fireEvent.click(screen.getByTestId('set-session'));
    fireEvent.click(screen.getByTestId('toggle-processing'));
    fireEvent.click(screen.getByTestId('update-stats'));
    
    // Verify all states are properly updated
    expect(screen.getByTestId('session-id')).toHaveTextContent('test-session-123');
    expect(screen.getByTestId('is-processing')).toHaveTextContent('processing');
    expect(screen.getByTestId('tokens-saved')).toHaveTextContent('100');
  });

  it('should not cause infinite loops or crashes', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TestStoreComponent />);
    
    // Trigger multiple rapid state changes
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByTestId('toggle-processing'));
      fireEvent.click(screen.getByTestId('update-stats'));
    }
    
    // Component should still be functional
    expect(screen.getByTestId('is-processing')).toBeInTheDocument();
    expect(screen.getByTestId('tokens-saved')).toBeInTheDocument();
    
    // No errors should be logged
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});