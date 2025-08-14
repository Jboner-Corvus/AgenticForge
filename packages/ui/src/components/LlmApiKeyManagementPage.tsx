import { Save, Info, CheckCircle, Settings, Key, Zap, Shield } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useCombinedStore } from '../store';
import { OpenAILogo, GeminiLogo, QwenLogo } from './icons/LlmLogos';
import { OpenRouterLogo } from './icons/LlmLogos/OpenRouterLogo';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';
import { CombinedAppState, LlmApiKey } from '../store';

interface LlmProviderConfig {
  id: string;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  models: string[];
  baseUrl?: string;
  description: string;
}

const PROVIDERS: LlmProviderConfig[] = [
  // Hiérarchie des fournisseurs:
  // 1. OpenAI (gpt-5)
  {
    id: 'openai', 
    name: 'OpenAI', 
    logo: OpenAILogo, 
    models: ['gpt-5'], 
    baseUrl: 'https://api.openai.com/v1',
    description: 'GPT-5 est le modèle le plus avancé d\'OpenAI avec des capacités de raisonnement améliorées.'
  },
  // 2. Google Gemini (gemini-2.5-pro)
  {
    id: 'gemini-pro', 
    name: 'Google Gemini Pro', 
    logo: GeminiLogo, 
    models: ['gemini-2.5-pro'], 
    baseUrl: 'https://generativelanguage.googleapis.com',
    description: 'Modèle Google Gemini 2.5 Pro. Haute performance avec des capacités avancées.'
  },
  // 3. Qwen (qwen3-coder-plus)
  {
    id: 'qwen',
    name: 'Qwen (Tongyi Lab)',
    logo: QwenLogo,
    models: ['qwen3-coder-plus'],
    baseUrl: 'https://portal.qwen.ai/v1',
    description: 'Qwen 3 Coder Plus d\'Alibaba Cloud. Modèle spécialisé pour le développement logiciel.'
  },
  // 4. OpenRouter (qwen/qwen3-235b-a22b:free)
  {
    id: 'openrouter', 
    name: 'OpenRouter (Qwen 3 235B)', 
    logo: OpenRouterLogo,
    models: ['qwen/qwen3-235b-a22b:free'], 
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'OpenRouter avec modèle Qwen 3 235B gratuit - Fonctionne parfaitement ✅'
  },
  // 5. Google Gemini (gemini-2.5-flash)
  {
    id: 'gemini-flash', 
    name: 'Google Gemini Flash', 
    logo: GeminiLogo, 
    models: ['gemini-2.5-flash'], 
    baseUrl: 'https://generativelanguage.googleapis.com',
    description: 'Modèle Google Gemini 2.5 Flash. Version rapide et économique.'
  },
];

