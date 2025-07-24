import { Key, Server, Hammer, Code, Settings, Trash2, ListChecks, Cog, Play, History, Save, Edit, XCircle, BarChart, Chrome, Send, Check, X } from 'lucide-react';
import { GoogleLogo, GithubLogo, DiscordLogo, TelegramLogo, OpenAILogo, GrokLogo, Kimika2Logo, DeepseekLogo, HuggingFaceLogo, MixtralLogo, OllamaLogo, LMStudioLogo, LlmLogo } from './icons/LlmLogos';
import { Input } from './ui/input';
import { Modal } from './ui/modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { fr } from '../constants/fr';
import { generateUUID } from '../lib/utils/uuid';
import { useToast } from '../lib/hooks/useToast';
import { useDraggableSidebar } from '../lib/hooks/useDraggablePane';
import { memo, useCallback, useState } from 'react';
import { useStore } from '../lib/store';

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
  const sessions = useStore((state) => state.sessions);
  const activeSessionId = useStore((state) => state.activeSessionId);
  const saveSession = useStore((state) => state.saveSession);
  const loadSession = useStore((state) => state.loadSession);
  const deleteSession = useStore((state) => state.deleteSession);
  const renameSession = useStore((state) => state.renameSession);
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const activeLlmApiKeyIndex = useStore((state) => state.activeLlmApiKeyIndex);
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const removeLlmApiKey = useStore((state) => state.removeLlmApiKey);
  const setActiveLlmApiKey = useStore((state) => state.setActiveLlmApiKey);
  const leaderboardStats = useStore((state) => state.leaderboardStats);

  const browserStatus = useStore((state) => state.browserStatus);
  const { toast } = useToast();

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<{ id: string; name: string } | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSessionInput, setSaveSessionInput] = useState('');
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
  const [openAiApiKey, setOpenAiApiKey] = useState('');
  const [grokApiKey, setGrokApiKey] = useState('');
  const [kimika2ApiKey, setKimika2ApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [huggingFaceApiKey, setHuggingFaceApiKey] = useState('');
  const [mixtralApiKey, setMixtralApiKey] = useState('');
  const [ollamaApiKey, setOllamaApiKey] = useState('');
  const [lmStudioApiKey, setLmStudioApiKey] = useState('');

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

  const handleConfirmDeleteSession = useCallback(() => {
    if (sessionToDeleteId) {
      deleteSession(sessionToDeleteId);
      toast({ description: "Session deleted!", title: "Session Deleted" });
      setIsDeleteConfirmModalOpen(false);
      setSessionToDeleteId(null);
    }
  }, [deleteSession, sessionToDeleteId, toast]);

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

  const { handleDragStart, width } = useDraggableSidebar(320);

  return (
    <>
      <aside
        className="p-4 bg-gradient-to-b from-background to-secondary/50 border-r border-border overflow-y-auto flex-shrink-0 relative pt-8"
        style={{ width }}
      >
        <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize" onMouseDown={handleDragStart} />
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="status" className="flex items-center"><ListChecks className="mr-2 h-4 w-4" />Status</TabsTrigger>
            <TabsTrigger value="capabilities" className="flex items-center"><Cog className="mr-2 h-4 w-4" />Capabilities</TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center"><Play className="mr-2 h-4 w-4" />Actions</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center"><History className="mr-2 h-4 w-4" />History</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center"><BarChart className="mr-2 h-4 w-4" />Leaderboard</TabsTrigger>
            <TabsTrigger value="login" className="flex items-center"><Chrome className="mr-2 h-4 w-4" />Login</TabsTrigger>
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
              <div className="flex justify-between items-center">
                <Label className="text-sm flex items-center"><Hammer className="mr-2 h-4 w-4" />Browser Status</Label>
                <span className="text-sm text-muted-foreground">{browserStatus}</span>
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
              <Button className="w-full flex items-center justify-center" onClick={handleSaveCurrentSession} variant="secondary">
                <Save className="mr-2 h-4 w-4" />
                Save Current Session
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground">No sessions saved yet.</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-2 border border-border rounded-md">
                    <span className="text-sm truncate" title={session.name}>
                      {session.name}
                      {session.id === activeSessionId && <Badge variant="secondary" className="ml-2">Active</Badge>}
                    </span>
                    <div className="flex space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => handleLoadSession(session.id)} aria-label="Load session">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleOpenRenameModal(session)} aria-label="Rename session">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteSession(session.id)} aria-label="Delete session">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm">Tokens Saved:</Label>
                <span className="text-sm text-muted-foreground">{leaderboardStats.tokensSaved}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm">Successful Runs:</Label>
                <span className="text-sm text-muted-foreground">{leaderboardStats.successfulRuns}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm">Sessions Created:</Label>
                <span className="text-sm text-muted-foreground">{leaderboardStats.sessionsCreated}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm">API Keys Added:</Label>
                <span className="text-sm text-muted-foreground">{leaderboardStats.apiKeysAdded}</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="login" className="mt-4">
            <div className="space-y-4">
              <h4 className="text-md font-semibold">Email/Password Login</h4>
              <Input placeholder="Email" type="email" aria-label="Email" />
              <Input placeholder="Password" type="password" aria-label="Password" />
              <Button className="w-full flex items-center justify-center" onClick={() => console.log('Email/Password Login')}><Send className="mr-2 h-4 w-4" />Login</Button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <h4 className="text-md font-semibold">OAuth Login</h4>
              <Button className="w-full flex items-center justify-center" onClick={() => console.log('Login with Google')} variant="outline">
                <GoogleLogo className="mr-2 h-4 w-4" />Login with Google
              </Button>
              <Button className="w-full flex items-center justify-center" onClick={() => window.location.href = '/api/auth/github'} variant="outline">
                <GithubLogo className="mr-2 h-4 w-4" />Login with GitHub
              </Button>
              <Button className="w-full flex items-center justify-center" onClick={() => console.log('Login with Discord')} variant="outline">
                <DiscordLogo className="mr-2 h-4 w-4" />Login with Discord
              </Button>
              <Button className="w-full flex items-center justify-center" onClick={() => console.log('Login with Telegram')} variant="outline">
                <TelegramLogo className="mr-2 h-4 w-4" />Login with Telegram
              </Button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <h4 className="text-md font-semibold">LLM API Key Management</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <OpenAILogo className="h-6 w-6" />
                  <Input
                    id="openai-api-key"
                    placeholder="sk-..."
                    type="password"
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    aria-label="OpenAI API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('openai', openAiApiKey); setOpenAiApiKey(''); }} aria-label="Add OpenAI API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <GrokLogo className="h-6 w-6" />
                  <Input
                    id="grok-api-key"
                    placeholder="grok-..."
                    type="password"
                    value={grokApiKey}
                    onChange={(e) => setGrokApiKey(e.target.value)}
                    aria-label="Grok API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('grok', grokApiKey); setGrokApiKey(''); }} aria-label="Add Grok API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Kimika2Logo className="h-6 w-6" />
                  <Input
                    id="kimika2-api-key"
                    placeholder="kimika2-..."
                    type="password"
                    value={kimika2ApiKey}
                    onChange={(e) => setKimika2ApiKey(e.target.value)}
                    aria-label="Kimika2 API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('kimika2', kimika2ApiKey); setKimika2ApiKey(''); }} aria-label="Add Kimika2 API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <DeepseekLogo className="h-6 w-6" />
                  <Input
                    id="deepseek-api-key"
                    placeholder="deepseek-..."
                    type="password"
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    aria-label="Deepseek API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('deepseek', deepseekApiKey); setDeepseekApiKey(''); }} aria-label="Add Deepseek API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <HuggingFaceLogo className="h-6 w-6" />
                  <Input
                    id="huggingface-api-key"
                    placeholder="hf_..."
                    type="password"
                    value={huggingFaceApiKey}
                    onChange={(e) => setHuggingFaceApiKey(e.target.value)}
                    aria-label="HuggingFace API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('huggingface', huggingFaceApiKey); setHuggingFaceApiKey(''); }} aria-label="Add HuggingFace API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <MixtralLogo className="h-6 w-6" />
                  <Input
                    id="mixtral-api-key"
                    placeholder="mix_..."
                    type="password"
                    value={mixtralApiKey}
                    onChange={(e) => setMixtralApiKey(e.target.value)}
                    aria-label="Mixtral API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('mixtral', mixtralApiKey); setMixtralApiKey(''); }} aria-label="Add Mixtral API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <OllamaLogo className="h-6 w-6" />
                  <Input
                    id="ollama-api-key"
                    placeholder="ollama-..."
                    type="password"
                    value={ollamaApiKey}
                    onChange={(e) => setOllamaApiKey(e.target.value)}
                    aria-label="Ollama API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('ollama', ollamaApiKey); setOllamaApiKey(''); }} aria-label="Add Ollama API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <LMStudioLogo className="h-6 w-6" />
                  <Input
                    id="lmstudio-api-key"
                    placeholder="lmstudio-..."
                    type="password"
                    value={lmStudioApiKey}
                    onChange={(e) => setLmStudioApiKey(e.target.value)}
                    aria-label="LM Studio API Key Input"
                  />
                  <Button onClick={() => { addLlmApiKey('lmstudio', lmStudioApiKey); setLmStudioApiKey(''); }} aria-label="Add LM Studio API Key">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

              </div>
              <div className="space-y-2">
                {llmApiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No LLM API keys added yet.</p>
                ) : (
                  llmApiKeys.map((llmKey, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-border rounded-md">
                      <span className="text-sm truncate flex items-center">
                        <LlmLogo provider={llmKey.provider} className="mr-2 h-5 w-5" />
                        {`${llmKey.provider}: ${llmKey.key.substring(0, 5)}...${llmKey.key.substring(llmKey.key.length - 5)}`}
                        {activeLlmApiKeyIndex === index && <Badge variant="secondary" className="ml-2">Active</Badge>}
                      </span>
                      <div className="flex space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => setActiveLlmApiKey(index)} aria-label="Set as active">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeLlmApiKey(index)} aria-label="Remove API Key">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
            </div>
          </TabsContent>
        </Tabs>
      </aside>

      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Rename Session">
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="New session name"
            aria-label="New session name"
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
    </>
  );
});
