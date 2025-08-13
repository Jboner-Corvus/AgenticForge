// Optimized components with React.memo and proper prop comparison
import React, { memo } from 'react';
import { ChatMessagesContainer } from '../ChatMessagesContainer';
import { UserInput } from '../UserInput';
import { HeaderContainer } from '../HeaderContainer';
import { ControlPanel } from '../ControlPanel';
import { VersionDisplay } from '../VersionDisplay';
import { ConnectionStatus } from '../ConnectionStatus';
import type { StoreChatMessage } from '../../store/types';

// Props interfaces for better type safety
interface MemoizedChatProps {
  messages: StoreChatMessage[];
  isProcessing: boolean;
  className?: string;
}

interface MemoizedUserInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

interface MemoizedHeaderProps {
  isControlPanelVisible: boolean;
  isDarkMode: boolean;
  isTodoListVisible: boolean;
  onToggleControlPanel: () => void;
  onToggleDarkMode: () => void;
  onToggleTodoList: () => void;
  onToggleDebugLog: () => void;
  onPageChange: (page: string) => void;
}

interface MemoizedControlPanelProps {
  width: number;
  isVisible: boolean;
  className?: string;
}

// Deep comparison for complex props
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  
  return false;
};

// Memoized ChatMessagesContainer with message comparison
export const MemoizedChatMessages = memo<MemoizedChatProps>(
  ({ className }) => {
    return (
      <div className={className}>
        <ChatMessagesContainer />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for messages array
    return (
      prevProps.className === nextProps.className
    );
  }
);

MemoizedChatMessages.displayName = 'MemoizedChatMessages';

// Memoized UserInput with callback stability
export const MemoizedUserInput = memo<MemoizedUserInputProps>(
  ({ value: _value, onChange: _onChange, onSubmit: _onSubmit, disabled: _disabled, placeholder: _placeholder }) => {
    return (
      <UserInput />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.placeholder === nextProps.placeholder
    );
  }
);

MemoizedUserInput.displayName = 'MemoizedUserInput';

// Memoized Header with action callbacks
export const MemoizedHeader = memo<MemoizedHeaderProps>(
  ({ isControlPanelVisible: _isControlPanelVisible, isDarkMode: _isDarkMode, isTodoListVisible: _isTodoListVisible, onToggleControlPanel: _onToggleControlPanel, onToggleDarkMode: _onToggleDarkMode, onToggleTodoList: _onToggleTodoList, onToggleDebugLog: _onToggleDebugLog, onPageChange: _onPageChange }) => {
    return <HeaderContainer />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isControlPanelVisible === nextProps.isControlPanelVisible &&
      prevProps.isDarkMode === nextProps.isDarkMode &&
      prevProps.isTodoListVisible === nextProps.isTodoListVisible &&
      prevProps.onToggleControlPanel === nextProps.onToggleControlPanel &&
      prevProps.onToggleDarkMode === nextProps.onToggleDarkMode &&
      prevProps.onToggleTodoList === nextProps.onToggleTodoList &&
      prevProps.onToggleDebugLog === nextProps.onToggleDebugLog &&
      prevProps.onPageChange === nextProps.onPageChange
    );
  }
);

MemoizedHeader.displayName = 'MemoizedHeader';

// Memoized ControlPanel
export const MemoizedControlPanel = memo<MemoizedControlPanelProps>(
  ({ width, isVisible, className }) => {
    if (!isVisible) return null;

    return (
      <div className={`flex-shrink-0 overflow-hidden relative ${className || ''}`} style={{ width, minWidth: '250px', maxWidth: '400px' }}>
        <ControlPanel />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.width === nextProps.width &&
      prevProps.isVisible === nextProps.isVisible &&
      prevProps.className === nextProps.className
    );
  }
);

MemoizedControlPanel.displayName = 'MemoizedControlPanel';

// Memoized ConnectionStatus
export const MemoizedConnectionStatus = memo(() => {
  return <ConnectionStatus />;
});

MemoizedConnectionStatus.displayName = 'MemoizedConnectionStatus';

// Memoized VersionDisplay
export const MemoizedVersionDisplay = memo(() => {
  return <VersionDisplay />;
});

MemoizedVersionDisplay.displayName = 'MemoizedVersionDisplay';

// Performance monitoring component
export const PerformanceMonitor: React.FC<{ name: string; children: React.ReactNode }> = memo(
  ({ name, children }) => {
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      if (renderEnd - renderStart > 16) { // More than one frame at 60fps
        console.warn(`🐌 Slow render detected in ${name}: ${(renderEnd - renderStart).toFixed(2)}ms`);
      }
    });

    return <>{children}</>;
  }
);

PerformanceMonitor.displayName = 'PerformanceMonitor';