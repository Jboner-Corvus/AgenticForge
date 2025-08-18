import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  saveSessionApi, 
  loadSessionApi, 
  deleteSessionApi, 
  renameSessionApi, 
  loadAllSessionsApi 
} from '../lib/api';
import type { Session, SessionStatus, StoreChatMessage } from './types';
import { generateUUID } from '../lib/utils/uuid';

export interface SessionState {
  // Current session state
  sessionId: string | null;
  activeSessionId: string | null;
  sessionStatus: SessionStatus;
  messages: StoreChatMessage[];
  
  // Session history
  sessions: Session[];
  
  // Loading states
  isLoadingSessions: boolean;
  isSavingSession: boolean;
  isDeletingSession: boolean;
  isRenamingSession: boolean;
  
  // Actions
  setSessionId: (sessionId: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setMessages: (messages: StoreChatMessage[]) => void;
  setSessions: (sessions: Session[]) => void;
  setActiveSessionId: (id: string | null) => void;
  addMessage: (message: Omit<StoreChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  // Session management
  saveSession: (name: string) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllSessions: () => Promise<void>;
  renameSession: (id: string, newName: string) => Promise<void>;
  loadAllSessions: () => Promise<void>;
  
  // Loading state setters
  setIsLoadingSessions: (isLoading: boolean) => void;
  setIsSavingSession: (isSaving: boolean) => void;
  setIsDeletingSession: (isDeleting: boolean) => void;
  setIsRenamingSession: (isRenaming: boolean) => void;
  
  // Computed
  getCurrentSession: () => Session | null;
  getSessionById: (id: string) => Session | null;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      return {
      // Initial state
      sessionId: null,
      activeSessionId: null,
      sessionStatus: 'unknown',
      messages: [],
      sessions: [],
      isLoadingSessions: false,
      isSavingSession: false,
      isDeletingSession: false,
      isRenamingSession: false,

      // Basic setters
      setSessionId: (sessionId) => set({ sessionId }),
      setSessionStatus: (sessionStatus) => set({ sessionStatus }),
      setMessages: (messages) => set({ messages }),
      setSessions: (sessions) => set({ sessions }),
      setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
      
      addMessage: (messageData) => {
        console.log('🔥 [SessionStore] addMessage called with:', messageData);
        const baseProps = { 
          id: generateUUID(), 
          timestamp: Date.now() 
        };
        const newMessage = { ...baseProps, ...messageData } as StoreChatMessage;
        console.log('🔥 [SessionStore] Creating message:', newMessage);
        
        set((state) => {
          const newState = {
            messages: [...state.messages, newMessage]
          };
          console.log('🔥 [SessionStore] New messages array length:', newState.messages.length);
          return newState;
        });
      },
      
      clearMessages: () => set({ messages: [] }),

      // Session management
      saveSession: async (name: string) => {
        const state = get();
        if (!state.sessionId) {
          console.warn('No sessionId to save');
          return;
        }

        set({ isSavingSession: true });
        try {
          const sessionData = {
            id: state.sessionId,
            name,
            messages: state.messages,
            timestamp: Date.now(),
            status: state.sessionStatus
          };

          await saveSessionApi(sessionData);
          
          // Update sessions list
          const existingIndex = state.sessions.findIndex(s => s.id === state.sessionId);
          if (existingIndex >= 0) {
            const updatedSessions = [...state.sessions];
            updatedSessions[existingIndex] = sessionData;
            set({ sessions: updatedSessions });
          } else {
            set({ sessions: [...state.sessions, sessionData] });
          }

          console.log(`✅ Session saved: ${name}`);
        } catch (error) {
          console.error('Failed to save session:', error);
          throw error;
        } finally {
          set({ isSavingSession: false });
        }
      },

      loadSession: async (id: string) => {
        set({ isLoadingSessions: true });
        try {
          const sessionData = await loadSessionApi(id);
          if (sessionData) {
            set({
              sessionId: id,
              activeSessionId: id,
              messages: sessionData.messages || [],
              sessionStatus: (sessionData.status as SessionStatus | undefined) || 'valid'
            });
            console.log(`✅ Session loaded: ${sessionData.name}`);
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          set({ sessionStatus: 'error' });
          throw error;
        } finally {
          set({ isLoadingSessions: false });
        }
      },

      deleteSession: async (id: string) => {
        set({ isDeletingSession: true });
        try {
          await deleteSessionApi(id);
          
          // Remove from sessions list
          set((state) => ({
            sessions: state.sessions.filter(s => s.id !== id),
            // Clear active session if it was deleted
            ...(state.activeSessionId === id && {
              activeSessionId: null,
              sessionId: null,
              messages: [],
              sessionStatus: 'unknown'
            })
          }));
          
          console.log(`✅ Session deleted: ${id}`);
        } catch (error) {
          console.error('Failed to delete session:', error);
          throw error;
        } finally {
          set({ isDeletingSession: false });
        }
      },

      deleteAllSessions: async () => {
        const state = get();
        set({ isDeletingSession: true });
        
        try {
          // Delete all sessions
          await Promise.all(state.sessions.map(session => deleteSessionApi(session.id)));
          
          set({
            sessions: [],
            activeSessionId: null,
            sessionId: null,
            messages: [],
            sessionStatus: 'unknown'
          });
          
          console.log('✅ All sessions deleted');
        } catch (error) {
          console.error('Failed to delete all sessions:', error);
          throw error;
        } finally {
          set({ isDeletingSession: false });
        }
      },

      renameSession: async (id: string, newName: string) => {
        set({ isRenamingSession: true });
        try {
          await renameSessionApi(id, newName);
          
          // Update sessions list
          set((state) => ({
            sessions: state.sessions.map(session =>
              session.id === id ? { ...session, name: newName } : session
            )
          }));
          
          console.log(`✅ Session renamed: ${newName}`);
        } catch (error) {
          console.error('Failed to rename session:', error);
          throw error;
        } finally {
          set({ isRenamingSession: false });
        }
      },

      loadAllSessions: async () => {
        set({ isLoadingSessions: true });
        try {
          const authToken = localStorage.getItem('backendAuthToken');
          if (!authToken) {
            console.log('🔐 [sessionStore] No auth token found, cannot load sessions');
            set({ sessions: [] });
            return;
          }
          
          const sessions = await loadAllSessionsApi(authToken, null);
          set({ sessions: sessions || [] });
          console.log(`✅ Loaded ${sessions?.length || 0} sessions`);
        } catch (error) {
          console.error('Failed to load sessions:', error);
          throw error;
        } finally {
          set({ isLoadingSessions: false });
        }
      },

      // Loading state setters
      setIsLoadingSessions: (isLoadingSessions) => set({ isLoadingSessions }),
      setIsSavingSession: (isSavingSession) => set({ isSavingSession }),
      setIsDeletingSession: (isDeletingSession) => set({ isDeletingSession }),
      setIsRenamingSession: (isRenamingSession) => set({ isRenamingSession }),

      // Computed getters
      getCurrentSession: () => {
        const state = get();
        return state.activeSessionId 
          ? state.sessions.find(s => s.id === state.activeSessionId) || null
          : null;
      },

      getSessionById: (id: string) => {
        const state = get();
        return state.sessions.find(s => s.id === id) || null;
      }
    };
  },
    {
      name: 'agenticforge-session-store',
      partialize: (state) => ({
        // Persist only essential session data, not messages or loading states
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        sessionId: state.sessionId
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure sessionId exists after rehydration
        if (state && !state.sessionId) {
          const newSessionId = generateUUID();
          console.log('🔐 [sessionStore] Generated sessionId after rehydration:', newSessionId);
          state.sessionId = newSessionId;
          state.activeSessionId = newSessionId;
        } else if (state && state.sessionId) {
          console.log('🔐 [sessionStore] Restored sessionId from storage:', state.sessionId);
        }
      }
    }
  )
);