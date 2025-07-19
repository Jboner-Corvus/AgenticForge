import { memo, useCallback } from 'react';

import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { fr } from '../constants/fr';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Key, Server, Hammer, Code, Settings, Trash2 } from 'lucide-react';
import { useToast } from '../lib/hooks/useToast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { generateUUID } from '../lib/utils/uuid';
import { useStore } from '../lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const ControlPanel = memo(() => {
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
      addDebugLog(`[${new Date().toLocaleTimeString()}] Local history cleared.`);
    }
  }, [clearMessages, addDebugLog, toast]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    addMessage({ type: 'agent_response', content: fr.newSessionCreated });
    addDebugLog(`[${new Date().toLocaleTimeString()}] ${fr.newSession}: Old ID: ${oldSessionId}, New ID: ${newSessionId}`);
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory, addDebugLog, addMessage, setSessionId]);

  const { handleDragStart, width } = useDraggableSidebar(320);

  return (
    <aside
      className="p-4 bg-gradient-to-b from-background to-secondary/50 border-r border-border overflow-y-auto flex-shrink-0 relative pt-8"
      style={{ width }}
    >
      <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize" onMouseDown={handleDragStart} />
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="mt-4">
          <div className="space-y-4">
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
        </TabsContent>
        <TabsContent value="capabilities" className="mt-4">
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center" htmlFor="toolCreationToggle"><Hammer className="mr-2 h-4 w-4" />{fr.toolCreation}</Label>
                    <Switch checked={toolCreationEnabled} id="toolCreationToggle" onCheckedChange={setToolCreationEnabled} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Allow the agent to create new tools based on its needs.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-between items-center">
                    <Label className="text-sm flex items-center" htmlFor="codeExecutionToggle"><Code className="mr-2 h-4 w-4" />{fr.codeExecution}</Label>
                    <Switch checked={codeExecutionEnabled} id="codeExecutionToggle" onCheckedChange={setCodeExecutionEnabled} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Allow the agent to execute code directly in the environment.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <div className="space-y-2">
            <Button className="w-full flex items-center justify-center" onClick={handleNewSession} variant="secondary">
              <Settings className="mr-2 h-4 w-4" />
              {fr.newSession}
            </Button>
            <Button className="w-full flex items-center justify-center" onClick={() => handleClearHistory(true)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {fr.clearHistory}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
});
