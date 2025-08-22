import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Key, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useCombinedStore } from '../store';
import { useAuthInterceptor, AuthError } from '../lib/hooks/useAuthInterceptor';

interface AuthStatusIndicatorProps {
  /** Position de l'indicateur (par défaut: 'bottom-right') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Durée d'affichage automatique en ms (0 = permanent jusqu'à clic) */
  autoHideDuration?: number;
  /** Callback appelé quand l'utilisateur clique pour corriger l'auth */
  onFixAuthRequest?: () => void;
}

export const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({
  position = 'bottom-right',
  autoHideDuration = 0,
  onFixAuthRequest
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { authToken } = useCombinedStore();

  // Surveiller les erreurs d'authentification
  const { getCurrentTokenStatus } = useAuthInterceptor({
    onAuthError: (error: AuthError) => {
      setLastError(error);
      setIsVisible(true);
      setDismissed(false);

      // Auto-hide après délai si configuré
      if (autoHideDuration > 0) {
        setTimeout(() => {
          setIsVisible(false);
        }, autoHideDuration);
      }
    },
    maxErrors: 1
  });

  const tokenStatus = getCurrentTokenStatus();

  // Ne pas afficher si pas d'erreur ou si dismissed
  if (!isVisible || dismissed || tokenStatus === 'unknown') {
    return null;
  }

  const handleFixAuth = () => {
    setIsVisible(false);
    setDismissed(true);
    onFixAuthRequest?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getStatusInfo = () => {
    if (tokenStatus === 'missing') {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        title: 'Token Manquant',
        message: 'Aucun token d\'authentification configuré',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-700/50'
      };
    }

    return {
      icon: <Shield className="h-4 w-4 text-red-500" />,
      title: 'Erreur d\'Authentification',
      message: lastError ? `Échec sur ${lastError.url}` : 'Token invalide ou expiré',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700/50'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed ${getPositionClasses()} z-50 max-w-sm`}
      >
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg shadow-lg backdrop-blur-sm p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {statusInfo.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-white">
                  {statusInfo.title}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-300 mb-3">
                {statusInfo.message}
              </p>

              {lastError && (
                <div className="text-xs text-gray-400 mb-3 space-y-1">
                  <div>Méthode: {lastError.method}</div>
                  <div>Heure: {new Date(lastError.timestamp).toLocaleTimeString()}</div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleFixAuth}
                  className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Key className="h-3 w-3 mr-1" />
                  Corriger
                </Button>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {authToken ? 'Token présent' : 'Aucun token'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthStatusIndicator;