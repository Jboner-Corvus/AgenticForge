import React from 'react';
import { useUIStore } from '../store/uiStore';
import { DebugLog } from './DebugLog';

export const DebugLogContainer: React.FC = () => {
  const isDebugLogVisible = useUIStore((state) => state.isDebugLogVisible);
  const logs = useUIStore((state) => state.debugLog);
  const toggleDebugLogVisibility = useUIStore((state) => state.toggleDebugLogVisibility);

  if (!isDebugLogVisible) {
    return null;
  }

  return <DebugLog logs={logs} onClose={toggleDebugLogVisibility} />;
};
