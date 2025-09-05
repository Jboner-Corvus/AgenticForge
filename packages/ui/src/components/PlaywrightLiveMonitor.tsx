import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
  Activity,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import useWebSocket from '../lib/hooks/useWebSocket';
import { useSessionStore } from '../store/sessionStore';

interface PlaywrightAction {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'extract' | 'error';
  selector?: string;
  value?: string;
  url?: string;
  timestamp: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
  screenshot?: string;
  error?: string;
}

interface PlaywrightSession {
  id: string;
  startTime: number;
  actions: PlaywrightAction[];
  currentUrl?: string;
  isActive: boolean;
  totalDuration: number;
}

interface PlaywrightLiveMonitorProps {
  jobId?: string;
}

export const PlaywrightLiveMonitor: React.FC<PlaywrightLiveMonitorProps> = ({ jobId }) => {
  const [currentSession, setCurrentSession] = useState<PlaywrightSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Get session from store
  const sessionId = useSessionStore((state) => state.sessionId);

  // WebSocket connection
  const { isConnected, lastMessage, subscribeToJob, setSession } = useWebSocket();

  // Subscribe to job events when component mounts, jobId changes, or sessionId changes
  useEffect(() => {
    console.log('🔍 PlaywrightLiveMonitor - Received jobId prop:', jobId, 'sessionId:', sessionId);

    if (jobId) {
      console.log('🔌 PlaywrightLiveMonitor - Subscribing to job events:', jobId);
      subscribeToJob(jobId);
    } else {
      console.log('⚠️ PlaywrightLiveMonitor - No job ID provided, will wait for browser events');
    }
  }, [jobId, sessionId, subscribeToJob]);

  // Set session when component mounts or sessionId changes
  useEffect(() => {
    if (sessionId) {
      console.log('🔄 PlaywrightLiveMonitor - Session changed, updating WebSocket:', sessionId);
      setSession(sessionId);

      // Clear current session data when session changes
      setCurrentSession(null);
      setIsVisible(false);
    }
  }, [sessionId, setSession]);

  // Listen for WebSocket messages
  useEffect(() => {
    console.log('🔍 PlaywrightLiveMonitor - Received message:', lastMessage);

    if (lastMessage && lastMessage.type?.startsWith('browser.')) {
      console.log('🎯 PlaywrightLiveMonitor - Processing browser event:', lastMessage.type);
      setIsVisible(true);

      // Create or update session
      setCurrentSession((prevSession: PlaywrightSession | null) => {
        const session = prevSession || {
          id: `session-${Date.now()}`,
          startTime: Date.now(),
          actions: [],
          isActive: true,
          totalDuration: 0
        };

        // Add new action
        const newAction: PlaywrightAction = {
          id: `action-${Date.now()}`,
          type: mapBrowserEventToAction(lastMessage.type),
          selector: lastMessage.data?.selector,
          value: lastMessage.data?.value,
          url: lastMessage.data?.url,
          timestamp: Date.now(),
          status: 'running',
          screenshot: lastMessage.data?.imageData
        };

        console.log('📝 PlaywrightLiveMonitor - Added action:', newAction.type, newAction.selector);

        session.actions.push(newAction);
        session.currentUrl = lastMessage.data?.url || session.currentUrl;

        return { ...session };
      });
    } else if (lastMessage) {
      console.log('⚠️ PlaywrightLiveMonitor - Ignoring non-browser event:', lastMessage.type);
    }
  }, [lastMessage]);

  // Auto-scroll to latest action
  useEffect(() => {
    if (autoScroll && actionsRef.current) {
      actionsRef.current.scrollTop = actionsRef.current.scrollHeight;
    }
  }, [currentSession?.actions, autoScroll]);

  const mapBrowserEventToAction = (eventType: string): PlaywrightAction['type'] => {
    if (eventType.includes('navigating')) return 'navigate';
    if (eventType.includes('click')) return 'click';
    if (eventType.includes('type')) return 'type';
    if (eventType.includes('screenshot')) return 'screenshot';
    if (eventType.includes('wait')) return 'wait';
    if (eventType.includes('extract')) return 'extract';
    if (eventType.includes('error')) return 'error';
    return 'navigate';
  };

  const getActionIcon = (type: PlaywrightAction['type']) => {
    switch (type) {
      case 'navigate': return '🌐';
      case 'click': return '👆';
      case 'type': return '⌨️';
      case 'screenshot': return '📸';
      case 'wait': return '⏳';
      case 'extract': return '📄';
      case 'error': return '❌';
      default: return '⚡';
    }
  };

  const getActionColor = (status: PlaywrightAction['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const clearSession = () => {
    setCurrentSession(null);
    setIsVisible(false);
  };

  if (!isVisible || !currentSession) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-96'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span className="font-medium text-sm">Playwright Live Monitor</span>
            <div className="flex items-center space-x-1 text-xs">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentSession.actions.length} actions
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSession}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Current URL */}
            {currentSession.currentUrl && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                  <Eye className="w-3 h-3" />
                  <span className="truncate">{currentSession.currentUrl}</span>
                </div>
              </div>
            )}

            {/* Actions List */}
            <div
              ref={actionsRef}
              className="flex-1 overflow-y-auto p-3 space-y-2"
            >
              {currentSession.actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className={`text-lg ${getActionColor(action.status)}`}>
                    {getActionIcon(action.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {action.type}
                      </span>
                      <div className="flex items-center space-x-1">
                        {action.duration && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(action.duration)}
                          </span>
                        )}
                        {action.status === 'running' && (
                          <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
                        )}
                        {action.status === 'completed' && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                        {action.status === 'error' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>

                    {action.selector && (
                      <div className="text-xs text-gray-500 mt-1">
                        Selector: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{action.selector}</code>
                      </div>
                    )}

                    {action.value && (
                      <div className="text-xs text-gray-500 mt-1">
                        Value: "{action.value}"
                      </div>
                    )}

                    {action.error && (
                      <div className="text-xs text-red-500 mt-1">
                        Error: {action.error}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {action.screenshot && (
                    <div className="flex-shrink-0">
                      <img
                        src={action.screenshot}
                        alt="Action screenshot"
                        className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 object-cover cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => {
                          // Open full-size image in new window
                          if (action.screenshot) {
                            const img = new Image();
                            img.src = action.screenshot;
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000;">
                                    <img src="${img.src}" style="max-width:90%;max-height:90%;object-fit:contain;" />
                                  </body>
                                </html>
                              `);
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer with controls */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`h-6 px-2 text-xs ${autoScroll ? 'bg-blue-100 text-blue-700' : ''}`}
                  >
                    {autoScroll ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    Auto-scroll
                  </Button>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDuration(Date.now() - currentSession.startTime)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaywrightLiveMonitor;