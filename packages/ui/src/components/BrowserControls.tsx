import React from 'react';
import { useUIStore } from '../store/uiStore';

export const BrowserControls: React.FC = () => {
  const browserStatus = useUIStore((state) => state.browserStatus);
  const [liveViewEnabled, setLiveViewEnabled] = React.useState(true);
  const [autoScreenshot, setAutoScreenshot] = React.useState(true);

  if (!browserStatus) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center">
          <span className="mr-2">🌐</span>
          Browser Controls
        </h3>
        <div className="text-xs text-gray-500">
          Status: {browserStatus}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="live-view"
              checked={liveViewEnabled}
              onChange={(e) => setLiveViewEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="live-view" className="text-sm text-gray-700">
              Live Visual Feedback
            </label>
          </div>
          <span className="text-xs text-gray-500">Real-time browser screenshots</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-screenshot"
              checked={autoScreenshot}
              onChange={(e) => setAutoScreenshot(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="auto-screenshot" className="text-sm text-gray-700">
              Auto Screenshots
            </label>
          </div>
          <span className="text-xs text-gray-500">Capture screenshots after actions</span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <strong>Current Activity:</strong> {browserStatus}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserControls;