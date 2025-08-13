import React from 'react';
import { useCombinedStore as useStore } from '../store';
import { DebugLog } from './DebugLog';

export const DebugLogContainer: React.FC = () => {
  const isDebugLogVisible = useStore((state) => state.isDebugLogVisible);
  const logs = useStore((state) => state.debugLog);
  const toggleDebugLogVisibility = useStore((state) => state.toggleDebugLogVisibility);

  if (!isDebugLogVisible) {
    return null;
  }

  return <DebugLog logs={logs} onClose={toggleDebugLogVisibility} />;
};
