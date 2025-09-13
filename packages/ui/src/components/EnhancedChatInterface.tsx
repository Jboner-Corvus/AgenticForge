import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bot,
  User,
  Monitor,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  Eye,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';

export const EnhancedChatInterface: React.FC = () => {
  const messages = useSessionStore((state) => state.messages);
  const isProcessing = useUIStore((state) => state.isProcessing);
  const browserStatus = useUIStore((state) => state.browserStatus);
  const [showMetrics, setShowMetrics] = useState(false);

  // Simple metrics tracking
  const [playwrightMetrics, setPlaywrightMetrics] = useState({
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    isActive: false,
  });

  // Track basic metrics from messages
  useEffect(() => {
    let totalActions = 0;
    let successfulActions = 0;
    let failedActions = 0;
    let isActive = false;

    messages.forEach((message) => {
      const content =
        typeof message === 'object' && 'content' in message
          ? message.content
          : '';
      if (typeof content === 'string') {
        if (
          content.includes('navigate') ||
          content.includes('click') ||
          content.includes('screenshot')
        ) {
          totalActions++;
          if (content.includes('success') || content.includes('completed')) {
            successfulActions++;
          }
          if (content.includes('error') || content.includes('failed')) {
            failedActions++;
          }
          if (
            content.includes('navigating') ||
            content.includes('clicking') ||
            content.includes('typing')
          ) {
            isActive = true;
          }
        }
      }
    });

    setPlaywrightMetrics({
      totalActions,
      successfulActions,
      failedActions,
      isActive,
    });
  }, [messages]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'agent':
        return <Bot className="w-4 h-4" />;
      case 'tool_result':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'agent_thought':
        return <Activity className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-500';
      case 'agent':
        return 'bg-green-500';
      case 'tool_result':
        return 'bg-purple-500';
      case 'error':
        return 'bg-red-500';
      case 'agent_thought':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isPlaywrightRelated = (message: any) => {
    const content =
      typeof message === 'object' && 'content' in message
        ? message.content
        : '';
    return (
      typeof content === 'string' &&
      (content.includes('navigate') ||
        content.includes('click') ||
        content.includes('screenshot') ||
        content.includes('browser'))
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header with metrics toggle */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">
            Agent Chat
          </h2>
          {isProcessing && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
              <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                Agent is thinking...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {playwrightMetrics.totalActions > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Playwright Metrics</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {playwrightMetrics.totalActions}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Playwright Metrics Panel */}
      {showMetrics && playwrightMetrics.totalActions > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20"
        >
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Actions</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {playwrightMetrics.totalActions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Successful</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {playwrightMetrics.successfulActions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {playwrightMetrics.isActive ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-600">
                          Idle
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Browser</span>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    {browserStatus || 'Ready'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {messages.map((message, index) => {
          const messageType =
            typeof message === 'object' && 'type' in message
              ? message.type
              : 'unknown';
          const content =
            typeof message === 'object' && 'content' in message
              ? message.content
              : '';
          const timestamp =
            typeof message === 'object' && 'timestamp' in message
              ? message.timestamp
              : Date.now();

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex space-x-2 sm:space-x-3 ${
                messageType === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex space-x-2 sm:space-x-3 max-w-[95%] sm:max-w-[80%] ${
                  messageType === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getMessageColor(messageType)}`}
                >
                  {getMessageIcon(messageType)}
                </div>

                <div
                  className={`rounded-lg p-2 sm:p-3 ${
                    messageType === 'user'
                      ? 'bg-blue-500 text-white'
                      : messageType === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : messageType === 'agent_thought'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isPlaywrightRelated(message) && (
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Playwright
                      </span>
                    </div>
                  )}

                  <div
                    className={`text-xs sm:text-sm ${
                      messageType === 'user'
                        ? 'text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {typeof content === 'string'
                      ? content
                      : JSON.stringify(content)}
                  </div>

                  <div
                    className={`text-xs mt-1 sm:mt-2 ${
                      messageType === 'user'
                        ? 'text-blue-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {formatTimestamp(timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-2 sm:p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Agent is processing your request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatInterface;
