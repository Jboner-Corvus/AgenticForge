import React, { useState, useCallback } from 'react';
import { AlertTriangle, Key, Shield, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { useCombinedStore } from '../store';
import { useAuthInterceptor, AuthError } from '../lib/hooks/useAuthInterceptor';

interface AuthErrorHandlerProps {
  /** Callback appelé quand une erreur 401 est détectée */
  onAuthError?: () => void;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ onAuthError }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<AuthError | null>(null);
  
  const { 
    setAuthToken, 
    addDebugLog, 
    initializeSessionAndMessages 
  } = useCombinedStore();

  // Utiliser le hook d'interception des erreurs
  const { validateToken, getCurrentTokenStatus } = useAuthInterceptor({
    onAuthError: useCallback((error: AuthError) => {
      setLastError(error);
      addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH_HANDLER] Erreur 401 détectée sur ${error.url}`);
      
      // Ouvrir la modal seulement si pas déjà ouverte
      if (!isModalOpen) {
        setIsModalOpen(true);
        onAuthError?.();
      }
    }, [isModalOpen, onAuthError, addDebugLog]),
    maxErrors: 1,
    ignoredUrls: ['/health', '/public', '/api/health']
  });

  const handleSaveToken = async () => {
    if (!newToken.trim()) {
      setValidationStatus('error');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    
    try {
      // Valider le token avant de le sauvegarder
      const isValid = await validateToken(newToken.trim());
      
      if (isValid) {
        // Sauvegarder le token
        localStorage.setItem('backendAuthToken', newToken.trim());
        setAuthToken(newToken.trim());
        setValidationStatus('success');
        
        addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH] Token validé et sauvegardé avec succès`);
        
        // Réinitialiser les sessions après authentification
        try {
          await initializeSessionAndMessages();
          addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH] Sessions rechargées avec succès`);
        } catch (error) {
          console.error('Erreur lors du rechargement des sessions:', error);
        }
        
        // Fermer la modal après un délai
        setTimeout(() => {
          setIsModalOpen(false);
          setNewToken('');
          setValidationStatus('idle');
          setLastError(null);
        }, 1500);
        
      } else {
        setValidationStatus('error');
        addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH] Token invalide rejeté`);
      }
    } catch (error) {
      setValidationStatus('error');
      addDebugLog(`[${new Date().toLocaleTimeString()}] [AUTH] Erreur validation: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  const tokenStatus = getCurrentTokenStatus();

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🔐 Authentification Requise">
      <div className="space-y-4">
        {/* Icône d'alerte centrée */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        
        {/* Description */}
        <p className="text-gray-300 text-center mb-6">
          Votre token d'authentification est {tokenStatus === 'missing' ? 'manquant' : 'invalide'}. 
          Veuillez entrer un token valide pour continuer.
        </p>

        {/* Statut du token actuel */}
        <Alert variant="destructive" className="bg-gray-800 border-gray-600">
          <Shield className="h-4 w-4" />
          <AlertTitle className="text-white">Statut du Token</AlertTitle>
          <AlertDescription className="text-gray-300">
            <div className="flex items-center justify-between">
              <span>
                {tokenStatus === 'missing' && 'Aucun token configuré'}
                {tokenStatus === 'unknown' && 'Token présent mais erreur d\'authentification'}
              </span>
              <Badge variant="destructive">
                {tokenStatus === 'missing' && '❌ Manquant'}
                {tokenStatus === 'unknown' && '🔴 Erreur'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Détails de la dernière erreur */}
        {lastError && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-700/50">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-red-300">Dernière Erreur Détectée</AlertTitle>
            <AlertDescription className="text-red-400 text-sm">
              <div className="space-y-1">
                <div><strong>URL:</strong> {lastError.url}</div>
                <div><strong>Méthode:</strong> {lastError.method}</div>
                <div><strong>Heure:</strong> {new Date(lastError.timestamp).toLocaleTimeString()}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Champ de saisie du nouveau token */}
        <div className="space-y-2">
          <Label htmlFor="auth-token" className="text-white flex items-center gap-2">
            <Key className="h-4 w-4" />
            Nouveau Token d'Authentification
          </Label>
          <Input
            id="auth-token"
            type="password"
            placeholder="Bearer votre-token-ici..."
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            disabled={isValidating}
          />
        </div>

        {/* Message de validation */}
        {validationStatus !== 'idle' && (
          <Alert variant={validationStatus === 'success' ? 'default' : 'destructive'} className="bg-gray-800 border-gray-600">
            {validationStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className="text-gray-300">
              {validationStatus === 'success' 
                ? '✅ Token validé avec succès ! Redirection en cours...'
                : '❌ Token invalide. Veuillez vérifier et réessayer.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions pour l'utilisateur */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <h4 className="font-medium text-blue-300 mb-2">💡 Comment obtenir votre token :</h4>
          <ul className="text-sm text-blue-400 space-y-1">
            <li>• Vérifiez votre fichier <code className="bg-gray-800 px-1 rounded">.env</code> pour AUTH_TOKEN</li>
            <li>• Consultez les logs du serveur pour le token correct</li>
            <li>• Contactez votre administrateur si nécessaire</li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            onClick={() => setIsModalOpen(false)}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={isValidating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveToken}
            disabled={!newToken.trim() || isValidating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isValidating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Valider & Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthErrorHandler;