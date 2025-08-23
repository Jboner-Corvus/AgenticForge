import { Save, Info, CheckCircle, Settings, Key, Zap, Shield, Copy, Eye, EyeOff, Calendar, Check, XCircle } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useCombinedStore } from '../store';
import { getMasterLlmApiKeyApi } from '../lib/api';
import { OpenAILogo, GeminiLogo, QwenLogo } from './icons/LlmLogos';
import { OpenRouterLogo } from './icons/LlmLogos/OpenRouterLogo';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';
import { CombinedAppState } from '../store';
import { LlmApiKey, BackendLlmApiKey } from '../store/types';
import { getLlmApiKeysApi, testLlmApiKey } from '../lib/api';

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
    id: 'gemini', 
    name: 'Gemini', 
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
const StatusBanner = ({ backendKeys }: { backendKeys?: BackendLlmApiKey[] }) => {
  const llmApiKeys = useCombinedStore((state: CombinedAppState) => state.llmApiKeys);
  const hasKeys = (backendKeys && backendKeys.length > 0) || llmApiKeys.length > 0;
  const totalKeys = backendKeys ? backendKeys.length : llmApiKeys.length;
  const activeKeys = backendKeys ? backendKeys.filter(k => !k.isPermanentlyDisabled).length : totalKeys;

  // Debug: Log current state
  // Debug logging removed to reduce console noise

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
              {hasKeys ? `${totalKeys} clé(s) configurée(s) (${activeKeys} active(s))` : 'Configuration des clés LLM'}
            </h1>
            <p className={`text-sm ${ 
              hasKeys ? 'text-green-400/80' : 'text-purple-400/80'
            }`}>
              {hasKeys 
                ? `Configuration active avec ${activeKeys} clé(s) prête(s). Rotation automatique en cas d'erreur.` 
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
  const activeLlmApiKeyIndex = useCombinedStore((state: CombinedAppState) => state.activeLlmApiKeyIndex);
  const setActiveLlmApiKey = useCombinedStore((state: CombinedAppState) => state.setActiveLlmApiKey);


  const [apiKey, setApiKey] = useState('');
  const [nickname, setNickname] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const authToken = useCombinedStore((state: CombinedAppState) => state.authToken);


  const providerKeys = llmApiKeys.filter((k: LlmApiKey) => k.provider === provider.id);
  const hasKey = providerKeys.length > 0;
  const activeModel = hasKey ? providerKeys[0].model : provider.models[0];
  const keyData = hasKey ? providerKeys[0] : null;

  const isActive = hasKey && llmApiKeys[activeLlmApiKeyIndex]?.key === keyData?.key;

  useEffect(() => {
    if (keyData) {
      setApiKey(keyData.key || '');
      setNickname(keyData.nickname || '');
    }
  }, [keyData]);

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;

    setTestStatus('testing');
    try {
      const result = await testLlmApiKey(provider.id, apiKey, provider.baseUrl, authToken, null);
      if (result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      console.error("Test API Key failed", error);
      setTestStatus('error');
    } finally {
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !nickname.trim()) {
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
    const newKey: LlmApiKey = {
      id: Math.random().toString(36).substring(2, 15),
      providerId: provider.id,
      providerName: provider.name,
      keyName: nickname,
      keyValue: apiKey,
      isEncrypted: false,
      isActive: true,
      priority: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      metadata: {
        environment: 'universal',
        tags: [provider.models[0]]
      },
      provider: provider.id,
      key: apiKey,
      nickname: nickname,
      baseUrl: provider.baseUrl,
      model: provider.models[0]
    };
    await addLlmApiKey(newKey);
    
    // Refresh the backend keys display
    const authToken = useCombinedStore.getState().authToken;
    if (authToken) {
      try {
        const keys = await getLlmApiKeysApi(authToken, null);
        const backendKeysConverted: BackendLlmApiKey[] = keys.map(key => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: key.usageStats?.failedRequests || 0,
          lastUsed: key.usageStats?.lastUsed ? new Date(key.usageStats.lastUsed).getTime() : undefined,
          priority: key.priority,
          isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10
        }));
        console.log('Backend keys converted:', backendKeysConverted);
        // We need to update the parent component state, but we can't directly access it
        // The parent component will refresh automatically when the store updates
      } catch (error) {
        console.error('Failed to refresh backend keys:', error);
      }
    }
  };

  const handleRemove = async () => {
    for (const key of providerKeys) {
      const globalIndex = llmApiKeys.findIndex((k: LlmApiKey) => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }
    setApiKey('');
    setNickname('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetActive = () => {
    const globalIndex = llmApiKeys.findIndex((k: LlmApiKey) => k.key === keyData?.key && k.provider === provider.id);
    if (globalIndex !== -1) {
      setActiveLlmApiKey(globalIndex);
    }
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
        ${isActive ? 'ring-2 ring-green-500/50' : (hasKey ? 'ring-2 ring-purple-500/30' : '')}`}>
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
                  {isActive && (
                    <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">{provider.description}</p>
                {hasKey && keyData && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50 text-xs">
                      <Zap className="h-3 w-3 mr-1 inline" />
                      Modèle: {activeModel}
                    </Badge>
                    <Badge className="bg-gray-700/50 text-gray-300 border border-gray-600 text-xs">
                        <Calendar className="h-3 w-3 mr-1 inline" />
                        Ajoutée le: {new Date(keyData.createdAt).toLocaleDateString()}
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
              <label htmlFor={`nickname-field-${provider.id}`} className="block text-sm font-medium text-gray-300">
                Surnom de la clé
              </label>
              <Input
                id={`nickname-field-${provider.id}`}
                name="nickname-field"
                type="text"
                placeholder="Ex: Clé perso OpenAI"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500
                  focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`api-key-field-${provider.id}`} className="block text-sm font-medium text-gray-300">
                Clé API
              </label>
              <div className="relative">
                <Input
                  id={`api-key-field-${provider.id}`}
                  name="api-key-field"
                  type={isKeyVisible ? 'text' : 'password'}
                  placeholder="Entrez votre clé API..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500
                    focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 pr-24"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsKeyVisible(!isKeyVisible)} className="h-7 w-7 text-gray-400 hover:text-white">
                        {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7 text-gray-400 hover:text-white">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex space-x-2">
                {hasKey && !isActive && (
                    <Button variant="outline" size="sm" onClick={handleSetActive} className="border-green-500/50 text-green-400 hover:bg-green-900/30 hover:text-green-300">
                        Activer
                    </Button>
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
                  onClick={handleTestKey}
                  disabled={!apiKey.trim() || testStatus === 'testing'}
                  size="sm"
                  variant="outline"
                  className={`
                    ${testStatus === 'success' ? 'border-green-500/50 text-green-400 hover:bg-green-900/30 hover:text-green-300' : ''}
                    ${testStatus === 'error' ? 'border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300' : ''}
                    ${testStatus === 'idle' ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white' : ''}
                  `}
                >
                  {testStatus === 'testing' && <LoadingSpinner className="h-4 w-4 mr-2" />}
                  {testStatus === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {testStatus === 'error' && <XCircle className="h-4 w-4 mr-2" />}
                  {testStatus === 'idle' && 'Tester'}
                  {testStatus === 'testing' && 'Test...'}
                  {testStatus === 'success' && 'Valide'}
                  {testStatus === 'error' && 'Échec'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isAddingLlmApiKey || !apiKey.trim() || !nickname.trim()}
                  size="sm"
                  className="bg-purple-700 hover:bg-purple-600 text-white
                    disabled:bg-gray-700 disabled:text-gray-500"
                >
                  {isAddingLlmApiKey ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {hasKey ? 'Mettre à jour' : 'Sauvegarder'}
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

import { HierarchyManager } from './HierarchyManager';

export const LlmApiKeyManagementPage = memo(() => {
  const authToken = useCombinedStore((state: CombinedAppState) => state.authToken);
  const [backendKeys, setBackendKeys] = useState<BackendLlmApiKey[]>([]);
  const [masterKey, setMasterKey] = useState<LlmApiKey | null>(null);
  const [testingKey, setTestingKey] = useState<number | null>(null);

  // Charger les clés du backend au montage
  useEffect(() => {
    const loadBackendKeys = async () => {
      if (!authToken) return;
      
      try {
        // Fetch regular LLM API keys
        const keys = await getLlmApiKeysApi(authToken, null);
        
        // Fetch master key
        let masterKeyData: LlmApiKey | null = null;
        try {
          masterKeyData = await getMasterLlmApiKeyApi(authToken, null);
        } catch (error) {
          console.warn("Failed to fetch master key:", error);
        }
        
        setMasterKey(masterKeyData);
        
        // Convert LlmApiKey[] to BackendLlmApiKey[]
        const backendKeysConverted: BackendLlmApiKey[] = keys.map(key => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: key.usageStats?.failedRequests || 0,
          lastUsed: key.usageStats?.lastUsed ? new Date(key.usageStats.lastUsed).getTime() : undefined,
          priority: key.priority,
          isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10 // Mark as disabled if too many errors
        }));
        
        setBackendKeys(backendKeysConverted);
        console.log('🔑 Backend keys loaded:', keys);
      } catch (error) {
        console.error('Failed to load backend keys:', error);
      }
    };

    loadBackendKeys();
  }, [authToken]);

  // Fonction pour tester une clé LLM
  const testKey = async (keyIndex: number) => {
    if (!authToken) return;
    
    setTestingKey(keyIndex);
    try {
      const keyToTest = backendKeys[keyIndex];
      if (!keyToTest) throw new Error('Key not found');
      
      // Use dedicated test endpoint instead of consuming tokens
      const response = await fetch('/api/llm-keys/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          providerId: keyToTest.apiProvider,
          keyValue: keyToTest.apiKey,
          model: keyToTest.apiModel || undefined
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.valid) {
        // Reload keys to see updates
        const keys = await getLlmApiKeysApi(authToken, null);
        const backendKeysConverted: BackendLlmApiKey[] = keys.map(key => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: 0,
          isPermanentlyDisabled: false,
        }));
        setBackendKeys(backendKeysConverted || []);
        console.log(`✅ Key ${keyIndex} tested successfully`);
      } else {
        throw new Error(result.error || 'Key validation failed');
      }
    } catch (error) {
      console.error(`❌ Key test failed for ${keyIndex}:`, error);
      throw error; // Re-throw so UI can show error state
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 min-h-screen">
      <StatusBanner backendKeys={backendKeys} />
      <HierarchyManager />
      <OnboardingInfo />
      
      {/* Master Key Display */}
      {masterKey && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg border border-yellow-800/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-300">Master Key (.env)</h3>
            </div>
            <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
              Environment Variable
            </Badge>
          </div>
          <div className="mt-2 text-sm text-yellow-200/80">
            This key is loaded from your environment variables and serves as a fallback.
          </div>
          <div className="mt-2 flex items-center text-xs text-yellow-400/80">
            <Key className="h-3 w-3 mr-1" />
            <span>{masterKey.keyValue ? `${masterKey.keyValue.substring(0, 8)}...${masterKey.keyValue.substring(masterKey.keyValue.length - 4)}` : 'No key found'}</span>
          </div>
        </motion.div>
      )}

      {/* User Keys */}
      <div className="space-y-4">
        {backendKeys.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Key className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-300">No API Keys Added</h3>
              <p className="mt-2 text-gray-500">
                Add your first API key to get started with different LLM providers.
              </p>
            </CardContent>
          </Card>
        ) : (
          backendKeys.map((key, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
              index === 0 ? 'bg-green-900/30 border-green-600/50' : 'bg-gray-700/50 border-gray-600/50'
            }`}>
              <div className="flex items-center space-x-3">
                {index === 0 && (
                  <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                    <Zap className="h-3 w-3 mr-1" />
                    ACTIVE
                  </Badge>
                )}
                <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50">
                  {key.apiProvider}
                </Badge>
                <span className="text-white font-medium">{key.apiModel || 'Modèle par défaut'}</span>
                <span className="text-gray-400 text-sm">
                  Clé: {key.apiKey?.substring(0, 20)}...
                </span>
                {key.baseUrl && (
                  <span className="text-blue-400 text-xs">
                    {new URL(key.baseUrl).hostname}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {key.lastUsed && (
                  <Badge className="bg-green-900/50 text-green-300 border border-green-700/50 text-xs">
                    Utilisée: {new Date(key.lastUsed).toLocaleString()}
                  </Badge>
                )}
                {key.errorCount > 0 && (
                  <Badge className="bg-red-900/50 text-red-300 border border-red-700/50 text-xs">
                    Erreurs: {key.errorCount}
                  </Badge>
                )}
                {key.isPermanentlyDisabled && (
                  <Badge className="bg-red-900/50 text-red-300 border border-red-700/50 text-xs">
                    DÉSACTIVÉE
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testKey(index)}
                  disabled={testingKey === index}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 text-xs"
                >
                  {testingKey === index ? (
                    <>
                      <LoadingSpinner className="h-3 w-3 mr-1" />
                      Test...
                    </>
                  ) : (
                    'Tester'
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      
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
