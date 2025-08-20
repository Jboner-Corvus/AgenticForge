import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { generateUUID } from '../lib/utils/uuid';

interface SessionIdProviderProps {
  children: React.ReactNode;
}

export const SessionIdProvider: React.FC<SessionIdProviderProps> = ({ children }) => {
  const sessionId = useSessionStore(state => state.sessionId);
  const setSessionId = useSessionStore(state => state.setSessionId);
  const setActiveSessionId = useSessionStore(state => state.setActiveSessionId);
  const initialized = useRef(false);

  useEffect(() => {
    // Ensure sessionId is always available at app startup
    // Use a ref to prevent double initialization
    if (!initialized.current) {
      initialized.current = true;
      
      if (!sessionId) {
        const newSessionId = generateUUID();
        console.log('🔐 [SessionIdProvider] Initializing sessionId at app startup:', newSessionId);
        setSessionId(newSessionId);
        setActiveSessionId(newSessionId);
      } else {
        console.log('🔐 [SessionIdProvider] SessionId already exists:', sessionId);
        // Ensure activeSessionId is also set if it's not
        const activeSessionId = useSessionStore.getState().activeSessionId;
        if (!activeSessionId) {
          setActiveSessionId(sessionId);
        }
      }
    }
  }, [sessionId, setSessionId, setActiveSessionId]);

  // Don't render children until sessionId is guaranteed to exist
  if (!sessionId) {
    return <div>Initializing session...</div>;
  }

  return <>{children}</>;
};