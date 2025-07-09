import { memo } from 'react';
import { useDraggablePane } from '../lib/hooks/useDraggablePane';
import { fr } from '../constants/fr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface DebugPanelProps {
  clearDebugLog: () => void;
  debugLog: string[];
  debugPanelVisible: boolean;
  toggleDebugPanel: () => void;
}

export const DebugPanel = memo(({
  clearDebugLog,
  debugLog,
  debugPanelVisible,
  toggleDebugPanel,
}: DebugPanelProps) => {
  const { handleDragStart, height } = useDraggablePane(150);

  return (
    <Card
      className="bg-secondary border-t border-border text-secondary-foreground flex flex-col flex-shrink-0 font-mono text-xs relative"
      id="debug-panel"
      style={{ height: debugPanelVisible ? height : 0, transition: 'height 0.3s ease-in-out' }}
    >
      <div className="absolute top-0 left-0 w-full h-2 cursor-row-resize" onMouseDown={handleDragStart} />
      <CardHeader className="flex flex-row items-center justify-between p-2 border-b border-border">
        <CardTitle className="text-sm font-semibold">{fr.debugLog}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{fr.frontend}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1" id="debug-log-content">
          {debugLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end p-2 border-t border-border">
        <Button className="text-muted-foreground hover:text-foreground" onClick={clearDebugLog} size="sm" variant="ghost">{fr.clear}</Button>
        <Button className="text-muted-foreground hover:text-foreground" onClick={toggleDebugPanel} size="sm" variant="ghost">
          {debugPanelVisible ? fr.hide : fr.show}
        </Button>
      </CardFooter>
    </Card>
  );
});
