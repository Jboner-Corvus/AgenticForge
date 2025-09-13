import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  X,
  Maximize2,
  Minimize2,
  Camera,
  Globe,
  MousePointer,
  Type,
  Eye,
  Clock,
  Zap,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import useWebSocket from '../lib/hooks/useWebSocket';

interface LiveScreenshot {
  imageData: string;
  action: string;
  selector?: string;
  timestamp: number;
  url?: string;
}

interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'screenshot' | 'wait' | 'extract';
  selector?: string;
  value?: string;
  url?: string;
  timestamp: number;
  status: 'running' | 'completed' | 'error';
}

export const PinnedBrowserView: React.FC = () => {
  const [currentScreenshot, setCurrentScreenshot] =
    useState<LiveScreenshot | null>(null);
  const [currentAction, setCurrentAction] = useState<BrowserAction | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [actionHistory, setActionHistory] = useState<BrowserAction[]>([]);
  const screenshotRef = useRef<HTMLImageElement>(null);

  // WebSocket connection for browser events
  const { lastMessage } = useWebSocket();

  console.log('PinnedBrowserView component mounted');

  // Listen for browser events
  useEffect(() => {
    const handleBrowserEvent = (event: CustomEvent) => {
      const data = event.detail;
      console.log('PinnedBrowserView received event:', event.type, data?.type);

      if (data?.type?.startsWith('browser.')) {
        setIsVisible(true);

        // Handle screenshots
        if (
          data.type === 'browser.screenshot.realtime' &&
          data.data?.imageData
        ) {
          console.log('PinnedBrowserView handling screenshot data');
          setCurrentScreenshot({
            imageData: data.data.imageData,
            action: data.data.action,
            selector: data.data.selector,
            timestamp: data.data.timestamp || Date.now(),
            url: data.data.url,
          });
        }

        // Handle navigation
        if (data.type === 'browser.page.loaded' && data.data?.url) {
          setCurrentUrl(data.data.url);
        }

        // Handle actions
        if (
          data.type === 'browser.element.click' ||
          data.type === 'browser.element.type' ||
          data.type === 'browser.content.extracting'
        ) {
          const action: BrowserAction = {
            type: mapEventTypeToAction(data.type),
            selector: data.data?.selector,
            value: data.data?.text || data.data?.value,
            url: data.data?.url,
            timestamp: data.timestamp || Date.now(),
            status: 'running',
          };
          setCurrentAction(action);
          setActionHistory((prev) => [action, ...prev].slice(0, 10)); // Keep last 10 actions
        }

        // Handle action completion
        if (
          data.type === 'browser.screenshot.captured' ||
          data.type === 'browser.content.extracted'
        ) {
          setCurrentAction((prev) =>
            prev ? { ...prev, status: 'completed' } : null,
          );
        }

        // Handle errors
        if (data.type === 'browser.error') {
          setCurrentAction((prev) =>
            prev ? { ...prev, status: 'error' } : null,
          );
        }
      }
    };

    // Listen for browser events from postMessage (legacy)
    window.addEventListener('browser-event' as any, handleBrowserEvent as any);
    console.log('PinnedBrowserView listening for browser-event');

    // Listen for browser events from WebSocket (new way)
    window.addEventListener('message', (event) => {
      if (event.data?.type?.startsWith('browser.')) {
        console.log(
          'PinnedBrowserView received message event:',
          event.data?.type,
        );
        handleBrowserEvent(
          new CustomEvent('browser-event', {
            detail: event.data,
          }),
        );
      }
    });
    console.log('PinnedBrowserView listening for message events');

    // Also listen for browser-live-view events (new approach)
    window.addEventListener(
      'browser-live-view' as any,
      handleBrowserEvent as any,
    );
    console.log('PinnedBrowserView listening for browser-live-view events');

    return () => {
      window.removeEventListener(
        'browser-event' as any,
        handleBrowserEvent as any,
      );
      window.removeEventListener('message', handleBrowserEvent as any);
      window.removeEventListener(
        'browser-live-view' as any,
        handleBrowserEvent as any,
      );
      console.log('PinnedBrowserView event listeners removed');
    };
  }, []);

  // Listen for WebSocket messages
  useEffect(() => {
    console.log('PinnedBrowserView received WebSocket message:', lastMessage);

    if (lastMessage && lastMessage.type?.startsWith('browser.')) {
      console.log(
        '🎯 PinnedBrowserView processing WebSocket browser event:',
        lastMessage.type,
      );
      setIsVisible(true);

      // Handle screenshots from WebSocket
      if (
        lastMessage.type === 'browser.screenshot.realtime' &&
        lastMessage.data?.imageData
      ) {
        console.log('📸 PinnedBrowserView handling WebSocket screenshot data');
        setCurrentScreenshot({
          imageData: lastMessage.data.imageData,
          action: lastMessage.data.action || 'Screenshot',
          selector: lastMessage.data.selector,
          timestamp: lastMessage.data.timestamp || Date.now(),
          url: lastMessage.data.url,
        });
      }

      // Handle navigation from WebSocket
      if (lastMessage.type === 'browser.page.loaded' && lastMessage.data?.url) {
        setCurrentUrl(lastMessage.data.url);
      }

      // Handle actions from WebSocket
      if (
        lastMessage.type === 'browser.element.click' ||
        lastMessage.type === 'browser.element.type' ||
        lastMessage.type === 'browser.content.extracting'
      ) {
        const action: BrowserAction = {
          type: mapEventTypeToAction(lastMessage.type),
          selector: lastMessage.data?.selector,
          value: lastMessage.data?.text || lastMessage.data?.value,
          url: lastMessage.data?.url,
          timestamp: Date.now(),
          status: 'running',
        };
        setCurrentAction(action);
        setActionHistory((prev) => [action, ...prev].slice(0, 10));
      }

      // Handle action completion from WebSocket
      if (
        lastMessage.type === 'browser.screenshot.captured' ||
        lastMessage.type === 'browser.content.extracted'
      ) {
        setCurrentAction((prev) =>
          prev ? { ...prev, status: 'completed' } : null,
        );
      }

      // Handle errors from WebSocket
      if (lastMessage.type === 'browser.error') {
        setCurrentAction((prev) =>
          prev ? { ...prev, status: 'error' } : null,
        );
      }
    }
  }, [lastMessage]);

  // Only show when there are actual browser events or screenshots
  // Remove demo mode to avoid confusion

  const mapEventTypeToAction = (eventType: string): BrowserAction['type'] => {
    if (eventType.includes('click')) return 'click';
    if (eventType.includes('type')) return 'type';
    if (eventType.includes('extract')) return 'extract';
    if (eventType.includes('screenshot')) return 'screenshot';
    if (eventType.includes('wait')) return 'wait';
    return 'navigate';
  };

  const getActionIcon = (type: BrowserAction['type']) => {
    switch (type) {
      case 'navigate':
        return <Globe className="w-4 h-4" />;
      case 'click':
        return <MousePointer className="w-4 h-4" />;
      case 'type':
        return <Type className="w-4 h-4" />;
      case 'screenshot':
        return <Camera className="w-4 h-4" />;
      case 'wait':
        return <Clock className="w-4 h-4" />;
      case 'extract':
        return <Eye className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getActionColor = (status: BrowserAction['status']) => {
    switch (status) {
      case 'running':
        return 'text-blue-500 bg-blue-500/10';
      case 'completed':
        return 'text-green-500 bg-green-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: 1,
          height: isMinimized ? 'auto' : '320px',
        }}
        exit={{ opacity: 0, height: 0 }}
        className="w-full mb-4 relative z-10"
      >
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3 border-b border-blue-200/20 dark:border-blue-800/20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Browser Live View
                </span>
              </div>

              {/* Current URL */}
              {currentUrl && (
                <Badge variant="outline" className="text-xs max-w-xs truncate">
                  <Globe className="w-3 h-3 mr-1" />
                  {currentUrl}
                </Badge>
              )}

              {/* Current Action */}
              {currentAction && (
                <div
                  className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${getActionColor(currentAction.status)}`}
                >
                  {getActionIcon(currentAction.type)}
                  <span className="capitalize">{currentAction.type}</span>
                  {currentAction.status === 'running' && (
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                {isMinimized ? (
                  <Maximize2 className="w-3 h-3" />
                ) : (
                  <Minimize2 className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <CardContent className="p-3">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-64">
                {/* Main Screenshot View */}
                <div className="lg:col-span-2 relative">
                  {currentScreenshot ? (
                    <div className="relative h-full rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800">
                      {currentScreenshot.imageData ? (
                        <img
                          ref={screenshotRef}
                          src={`data:image/png;base64,${currentScreenshot.imageData}`}
                          alt="Browser screenshot"
                          className="w-full h-full object-contain bg-white dark:bg-gray-900"
                          onError={() => {
                            console.error('Failed to load browser screenshot');
                          }}
                        />
                      ) : (
                        // Demo placeholder when no real screenshot
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg flex items-center justify-center">
                              <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-medium">
                              Browser Live View
                            </p>
                            <p className="text-xs mt-1">
                              Waiting for Playwright activity...
                            </p>
                            <div className="mt-3 flex justify-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                                style={{ animationDelay: '0.4s' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live indicator */}
                      <div className="absolute top-2 left-2 flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span>LIVE</span>
                        </div>
                      </div>

                      {/* Action overlay */}
                      {currentAction && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(currentAction.type)}
                              <span>
                                {currentAction.type === 'click' &&
                                  `Clicking: ${currentAction.selector || 'element'}`}
                                {currentAction.type === 'type' &&
                                  `Typing: "${currentAction.value}"`}
                                {currentAction.type === 'navigate' &&
                                  `Navigating to: ${currentAction.url}`}
                                {currentAction.type === 'extract' &&
                                  `Extracting content`}
                                {currentAction.type === 'screenshot' &&
                                  `Taking screenshot`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                        {new Date(
                          currentScreenshot.timestamp,
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          Waiting for browser activity...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action History Sidebar */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Actions
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {actionHistory.length > 0 ? (
                      actionHistory.map((action, index) => (
                        <motion.div
                          key={`${action.timestamp}-${index}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-xs ${getActionColor(action.status)}`}
                        >
                          {getActionIcon(action.type)}
                          <div className="flex-1 min-w-0">
                            <div className="capitalize font-medium">
                              {action.type}
                            </div>
                            {action.selector && (
                              <div className="text-gray-600 dark:text-gray-400 truncate">
                                {action.selector}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-500">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">
                        No actions yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PinnedBrowserView;
