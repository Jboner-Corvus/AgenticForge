/**
 * Exemple d'utilisation du hook hybride pour la communication temps réel
 *
 * Ce fichier montre comment utiliser useHybridRealTime pour garantir
 * que le frontend affiche toujours les événements en temps réel.
 */

import { useEffect, useState } from 'react';
import { useHybridRealTime, useAgentRealTime } from './useHybridRealTime';

export const useRealTimeExample = () => {
  const [connectionStatus, setConnectionStatus] =
    useState<string>('Déconnecté');
  const [lastMessage, setLastMessage] = useState<string>('');

  // Exemple 1: Utilisation basique du hook hybride
  const hybridRealTime = useHybridRealTime({
    onMessage: (event) => {
      console.log('📨 Message reçu:', event.data);
      setLastMessage(event.data);
    },
    onError: (error) => {
      console.error('🚨 Erreur:', error);
      setConnectionStatus('Erreur de connexion');
    },
    onConnectionChange: (connected, method) => {
      const status = connected
        ? `Connecté via ${method.toUpperCase()}`
        : 'Déconnecté';
      setConnectionStatus(status);
      console.log(`🔗 Statut connexion: ${status}`);
    },
  });

  // Exemple 2: Utilisation spécialisée pour les agents
  const agentRealTime = useAgentRealTime();

  // Fonction pour tester la connexion
  const testConnection = async (jobId: string) => {
    try {
      console.log('🧪 Test de connexion hybride...');
      await hybridRealTime.connect(jobId);
      console.log('✅ Connexion établie avec succès');
    } catch (error) {
      console.error('❌ Échec de connexion:', error);
    }
  };

  // Fonction pour démarrer un agent avec connexion temps réel
  const startAgentWithRealTime = async () => {
    try {
      console.log('🤖 Démarrage agent avec connexion temps réel...');

      // Ici vous pouvez intégrer avec votre logique d'agent existante
      // Par exemple: await sendMessage(message, ...)

      // Puis connecter le temps réel
      // await agentRealTime.startRealTime(jobId);

      console.log('✅ Agent démarré avec connexion temps réel');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error);
    }
  };

  // Nettoyage automatique
  useEffect(() => {
    return () => {
      hybridRealTime.disconnect();
      agentRealTime.stopRealTime();
    };
  }, [hybridRealTime, agentRealTime]);

  return {
    // État de la connexion
    connectionStatus,
    lastMessage,
    isConnected: hybridRealTime.isConnected,
    connectionMethod: hybridRealTime.connectionMethod,

    // Actions
    testConnection,
    startAgentWithRealTime,
    reconnect: hybridRealTime.reconnect,
    disconnect: hybridRealTime.disconnect,

    // Agent spécifique
    agentIsConnected: agentRealTime.isConnected,
    agentConnectionMethod: agentRealTime.connectionMethod,
    startAgentRealTime: agentRealTime.startRealTime,
    stopAgentRealTime: agentRealTime.stopRealTime,
  };
};

/**
 * Comment intégrer dans vos composants existants:
 *
 * import { useRealTimeExample } from './useHybridRealTimeExample';
 *
 * function MyComponent() {
 *   const {
 *     connectionStatus,
 *     isConnected,
 *     testConnection
 *   } = useRealTimeExample();
 *
 *   return (
 *     <div>
 *       <p>Statut: {connectionStatus}</p>
 *       <button onClick={() => testConnection('job-123')}>
 *         Tester connexion
 *       </button>
 *     </div>
 *   );
 * }
 */
