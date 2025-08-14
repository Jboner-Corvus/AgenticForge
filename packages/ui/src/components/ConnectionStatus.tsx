import { useCombinedStore } from '../store';
// import { useLanguage } from '../lib/contexts/LanguageContext'; // Supprimé: never used
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react';

export const ConnectionStatus = () => {
  // const { translations } = useLanguage(); // Supprimé: never used
  const isProcessing = useCombinedStore((state) => state.isProcessing);
  const serverHealthy = useCombinedStore((state) => state.serverHealthy);
  const authToken = useCombinedStore((state) => state.authToken);
  const sessionId = useCombinedStore((state) => state.sessionId);
  const jobId = useCombinedStore((state) => state.jobId);

  // Determine connection status
  // let connectionStatus: 'connected' | 'processing' | 'disconnected' | 'error'; // Supprimé: never used
  let icon;
  let variant: "default" | "secondary" | "destructive" | "outline";
  let statusText: string;

  if (!authToken || !sessionId) {
    // connectionStatus = 'error'; // Supprimé: never used
    icon = <AlertTriangle className="h-3 w-3" />;
    variant = 'destructive';
    statusText = 'Configuration manquante';
  } else if (!serverHealthy) {
    // connectionStatus = 'disconnected'; // Supprimé: never used
    icon = <WifiOff className="h-3 w-3" />;
    variant = 'destructive';
    statusText = 'Serveur déconnecté';
  } else if (isProcessing && jobId) {
    // connectionStatus = 'processing'; // Supprimé: never used
    icon = <Activity className="h-3 w-3 animate-pulse" />;
    variant = 'default';
    statusText = `En cours... (${jobId.substring(0, 8)})`;
  } else {
    // connectionStatus = 'connected'; // Supprimé: never used
    icon = <Wifi className="h-3 w-3" />;
    variant = 'secondary';
    statusText = 'Prêt';
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} className="flex items-center gap-1 text-xs">
        {icon}
        {statusText}
      </Badge>
      {process.env.NODE_ENV === 'development' && (
        <Badge variant="outline" className="text-xs">
          Debug: {authToken ? '🔐' : '❌'} {sessionId ? '🆔' : '❌'} {serverHealthy ? '🌐' : '❌'}
        </Badge>
      )}
    </div>
  );
};