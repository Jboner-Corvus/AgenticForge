import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface DebugPanelProps {
  debugPanelVisible: boolean;
  debugLog: string[];
  toggleDebugPanel: () => void;
  clearDebugLog: () => void;
}

export function DebugPanel({
  debugPanelVisible,
  debugLog,
  toggleDebugPanel,
  clearDebugLog,
}: DebugPanelProps) {
  return (
    <Card id="debug-panel" className="bg-gray-800 border-t border-gray-700 text-gray-100 flex flex-col flex-shrink-0 font-mono text-xs" style={{ height: debugPanelVisible ? '150px' : '0', maxHeight: '25vh', display: 'flex', transition: 'height 0.3s ease-in-out' }}>
      <CardHeader className="flex flex-row items-center justify-between p-2 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold">Journal de débogage</CardTitle>
        <CardDescription className="text-xs text-gray-400">Frontend</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        <div id="debug-log-content" className="space-y-1">
          {debugLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end p-2 border-t border-gray-700">
        <Button onClick={clearDebugLog} size="sm" variant="ghost" className="text-gray-400 hover:text-gray-100">Vider</Button>
        <Button onClick={toggleDebugPanel} size="sm" variant="ghost" className="text-gray-400 hover:text-gray-100">
          {debugPanelVisible ? 'Cacher' : 'Afficher'}
        </Button>
      </CardFooter>
    </Card>
  );
}
