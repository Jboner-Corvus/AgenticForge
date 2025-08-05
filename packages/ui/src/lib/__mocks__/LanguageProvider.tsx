import { ReactNode } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

// Mock translations with all the keys needed for tests
const mockTranslations = {
  // ControlPanel translations
  agentStatus: 'Status',
  sessionId: 'Session ID',
  connectionStatus: 'Connection Status',
  online: 'Online',
  offline: 'Offline',
  agentCapabilities: 'Capabilities',
  toolsDetected: 'Tools Detected',
  toolCreation: 'Tool Creation',
  codeExecution: 'Code Execution',
  sessionManagement: 'Actions',
  newSessionButton: 'New Session',
  clearHistory: 'Clear History',
  saveCurrentSession: 'Save Current Session',
  savedSessions: 'History',
  noSessionsSaved: 'No sessions saved',
  active: 'Active',
  // UserInput translations
  typeYourMessage: 'Type your message...',
  send: 'Send',
  // Other translations
  historyCleared: 'History cleared',
  newSessionCreated: 'New session created',
  newSession: 'New session',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <LanguageContext.Provider 
      value={{ 
        language: 'en', 
        translations: mockTranslations, 
        setLanguage: () => {} 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};