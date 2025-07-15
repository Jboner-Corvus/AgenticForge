import { useEffect, useState, memo, useCallback } from 'react';

import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { fr } from '../constants/fr';
import { Accordion } from './ui/accordion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Key, Server, Hammer, Code } from 'lucide-react';
import { useToast } from '../lib/hooks/useToast';
import { Tooltip } from './ui/tooltip';
import { Badge } from './ui/badge';
import { generateUUID } from '../lib/utils/uuid';

import { useStore } from '../lib/store';

export const ControlPanel = memo(() => {
  const authToken = useStore((state) => state.authToken);
  const codeExecutionEnabled = useStore((state) => state.codeExecutionEnabled);
  const serverHealthy = useStore((state) => state.serverHealthy);
  const sessionId = useStore((state) => state.sessionId);
  const toolCount = useStore((state) => state.toolCount);
  const toolCreationEnabled = useStore((state) => state.toolCreationEnabled);
  const setCodeExecutionEnabled = useStore((state) => state.setCodeExecutionEnabled);
  const setToolCreationEnabled = useStore((state) => state.setToolCreationEnabled);
  const clearMessages = useStore((state) => state.clearMessages);
  const addDebugLog = useStore((state) => state.addDebugLog);
  const fetchAndDisplayToolCount = useStore((state) => state.fetchAndDisplayToolCount);
  const setSessionId = useStore((state) => state.setSessionId);
  const addMessage = useStore((state) => state.addMessage);

  const { toast } = useToast();

  const handleClearHistory = useCallback((showMessage: boolean) => {
    clearMessages();
    if (showMessage) {
      toast({ description: fr.historyCleared, title: fr.historyCleared });
      addDebugLog(`[${new Date().toLocaleTimeString()}] Historique local effacé.`);
    }
  }, [clearMessages, addDebugLog, toast]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    addMessage({      type: 'agent_response',      content: fr.newSessionCreated,    });
    addDebugLog(`[${new Date().toLocaleTimeString()}] ${fr.newSession}: Ancien ID: ${oldSessionId}, Nouvel ID: ${newSessionId}`);
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory, addDebugLog, addMessage, setSessionId]);
  const [activeTab, ] = useState('status');
  const { handleDragStart, width } = useDraggableSidebar(320);

  useEffect(() => {
    // if (activeTab === 'memory' && authToken && sessionId) {
    //   getMemory(authToken, sessionId).then(setMemory);
    // }
  }, [activeTab, authToken, sessionId]);

  return (
    <aside
      className="p-4 bg-card border-r border-border overflow-y-auto flex-shrink-0 relative"
      style={{ width }}
    >
      <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize" onMouseDown={handleDragStart} />
      <Card className="bg-card border-border text-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{fr.controlPanel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion title={fr.agentStatus}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm flex items-center"><Key className="mr-2 h-4 w-4" />{fr.sessionId}</Label>
                <span className="text-sm text-muted-foreground">{sessionId ? `${sessionId.substring(0, 12)}...` : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm flex items-center"><Hammer className="mr-2 h-4 w-4" />{fr.toolsDetected}</Label>
                <span className="text-sm text-muted-foreground">{toolCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm flex items-center"><Server className="mr-2 h-4 w-4" />{fr.connectionStatus}</Label>
                <Badge variant={serverHealthy ? 'success' : 'destructive'}>
                  {serverHealthy ? fr.online : fr.offline}
                </Badge>
              </div>
            </div>
          </Accordion>

          <Accordion title={fr.agentCapabilities}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Tooltip text="Allow the agent to create new tools based on its needs.">
                  <Label className="text-sm flex items-center" htmlFor="toolCreationToggle"><Hammer className="mr-2 h-4 w-4" />{fr.toolCreation}</Label>
                </Tooltip>
                <Switch checked={toolCreationEnabled} id="toolCreationToggle" onCheckedChange={setToolCreationEnabled} />
              </div>
              <div className="flex justify-between items-center">
                <Tooltip text="Allow the agent to execute code directly in the environment.">
                  <Label className="text-sm flex items-center" htmlFor="codeExecutionToggle"><Code className="mr-2 h-4 w-4" />{fr.codeExecution}</Label>
                </Tooltip>
                <Switch checked={codeExecutionEnabled} id="codeExecutionToggle" onCheckedChange={setCodeExecutionEnabled} />
              </div>
            </div>
          </Accordion>

          <Accordion title={fr.quickActions}>
            <div className="space-y-2">
              <Button className="w-full" onClick={handleNewSession} variant="secondary">{fr.newSession}</Button>
              <Button className="w-full" onClick={() => handleClearHistory(true)} variant="destructive">{fr.clearHistory}</Button>
            </div>
          </Accordion>
        </CardContent>
      </Card>
    </aside>
  );
});
