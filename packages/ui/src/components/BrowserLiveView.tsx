import React, { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';

interface LiveScreenshot {
  imageData: string;
  action: string;
  selector?: string;
  timestamp: number;
}

export const BrowserLiveView: React.FC = () => {
  const [liveScreenshots, setLiveScreenshots] = useState<LiveScreenshot[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const browserStatus = useUIStore((state) => state.browserStatus);

  console.log('BrowserLiveView component mounted');

  // Listen for browser events from the global window object
  useEffect(() => {
    const handleBrowserEvent = (event: CustomEvent) => {
      try {
        console.log(
          'BrowserLiveView received event:',
          event.type,
          event.detail?.type,
        );
        if (event.detail?.type?.startsWith('browser.screenshot.realtime')) {
          const screenshotData = event.detail.data as LiveScreenshot;

          // Debug log to see what we're receiving
          console.log('BrowserLiveView received screenshot data:', {
            hasImageData: !!screenshotData?.imageData,
            imageDataType: typeof screenshotData?.imageData,
            imageDataLength: screenshotData?.imageData?.length,
            startsWithDataImage:
              screenshotData?.imageData?.startsWith('data:image/'),
            startsWithDataImageBase64: screenshotData?.imageData?.startsWith(
              'data:image/png;base64,',
            ),
            first100Chars: screenshotData?.imageData?.substring(0, 100),
          });

          // Validate screenshot data
          if (
            screenshotData?.imageData &&
            typeof screenshotData.imageData === 'string' &&
            screenshotData.imageData.length > 0
          ) {
            // Changed from 100 to 0 for better debugging

            console.log(
              'BrowserLiveView received valid screenshot data, length:',
              screenshotData.imageData.length,
            );

            // Use the imageData exactly as received - don't modify it since it should already be properly formatted
            const validatedScreenshot = {
              ...screenshotData,
              timestamp: screenshotData.timestamp || Date.now(),
            };

            setLiveScreenshots((prev) => {
              const newScreenshots = [validatedScreenshot, ...prev].slice(0, 5); // Keep last 5 screenshots
              return newScreenshots;
            });
            setIsVisible(true);
            console.log('BrowserLiveView updated with screenshot');
          } else {
            console.warn(
              'BrowserLiveView received invalid screenshot data:',
              screenshotData,
            );
            if (!screenshotData?.imageData) {
              console.warn('Screenshot data missing imageData field');
            } else if (typeof screenshotData.imageData !== 'string') {
              console.warn(
                'Screenshot imageData is not a string:',
                typeof screenshotData.imageData,
              );
            } else if (screenshotData.imageData.length <= 0) {
              console.warn(
                'Screenshot imageData is empty or too short:',
                screenshotData.imageData.length,
              );
            }
          }
        }

        // Also handle screenshot errors to provide feedback
        if (event.detail?.type === 'browser.screenshot.error') {
          console.warn('Screenshot capture failed:', event.detail.data);
          // Could show a placeholder or error state in the UI
        }
      } catch (error) {
        console.error('Error handling browser event:', error);
      }
    };

    // Listen for custom events from the agent stream
    window.addEventListener(
      'browser-live-view' as any,
      handleBrowserEvent as any,
    );
    console.log('BrowserLiveView mounted and listening for events');

    return () => {
      window.removeEventListener(
        'browser-live-view' as any,
        handleBrowserEvent as any,
      );
      console.log('BrowserLiveView unmounted');
    };
  }, []);

  // Auto-hide after 10 seconds of no activity
  useEffect(() => {
    if (liveScreenshots.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [liveScreenshots]);

  if (!isVisible || liveScreenshots.length === 0) {
    return null;
  }

  const latestScreenshot = liveScreenshots[0];

  // Debug logging for rendering
  console.log('BrowserLiveView rendering check:', {
    isVisible,
    screenshotsCount: liveScreenshots.length,
    hasLatestScreenshot: !!latestScreenshot,
    latestScreenshotData: latestScreenshot
      ? latestScreenshot.imageData?.substring(0, 50) + '...'
      : null,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-900">
            Browser Live View
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        <div className="text-xs text-gray-600 mb-2">
          {browserStatus || 'Agent is browsing...'}
        </div>

        {latestScreenshot && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">
              Action: {latestScreenshot.action}
              {latestScreenshot.selector && (
                <span className="ml-2 text-blue-600">
                  ({latestScreenshot.selector})
                </span>
              )}
            </div>

            <div className="relative">
              <img
                src={latestScreenshot.imageData}
                alt={`Browser screenshot - ${latestScreenshot.action}`}
                className="w-full h-auto rounded border border-gray-200 max-h-64 object-contain"
                onError={(e) => {
                  console.error('Failed to load browser screenshot:', e);
                  console.error(
                    'Screenshot data that failed to load:',
                    latestScreenshot.imageData?.substring(0, 100) + '...',
                  );
                  // Remove the failed screenshot from the list instead of hiding everything
                  setLiveScreenshots((prev) =>
                    prev.filter((_, index) => index !== 0),
                  );
                }}
                onLoad={() => {
                  // Screenshot loaded successfully, ensure visibility
                  console.log('Browser screenshot loaded successfully');
                  setIsVisible(true);
                }}
              />

              {/* Action indicator overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                🔴 LIVE
              </div>

              {/* Timestamp */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {new Date(latestScreenshot.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Screenshot history indicator */}
        {liveScreenshots.length > 1 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {liveScreenshots.length - 1} previous screenshot
            {liveScreenshots.length > 2 ? 's' : ''} available
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserLiveView;
