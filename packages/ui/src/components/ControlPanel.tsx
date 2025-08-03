import { Key, Server, Hammer, Code, Settings, Trash2, ListChecks, Play, History, Save, Edit, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Modal } from './ui/modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { generateUUID } from '../lib/utils/uuid';
import { useToast } from '../lib/hooks/useToast';
import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { memo, useCallback, useState } from 'react';
import { useStore } from '../lib/store';
import { LoadingSpinner } from './LoadingSpinner';


export const ControlPanel = memo(() => {
  const { translations } = useLanguage();
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
  const sessions = useStore((state) => state.sessions);
  const activeSessionId = useStore((state) => state.activeSessionId);
  const saveSession = useStore((state) => state.saveSession);
  const loadSession = useStore((state) => state.loadSession);
  const deleteSession = useStore((state) => state.deleteSession);
  const deleteAllSessions = useStore((state) => state.deleteAllSessions);
  const renameSession = useStore((state) => state.renameSession);

  // Loading states
  const isLoadingSessions = useStore((state) => state.isLoadingSessions);
  const isLoadingTools = useStore((state) => state.isLoadingTools);
  const isSavingSession = useStore((state) => state.isSavingSession);
  const isDeletingSession = useStore((state) => state.isDeletingSession);
  const isRenamingSession = useStore((state) => state.isRenamingSession);

  const browserStatus = useStore((state) => state.browserStatus);
  const { toast } = useToast();

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<{ id: string; name: string } | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSessionInput, setSaveSessionInput] = useState('');
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
  const [isDeleteAllConfirmModalOpen, setIsDeleteAllConfirmModalOpen] = useState(false);

  const handleClearHistory = useCallback((showMessage: boolean) => {
    clearMessages();
    if (showMessage) {
      toast({ description: translations.historyCleared, title: translations.historyCleared });
      addDebugLog(`[${new Date().toLocaleTimeString()}] Local history cleared.`);
    }
  }, [clearMessages, addDebugLog, toast, translations]);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateUUID();
    localStorage.setItem('agenticForgeSessionId', newSessionId);
    setSessionId(newSessionId);
    addMessage({ type: 'agent_response', content: translations.newSessionCreated });
    addDebugLog(`[${new Date().toLocaleTimeString()}] ${translations.newSession}: Old ID: ${oldSessionId}, New ID: ${newSessionId}`);
    handleClearHistory(false);
    fetchAndDisplayToolCount();
  }, [sessionId, fetchAndDisplayToolCount, handleClearHistory, addDebugLog, addMessage, setSessionId, translations]);

  const handleSaveCurrentSession = useCallback(() => {
    setIsSaveModalOpen(true);
    setSaveSessionInput(''); // Clear previous input
  }, []);

  const handleConfirmSaveSession = useCallback(() => {
    if (saveSessionInput.trim()) {
      saveSession(saveSessionInput.trim());
      toast({ description: "Session saved!", title: "Session Saved" });
      setIsSaveModalOpen(false);
      setSaveSessionInput('');
    }
  }, [saveSession, saveSessionInput, toast]);

  const handleLoadSession = useCallback((id: string) => {
    loadSession(id);
    toast({ description: "Session loaded!", title: "Session Loaded" });
  }, [loadSession, toast]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessionToDeleteId(id);
    setIsDeleteConfirmModalOpen(true);
  }, []);

  const handleDeleteAllSessions = useCallback(() => {
    setIsDeleteAllConfirmModalOpen(true);
  }, []);

  const handleConfirmDeleteSession = useCallback(() => {
    if (sessionToDeleteId) {
      deleteSession(sessionToDeleteId);
      toast({ description: "Session deleted!", title: "Session Deleted" });
      setIsDeleteConfirmModalOpen(false);
      setSessionToDeleteId(null);
    }
  }, [deleteSession, sessionToDeleteId, toast]);

  const handleConfirmDeleteAllSessions = useCallback(async () => {
    try {
      await deleteAllSessions();
      toast({ description: "All sessions deleted!", title: "Sessions Deleted" });
    } catch (error) {
      toast({ 
        description: "Failed to delete all sessions", 
        title: "Error", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleteAllConfirmModalOpen(false);
    }
  }, [deleteAllSessions, toast]);

  const handleOpenRenameModal = useCallback((session: { id: string; name: string }) => {
    setSessionToRename(session);
    setNewSessionName(session.name);
    setIsRenameModalOpen(true);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (sessionToRename && newSessionName.trim()) {
      renameSession(sessionToRename.id, newSessionName.trim());
      toast({ description: "Session renamed!", title: "Session Renamed" });
      setIsRenameModalOpen(false);
      setSessionToRename(null);
      setNewSessionName('');
    }
  }, [sessionToRename, newSessionName, renameSession, toast]);

  const { handleDragStart } = useDraggableSidebar(320);

  const MAX_DISPLAYED_SESSIONS = 10;
  const displayedSessions = sessions.slice(0, MAX_DISPLAYED_SESSIONS);
  const hasMoreSessions = sessions.length > MAX_DISPLAYED_SESSIONS;

  return (
    <>
      <aside
        className="p-4 bg-gradient-to-b from-background to-secondary/30 border-r border-border overflow-y-auto flex-shrink-0 relative pt-8 shadow-lg"
        style={{ width: '100%' }}
      >
        <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize" onMouseDown={handleDragStart} />
        <div className="space-y-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-md">
              <CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5" />{translations.agentStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                <Label className="text-sm flex items-center"><Key className="mr-2 h-4 w-4 text-blue-500" />{translations.sessionId}</Label>
                <span className="text-sm text-muted-foreground font-mono">{sessionId ? `${sessionId.substring(0, 12)}...` : '--'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                <Label className="text-sm flex items-center"><Server className="mr-2 h-4 w-4 text-green-500" />{translations.connectionStatus}</Label>
                <Badge variant={serverHealthy ? 'success' : 'destructive'}>
                  {serverHealthy ? translations.online : translations.offline}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                <Label className="text-sm flex items-center"><Hammer className="mr-2 h-4 w-4 text-purple-500" />Browser Status</Label>
                <span className="text-sm text-muted-foreground">{browserStatus}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-md">
              <CardTitle className="flex items-center text-lg"><Settings className="mr-2 h-5 w-5" />{translations.agentCapabilities}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                <Label className="text-sm flex items-center"><Hammer className="mr-2 h-4 w-4 text-orange-500" />{translations.toolsDetected}</Label>
                <span className="text-sm text-muted-foreground">
                  {isLoadingTools ? <LoadingSpinner className="ml-2" /> : toolCount}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                      <Label className="text-sm flex items-center" htmlFor="toolCreationToggle"><Hammer className="mr-2 h-4 w-4 text-yellow-500" />{translations.toolCreation}</Label>
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
                    <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                      <Label className="text-sm flex items-center" htmlFor="codeExecutionToggle"><Code className="mr-2 h-4 w-4 text-red-500" />{translations.codeExecution}</Label>
                      <Switch checked={codeExecutionEnabled} id="codeExecutionToggle" onCheckedChange={setCodeExecutionEnabled} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Allow the agent to execute code directly in the environment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-md">
              <CardTitle className="flex items-center text-lg"><History className="mr-2 h-5 w-5" />{translations.sessionManagement}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="transition-all duration-200 hover:scale-105">
                <Button className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white" onClick={handleNewSession} variant="secondary" disabled={isLoadingTools || isSavingSession || isLoadingSessions}>
                  {isLoadingTools ? <LoadingSpinner className="mr-2" /> : <Settings className="mr-2 h-4 w-4" />}
                  {translations.newSession}
                </Button>
              </div>
              <div className="transition-all duration-200 hover:scale-105">
                <Button className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white" onClick={() => handleClearHistory(true)} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {translations.clearHistory}
                </Button>
              </div>
              <div className="transition-all duration-200 hover:scale-105">
                <Button className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveCurrentSession} variant="secondary" disabled={isSavingSession}>
                  {isSavingSession ? <LoadingSpinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {translations.saveCurrentSession}
                </Button>
              </div>
              {sessions.length > 1 && (
                <div className="transition-all duration-200 hover:scale-105">
                  <Button 
                    className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white" 
                    onClick={handleDeleteAllSessions} 
                    variant="destructive"
                    disabled={isLoadingSessions || isDeletingSession || isRenamingSession}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Sessions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-md">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg"><History className="mr-2 h-5 w-5" />{translations.savedSessions}</CardTitle>
                {hasMoreSessions && (
                  <span className="text-xs text-blue-100">
                    {displayedSessions.length}/{sessions.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {isLoadingSessions ? (
                <div className="flex justify-center items-center h-20">
                  <LoadingSpinner />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-muted-foreground">{translations.noSessionsSaved}</p>
              ) : (
                displayedSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 border border-border rounded-md hover:bg-accent transition-all duration-200 hover:scale-105 transform">
                    <span className="text-sm truncate" title={session.name}>
                      {session.name.length > 20 ? `${session.name.substring(0, 20)}...` : session.name}
                      {session.id === activeSessionId && <Badge variant="secondary" className="ml-2">{translations.active}</Badge>}
                    </span>
                    <div className="flex space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="transition-all duration-200 transform hover:scale-110">
                              <Button size="icon" variant="ghost" onClick={() => handleLoadSession(session.id)} aria-label="Load session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                <Play className="h-4 w-4 text-green-500" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Load Session</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="transition-all duration-200 transform hover:scale-110">
                              <Button size="icon" variant="ghost" onClick={() => handleOpenRenameModal(session)} aria-label="Rename session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Rename Session</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="transition-all duration-200 transform hover:scale-110">
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteSession(session.id)} aria-label="Delete session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Delete Session</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </aside>

      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Session">
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="New session name"
            aria-label="New session name"
            name="newSessionName"
            autoComplete="off"
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmRename}>Rename</Button>
          </div>
      </Modal>

      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title="Save Current Session">
        <Input
          value={saveSessionInput}
          onChange={(e) => setSaveSessionInput(e.target.value)}
          placeholder="Session name"
          aria-label="Session name"
          name="saveSessionInput"
          autoComplete="off"
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSaveSession}>Save</Button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => setIsDeleteConfirmModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete this session? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsDeleteConfirmModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirmDeleteSession}>Delete</Button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteAllConfirmModalOpen} onClose={() => setIsDeleteAllConfirmModalOpen(false)} title="Confirm Deletion">
        <p>Are you sure you want to delete ALL sessions? This action cannot be undone and will remove {sessions.length} sessions.</p>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsDeleteAllConfirmModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirmDeleteAllSessions}>Delete All</Button>
        </div>
      </Modal>
    </>
  );
});
