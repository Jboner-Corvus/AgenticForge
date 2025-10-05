import React from 'react';
import BrowserControls from './BrowserControls';

/**
 * Exemple d'intégration des composants de visualisation du navigateur
 * dans l'interface principale de l'application
 */
export const BrowserIntegrationExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Agent MCP - Browser Visualization
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Agent Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Chat/Agent Interface */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Agent Conversation
              </h2>

              {/* Browser Controls - Affiché quand l'agent utilise le navigateur */}
              <BrowserControls />

              <div className="space-y-4">
                {/* Exemple de conversation */}
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      "Va sur Google et recherche 'intelligence artificielle'"
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">A</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-900">
                        Je vais naviguer vers Google et effectuer une
                        recherche...
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-blue-700">
                            Navigating to https://www.google.com
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Area - Pour afficher les screenshots dans l'historique */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Visual History
              </h3>
              <div className="text-sm text-gray-600">
                Les screenshots capturés par l'agent apparaîtront
                automatiquement ici pour créer un historique visuel des actions
                effectuées.
              </div>
            </div>
          </div>

          {/* Right Column - Live Visualization */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Live Browser View
              </h3>
              <div className="text-sm text-gray-600 mb-4">
                Cette zone affiche les actions du navigateur en temps réel. Le
                composant{' '}
                <code className="bg-gray-100 px-1 rounded">
                  BrowserLiveView
                </code>{' '}
                apparaît automatiquement quand l'agent utilise des outils de
                navigation.
              </div>

              {/* Zone où BrowserLiveView apparaîtra */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-500">
                  <div className="text-4xl mb-2">📺</div>
                  <p className="text-sm">
                    Live browser visualization will appear here
                    <br />
                    when agent performs browser actions
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Technical Implementation
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Événements Redis:</strong>
                  <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                    browser.screenshot.realtime
                  </code>
                </div>

                <div>
                  <strong>Composants UI:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>
                      <code>BrowserLiveView</code> - Visualisation temps réel
                    </li>
                    <li>
                      <code>BrowserControls</code> - Contrôles utilisateur
                    </li>
                    <li>
                      <code>useAgentStream</code> - Gestion des événements
                    </li>
                  </ul>
                </div>

                <div>
                  <strong>Actions Visualisées:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Navigation avec screenshots</li>
                    <li>Clics avec highlighting</li>
                    <li>Saisie avec focus visible</li>
                    <li>Extraction de contenu</li>
                    <li>Exécution JavaScript</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrowserIntegrationExample;
