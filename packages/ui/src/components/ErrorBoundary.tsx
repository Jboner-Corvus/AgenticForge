// Error Boundary component for better error handling
import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryHelper, safeError } from '../utils/codeCleanup';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error
    ErrorBoundaryHelper.logError(error, errorInfo);
    safeError(`ErrorBoundary (${this.props.componentName || 'Unknown'}):`, error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        safeError('Error handler threw an error:', handlerError);
      }
    }

    // Auto-reset after 5 seconds (for development)
    if (process.env.NODE_ENV === 'development') {
      this.resetTimeoutId = setTimeout(() => {
        this.handleReset();
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const componentName = this.props.componentName || 'Component';
      const DefaultFallback = ErrorBoundaryHelper.createErrorFallback(componentName);
      
      return (
        <DefaultFallback 
          error={this.state.error!} 
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// React Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    safeError('useErrorHandler caught error:', error);
    setError(error);
  }, []);

  // Throw error to nearest error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
};