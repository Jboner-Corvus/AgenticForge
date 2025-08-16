/* eslint-disable @typescript-eslint/no-explicit-any */
import { Key, Server, Hammer, ListChecks, Play, History, Save, Edit, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Modal } from './ui/modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
// import { Switch } from './ui/switch'; // Supprimé: never used
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { memo, useCallback, useState } from 'react';
import { 
  useServerHealthy, 
  useSessionId, 
  useToolCount, 
  useSessions, 
  useActiveSessionId, 
  useIsLoadingSessions, 
  useIsSavingSession, 
  useIsDeletingSession, 
  useIsRenamingSession,
  useBrowserStatus,
  useTokenStatus,
  useIsLoadingTools
} from '../store/hooks';
import { useSessionStore } from '../store/sessionStore';
import { useUIStore } from '../store/uiStore';
import { LoadingSpinner } from './LoadingSpinner';


export const ControlPanel = memo(() => {
  const { translations } = useLanguage();
  // const codeExecutionEnabled = useStore((state) => state.codeExecutionEnabled); // Supprimé: never used
  const serverHealthy = useServerHealthy();
  const sessionId = useSessionId();
  const toolCount = useToolCount();
  // const toolCreationEnabled = useStore((state) => state.toolCreationEnabled); // Supprimé: never used
  // const setCodeExecutionEnabled = useStore((state) => state.setCodeExecutionEnabled); // Supprimé: never used
  // const setToolCreationEnabled = useStore((state) => state.setToolCreationEnabled); // Supprimé: never used
  const sessions = useSessions();
  const activeSessionId = useActiveSessionId();
  const { saveSession, loadSession, deleteSession, renameSession } = useSessionStore();
  const tokenStatus = useTokenStatus();

  // Loading states
  const isLoadingSessions = useIsLoadingSessions();
  const isLoadingTools = useIsLoadingTools();
  const isSavingSession = useIsSavingSession();
  const isDeletingSession = useIsDeletingSession();
  const isRenamingSession = useIsRenamingSession();

  const browserStatus = useBrowserStatus();

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<{ id: string; name: string } | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSessionInput, setSaveSessionInput] = useState('');
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const handleSaveCurrentSession = useCallback(() => {
    setIsSaveModalOpen(true);
    setSaveSessionInput(''); // Clear previous input
  }, []);

  const handleConfirmSaveSession = useCallback(() => {
    if (saveSessionInput.trim()) {
      saveSession(saveSessionInput.trim());
      setIsSaveModalOpen(false);
      setSaveSessionInput('');
    }
  }, [saveSession, saveSessionInput]);

  const handleLoadSession = useCallback((id: string) => {
    loadSession(id);
  }, [loadSession]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessionToDeleteId(id);
    setIsDeleteConfirmModalOpen(true);
  }, []);

  const handleConfirmDeleteSession = useCallback(() => {
    if (sessionToDeleteId) {
      deleteSession(sessionToDeleteId);
      setIsDeleteConfirmModalOpen(false);
      setSessionToDeleteId(null);
    }
  }, [deleteSession, sessionToDeleteId]);

  const handleOpenRenameModal = useCallback((session: { id: string; name: string }) => {
    setSessionToRename(session);
    setNewSessionName(session.name);
    setIsRenameModalOpen(true);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (sessionToRename && newSessionName.trim()) {
      renameSession(sessionToRename.id, newSessionName.trim());
      setIsRenameModalOpen(false);
      setSessionToRename(null);
      setNewSessionName('');
    }
  }, [sessionToRename, newSessionName, renameSession]);

  const { handleDragStart } = useDraggableSidebar(320);

  const MAX_INITIAL_SESSIONS = 2;
  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, MAX_INITIAL_SESSIONS);
  const hasMoreSessions = sessions.length > MAX_INITIAL_SESSIONS;

  const renderToolCount = () => {
    if (typeof toolCount === 'number') {
      return toolCount;
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <XCircle className="h-5 w-5 text-red-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{toolCount}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      <aside
        className="p-4 bg-gradient-to-b from-background to-secondary/30 border-r border-border overflow-y-auto flex-shrink-0 relative pt-8 shadow-lg"
        style={{ width: '100%' }}
      >
        <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize" onMouseDown={handleDragStart} />
        <div className="space-y-6">
          {!tokenStatus && (
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-2 border-yellow-500">
              <CardHeader className="bg-yellow-500 text-white rounded-t-md">
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Authentication Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-sm text-yellow-800">
                  Please set up your authentication token to use the agent. 
                  Visit the OAuth Management page to configure your authentication.
                </p>
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => useUIStore.getState().setCurrentPage('oauth')}
                >
                  Go to OAuth Management
                </Button>
              </CardContent>
            </Card>
          )}
          
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
              <div className="flex justify-between items-center p-2 rounded hover:bg-accent transition-all duration-200 hover:scale-105">
                <Label className="text-sm flex items-center"><Hammer className="mr-2 h-4 w-4 text-orange-500" />{translations.toolsDetected}</Label>
                <span className="text-sm text-muted-foreground">
                  {isLoadingTools ? (
                    <LoadingSpinner className="ml-2" />
                  ) : (
                    renderToolCount()
                  )}
                </span>
              </div>
              </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-md">
              <CardTitle className="flex items-center text-lg"><History className="mr-2 h-5 w-5" />{translations.historyAndActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveCurrentSession} variant="secondary" disabled={isSavingSession}>
                {isSavingSession ? <LoadingSpinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                {translations.saveCurrentSession}
              </Button>
              
              <div className="pt-2">
                {isLoadingSessions ? (
                  <div className="flex justify-center items-center h-20">
                    <LoadingSpinner />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{translations.noSessionsSaved}</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {displayedSessions.map((session: unknown) => (
                        <div key={(session as any).id} className="flex items-center justify-between p-2 border border-border rounded-md hover:bg-accent transition-all duration-200 hover:scale-105 transform">
                          <span className="text-sm truncate" title={(session as any).name}>
                            {(session as any).name.length > 20 ? `${(session as any).name.substring(0, 20)}...` : (session as any).name}
                            {(session as any).id === activeSessionId && <Badge variant="secondary" className="ml-2">{translations.active}</Badge>}
                          </span>
                          <div className="flex space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="transition-all duration-200 transform hover:scale-110">
                                    <Button size="icon" variant="ghost" onClick={() => handleLoadSession((session as any).id)} aria-label="Load session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                      <Play className="h-4 w-4 text-green-500" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{translations.loadSession}</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="transition-all duration-200 transform hover:scale-110">
                                    <Button size="icon" variant="ghost" onClick={() => handleOpenRenameModal(session as any)} aria-label="Rename session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                      <Edit className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{translations.renameSession}</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="transition-all duration-200 transform hover:scale-110">
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteSession((session as any).id)} aria-label="Delete session" disabled={isLoadingSessions || isDeletingSession || isRenamingSession}>
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{translations.deleteSession}</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreSessions && (
                      <Button 
                        variant="link" 
                        className="w-full mt-2" 
                        onClick={() => setShowAllSessions(!showAllSessions)}
                      >
                        {showAllSessions 
                          ? translations.showLess 
                          : `${translations.showMore} (${sessions.length - MAX_INITIAL_SESSIONS} ${translations.more})`
                        }
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>

      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title={translations.renameSession}>
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder={translations.newSessionName}
            aria-label={translations.newSessionName}
            name="newSessionName"
            id="newSessionName"
            autoComplete="off"
          />
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsRenameModalOpen(false)}>{translations.cancel}</Button>
            <Button onClick={handleConfirmRename}>{translations.rename}</Button>
          </div>
      </Modal>

      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title={translations.saveCurrentSession}>
        <Label htmlFor="saveSessionInput" className="sr-only">{translations.sessionNamePlaceholder}</Label>
        <Input
          value={saveSessionInput}
          onChange={(e) => setSaveSessionInput(e.target.value)}
          placeholder={translations.sessionNamePlaceholder}
          aria-label={translations.sessionNamePlaceholder}
          name="saveSessionInput"
          id="saveSessionInput"
          autoComplete="off"
        />
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsSaveModalOpen(false)}>{translations.cancel}</Button>
          <Button onClick={handleConfirmSaveSession}>{translations.save}</Button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => setIsDeleteConfirmModalOpen(false)} title={translations.confirmDeletion}>
        <p>{translations.confirmDeleteSession}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setIsDeleteConfirmModalOpen(false)}>{translations.cancel}</Button>
          <Button variant="destructive" onClick={handleConfirmDeleteSession}>{translations.delete}</Button>
        </div>
      </Modal>
      
    </>
  );
});