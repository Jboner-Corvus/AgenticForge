import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info, Terminal, Eye } from 'lucide-react';
import { Button } from './ui/button';

interface DebugInstructionsProps {
  onToggleDebugLog: () => void;
}

export const DebugInstructions = ({
  onToggleDebugLog,
}: DebugInstructionsProps) => {
  return (
    <Alert className="bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300 mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        🔍 Mode Debug Activé
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-2 mt-2">
          <p>
            Des logs détaillés sont maintenant disponibles pour diagnostiquer
            les problèmes de connexion :
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDebugLog}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir les logs internes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(
                  '🎯 [DebugInstructions] User requested to open dev tools',
                );
                window.alert(
                  'Ouvrez les outils de développement (F12) et regardez la console pour voir tous les logs détaillés !',
                );
              }}
              className="flex items-center gap-2"
            >
              <Terminal className="h-4 w-4" />
              Ouvrir console navigateur
            </Button>
          </div>
          <div className="text-xs mt-2 p-2 bg-blue-100 dark:bg-blue-800 rounded">
            <strong>Instructions :</strong> Si l'agent ne répond pas, ouvrez F12
            → Console et cherchez les logs avec 🚨 (erreurs) ou 🤖 (réponses
            agent)
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
