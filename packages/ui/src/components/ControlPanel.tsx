import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';

interface ControlPanelProps {
  sessionId: string | null;
  toolCount: number | string;
  serverHealthy: boolean;
  toolCreationEnabled: boolean;
  codeExecutionEnabled: boolean;
  setToolCreationEnabled: (enabled: boolean) => void;
  setCodeExecutionEnabled: (enabled: boolean) => void;
  handleNewSession: () => void;
  handleClearHistory: (showMessage: boolean) => void;
}

export function ControlPanel({
  sessionId,
  toolCount,
  serverHealthy,
  toolCreationEnabled,
  codeExecutionEnabled,
  setToolCreationEnabled,
  setCodeExecutionEnabled,
  handleNewSession,
  handleClearHistory,
}: ControlPanelProps) {
  return (
    <aside className="w-80 p-4 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
      <Card className="bg-gray-700 border-gray-600 text-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Panneau de Contrôle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-300">Statut de l'Agent</h3>
            <div className="flex justify-between items-center">
              <Label className="text-sm">Session ID</Label>
              <span className="text-sm text-gray-400">{sessionId ? `${sessionId.substring(0, 12)}...` : '--'}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-sm">Outils Détectés</Label>
              <span className="text-sm text-gray-400">{toolCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-sm">Statut Connexion</Label>
              <span className="text-sm text-gray-400">{serverHealthy ? '✅ En ligne' : '❌ Hors ligne'}</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 italic">
            <strong>Mode Session Stricte:</strong> L'agent maintient un contexte de conversation persistant grâce à votre Session ID unique.
          </p>
          
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-300">Capacités de l'Agent</h3>
            <div className="flex justify-between items-center">
              <Label htmlFor="toolCreationToggle" className="text-sm">Création d'outils</Label>
              <Switch checked={toolCreationEnabled} id="toolCreationToggle" onCheckedChange={setToolCreationEnabled} />
            </div>
            <div className="flex justify-between items-center">
              <Label htmlFor="codeExecutionToggle" className="text-sm">Exécution de code</Label>
              <Switch checked={codeExecutionEnabled} id="codeExecutionToggle" onCheckedChange={setCodeExecutionEnabled} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-300">Actions Rapides</h3>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNewSession}>🔄 Nouvelle Session</Button>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleClearHistory(true)}>🗑️ Vider l'Historique</Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
