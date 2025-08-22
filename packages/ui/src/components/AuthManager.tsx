import React, { useState } from 'react';
import { AuthErrorHandler } from './AuthErrorHandler';
import { AuthStatusIndicator } from './AuthStatusIndicator';

interface AuthManagerProps {
  /** Afficher l'indicateur discret de statut */
  showStatusIndicator?: boolean;
  /** Position de l'indicateur de statut */
  indicatorPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Callback global appelé lors d'erreurs d'authentification */
  onAuthError?: () => void;
}

/**
 * Composant principal qui gère toute l'authentification de l'application.
 * Il coordonne l'affichage des erreurs et guide l'utilisateur de manière intuitive.
 */
export const AuthManager: React.FC<AuthManagerProps> = ({
  showStatusIndicator = true,
  indicatorPosition = 'bottom-right',
  onAuthError
}) => {
  const [forceShowModal, setForceShowModal] = useState(false);

  const handleStatusIndicatorFix = () => {
    // Quand l'utilisateur clique sur "Corriger" dans l'indicateur,
    // on force l'ouverture de la modal de correction
    setForceShowModal(true);
  };

  const handleAuthError = () => {
    onAuthError?.();
  };

  return (
    <>
      {/* Gestionnaire principal des erreurs d'authentification */}
      <AuthErrorHandler 
        onAuthError={handleAuthError}
      />

      {/* Indicateur discret en bas à droite */}
      {showStatusIndicator && (
        <AuthStatusIndicator
          position={indicatorPosition}
          autoHideDuration={0} // Reste visible jusqu'à action utilisateur
          onFixAuthRequest={handleStatusIndicatorFix}
        />
      )}

      {/* Modal forcée par l'indicateur de statut */}
      {forceShowModal && (
        <AuthErrorHandler 
          onAuthError={() => setForceShowModal(false)}
        />
      )}
    </>
  );
};

export default AuthManager;