// Status Banner avec thème gothique
const StatusBanner = () => {
  const llmApiKeys = useCombinedStore((state: CombinedAppState) => state.llmApiKeys);
  const activeLlmApiKeyIndex = useCombinedStore((state: CombinedAppState) => state.activeLlmApiKeyIndex);
  const hasKeys = llmApiKeys.length > 0;
  const totalKeys = llmApiKeys.length;

  // Debug: Log current state
  console.log('🔑 [STATUS] Current llmApiKeys:', llmApiKeys);
  console.log('🔑 [STATUS] Active index:', activeLlmApiKeyIndex);

  return (
    <motion.div
      className={`mb-8 p-6 rounded-xl border-2 backdrop-blur-sm ${ 
        hasKeys 
          ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50' 
          : 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700/50'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {hasKeys ? (
            <div className="bg-green-900/50 p-3 rounded-full border border-green-700/50">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
          ) : (
            <div className="bg-purple-900/50 p-3 rounded-full border border-purple-700/50">
              <Key className="h-12 w-12 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-bold ${ 
              hasKeys ? 'text-green-300' : 'text-purple-300'
            }`}>
              {hasKeys ? `${totalKeys} clé(s) configurée(s)` : 'Configuration des clés LLM'}
            </h1>
            <p className={`text-sm ${ 
              hasKeys ? 'text-green-400/80' : 'text-purple-400/80'
            }`}>
              {hasKeys 
                ? 'Votre configuration est active. Les clés tournent automatiquement.' 
                : 'Ajoutez vos clés API pour utiliser différents modèles LLM'}
            </p>
          </div>
        </div>
        {!hasKeys && (
          <div className="hidden md:flex space-x-6">
            <div className="flex items-center space-x-2 text-purple-400/80">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">Rotation automatique</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-400/80">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Gestion d'erreurs</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Composant Provider avec thème gothique professionnel
const SimpleProviderCard = ({ provider }: { provider: LlmProviderConfig }) => {
  const llmApiKeys = useCombinedStore((state: CombinedAppState) => state.llmApiKeys);
  const addLlmApiKey = useCombinedStore((state: CombinedAppState) => state.addLlmApiKey);
  const removeLlmApiKey = useCombinedStore((state: CombinedAppState) => state.removeLlmApiKey);
  const isAddingLlmApiKey = useCombinedStore((state: CombinedAppState) => state.isAddingLlmApiKey);

  const [apiKey, setApiKey] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const providerKeys = llmApiKeys.filter((k: LlmApiKey) => k.provider === provider.id);
  const hasKey = providerKeys.length > 0;
  const keyCount = providerKeys.length;
  const activeModel = hasKey ? providerKeys[0].model : provider.models[0];

  useEffect(() => {
    if (providerKeys.length > 0) {
      setApiKey(providerKeys[0].key);
    }
  }, [providerKeys]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return;
    }

    // Supprimer les anciennes clés pour ce provider
    for (const key of providerKeys) {
      const globalIndex = llmApiKeys.findIndex((k: LlmApiKey) => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }

    // Ajouter la nouvelle clé avec le modèle principal du provider
    await addLlmApiKey(provider.id, apiKey, provider.baseUrl, provider.models[0]);
  };

  const handleRemove = async () => {
    for (const key of providerKeys) {
      const globalIndex = llmApiKeys.findIndex((k: LlmApiKey) => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }
    setApiKey('');
  };

  const Logo = provider.logo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={`overflow-hidden transition-all duration-300 h-full flex flex-col
        bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700
        shadow-xl hover:shadow-2xl hover:border-purple-500/50
        ${hasKey ? 'ring-2 ring-purple-500/30' : ''}`}>
        <CardContent className="p-6 flex-grow flex flex-col">
          {/* En-tête de la carte avec logo et informations */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-800 p-2 rounded-lg border border-gray-600">
                <Logo className="h-10 w-10 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white">{provider.name}</h3>
                  {hasKey && (
                    <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">{provider.description}</p>
                {hasKey && (
                  <div className="mt-2">
                    <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50 text-xs">
                      <Zap className="h-3 w-3 mr-1 inline" />
                      Modèle: {activeModel}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>

          {/* Section détaillée des modèles */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Modèle{provider.models.length > 1 ? 's' : ''} disponible{provider.models.length > 1 ? 's' : ''}
              </h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Modèle principal utilisé:</div>
                <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50">
                  {provider.models[0]}
                </Badge>
                {provider.models.length > 1 && (
                  <>
                    <div className="text-xs text-gray-400 mt-3">Autres modèles supportés:</div>
                    <div className="flex flex-wrap gap-2">
                      {provider.models.slice(1).map(model => (
                        <Badge 
                          key={model} 
                          className="bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50"
                        >
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Section de configuration de la clé API */}
          <div className="flex-grow flex flex-col justify-end space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Clé API
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Entrez votre clé API..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500
                    focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
                />
                {hasKey && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-gray-500">
                {hasKey ? (
                  <span className="text-green-400/80">🔑 {keyCount} clé{keyCount > 1 ? 's' : ''} configurée{keyCount > 1 ? 's' : ''}</span>
                ) : (
                  <span className="text-amber-400/80">🔒 Aucune clé configurée</span>
                )}
              </div>
              <div className="flex space-x-2">
                {hasKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isAddingLlmApiKey}
                    className="border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  >
                    Supprimer
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isAddingLlmApiKey || !apiKey.trim()}
                  size="sm"
                  className="bg-purple-700 hover:bg-purple-600 text-white
                    disabled:bg-gray-700 disabled:text-gray-500"
                >
                  {isAddingLlmApiKey ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Info section pour les nouveaux utilisateurs avec thème gothique
const OnboardingInfo = () => {
  const llmApiKeys = useCombinedStore((state: CombinedAppState) => state.llmApiKeys);
  const hasKeys = llmApiKeys.length > 0;
  const [isVisible, setIsVisible] = useState(!hasKeys);

  if (hasKeys && !isVisible) return null;

  return (
    <motion.div
      className="mb-8 p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-xl backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-purple-900/50 rounded-full flex items-center justify-center border border-purple-700/50">
            <Key className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-300">Premier pas</h3>
            <p className="text-sm text-purple-400/80">Configurez votre première clé LLM</p>
          </div>
        </div>
        {hasKeys && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-purple-400 hover:text-white hover:bg-purple-800/50"
          >
            ×
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start space-x-3 p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
          <div className="h-8 w-8 bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-700/50">
            <span className="text-sm font-bold text-purple-300">1</span>
          </div>
          <div>
            <p className="font-semibold text-purple-300">Choisissez un provider</p>
            <p className="text-purple-400/80 mt-1">Gemini offre un niveau gratuit généreux</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
          <div className="h-8 w-8 bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-700/50">
            <span className="text-sm font-bold text-purple-300">2</span>
          </div>
          <div>
            <p className="font-semibold text-purple-300">Ajoutez votre clé API</p>
            <p className="text-purple-400/80 mt-1">Obtenez-la depuis le site du provider</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
          <div className="h-8 w-8 bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-700/50">
            <span className="text-sm font-bold text-purple-300">3</span>
          </div>
          <div>
            <p className="font-semibold text-purple-300">Sauvegardez</p>
            <p className="text-purple-400/80 mt-1">Votre agent est prêt à fonctionner !</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Debug Component to show current keys
const DebugKeysInfo = () => {
  const llmApiKeys = useCombinedStore((state: CombinedAppState) => state.llmApiKeys);
  const activeLlmApiKeyIndex = useCombinedStore((state: CombinedAppState) => state.activeLlmApiKeyIndex);
  const initializeSessionAndMessages = useCombinedStore((state: CombinedAppState) => state.initializeSessionAndMessages);

  const handleRefreshKeys = async () => {
    console.log('🔄 [DEBUG] Manually refreshing keys...');
    await initializeSessionAndMessages();
  };

  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-200">État des clés (Debug)</h3>
        <Button
          onClick={handleRefreshKeys}
          variant="outline"
          size="sm"
          className="border-blue-500/50 text-blue-400 hover:bg-blue-900/30"
        >
          🔄 Recharger les clés
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="text-gray-400">
          <strong>Nombre de clés:</strong> {llmApiKeys.length}
        </div>
        <div className="text-gray-400">
          <strong>Index actif:</strong> {activeLlmApiKeyIndex}
        </div>
        {llmApiKeys.map((key: LlmApiKey, index: number) => (
          <div key={index} className={`p-2 rounded border ${ 
            index === activeLlmApiKeyIndex 
              ? 'border-green-500 bg-green-900/20' 
              : 'border-gray-600 bg-gray-700/20'
          }`}>
            <div className="text-gray-300">
              <strong>#{index + 1} {key.provider}</strong> - {key.model}
            </div>
            <div className="text-gray-500 text-xs">
              Clé: {key.key.substring(0, 10)}...{key.key.substring(key.key.length - 10)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LlmApiKeyManagementPage = memo(() => {
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 min-h-screen">
      <StatusBanner />
      <DebugKeysInfo />
      <OnboardingInfo />
      
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Settings className="h-6 w-6 mr-3 text-purple-400" />
          Fournisseurs disponibles
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROVIDERS.map((provider) => (
            <SimpleProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-amber-400" />
            Conseils de configuration
          </h3>
          <ul className="text-gray-400 space-y-2">
            <li className="flex items-start">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Vous pouvez configurer plusieurs providers pour une redondance automatique</span>
            </li>
            <li className="flex items-start">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>En cas d\'erreur sur une clé, le système bascule automatiquement vers la suivante selon la hiérarchie</span>
            </li>
            <li className="flex items-start">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Les clés sont stockées de manière sécurisée et chiffrées localement</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
