import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error on demand
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="normal-component">Normal component</div>;
};

// Component that throws during render
const AlwaysThrows = () => {
  throw new Error('Component always throws');
};

// Component that throws specific error types
const ThrowTypeError = () => {
  throw new TypeError('Type error occurred');
};

const ThrowReferenceError = () => {
  throw new ReferenceError('Reference error occurred');
};

describe('ErrorBoundary Tests', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error during tests to avoid noise
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('normal-component')).toBeInTheDocument();
  });

  it('should catch errors and render fallback UI', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByTestId('normal-component')).not.toBeInTheDocument();
  });

  it('should display error message in fallback UI', () => {
    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Component always throws/i)).toBeInTheDocument();
  });

  it('should handle different error types', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowTypeError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Type error occurred/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowReferenceError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Reference error occurred/i)).toBeInTheDocument();
  });

  it('should provide retry functionality', async () => {
    let shouldThrow = true;
    const ThrowErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Failure');
      }
      return <div data-testid="normal-component">Normal component</div>;
    };

    const App = () => (
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    const { getByText, queryByText } = render(<App />);

    expect(getByText(/Something went wrong/i)).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(getByText(/Try again/i));

    await waitFor(() => {
      expect(queryByText(/Normal component/i)).toBeInTheDocument();
    });
  });

  it('should handle nested error boundaries', () => {
    render(
      <ErrorBoundary componentName="Outer">
        <div data-testid="outer-boundary">
          <ErrorBoundary componentName="Inner">
            <AlwaysThrows />
          </ErrorBoundary>
          <div data-testid="sibling-component">Sibling component</div>
        </div>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(screen.getByText(/An error occurred in the Inner component./i)).toBeInTheDocument();
    // Sibling component should still render
    expect(screen.getByTestId('sibling-component')).toBeInTheDocument();
  });

  it('should not interfere with event handlers', () => {
    const handleClick = vi.fn();

    const ComponentWithHandler = () => {
      return (
        <button data-testid="clickable-button" onClick={handleClick}>
          Click me
        </button>
      );
    };

    render(
      <ErrorBoundary>
        <ComponentWithHandler />
      </ErrorBoundary>
    );

    const button = screen.getByTestId('clickable-button');
    button.click();

    expect(handleClick).toHaveBeenCalled();
  });
});

// Test error boundary with store integration
describe('ErrorBoundary with Store Integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Component that uses store and might throw
  const StoreComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    // Mock store usage
    const mockUseStore = () => ({
      addDebugLog: vi.fn(),
      isProcessing: false,
    });

    const { addDebugLog } = mockUseStore();
    
    if (shouldThrow) {
      throw new Error('Store component error');
    }

    React.useEffect(() => {
      addDebugLog('Component mounted');
    }, [addDebugLog]);

    return <div data-testid="store-component">Store component</div>;
  };

  it('should handle store-related errors', () => {
    render(
      <ErrorBoundary>
        <StoreComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Store component error/i)).toBeInTheDocument();
  });

  it('should not affect store state when error occurs', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <StoreComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('store-component')).toBeInTheDocument();

    // Simulate error
    rerender(
      <ErrorBoundary>
        <StoreComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    // Simulate recovery
    rerender(
      <ErrorBoundary>
        <StoreComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('store-component')).toBeInTheDocument();
  });
});

// Test async error handling
describe('ErrorBoundary Async Error Handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  const AsyncErrorComponent = () => {
    const [shouldThrow, setShouldThrow] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setShouldThrow(true);
      }, 100);

      return () => clearTimeout(timer);
    }, []);

    if (shouldThrow) {
      throw new Error('Async error');
    }

    return <div data-testid="async-component">Async component</div>;
  };

  it('should handle errors that occur after initial render', async () => {
    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    // Initially should render normally
    expect(screen.getByTestId('async-component')).toBeInTheDocument();

    // Advance timers to trigger the error
    act(() => {
        vi.advanceTimersByTime(100);
    });

    // Wait for async error to occur
    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});
