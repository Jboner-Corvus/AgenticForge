import { Save, Info, CheckCircle, Settings, Key, Zap, Shield } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { OpenAILogo, AnthropicLogo, GeminiLogo } from './icons/LlmLogos';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent } from './ui/card';
import { useToast } from '../lib/hooks/useToast';
import { motion } from 'framer-motion';

interface LlmProviderConfig {
  id: string;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  models: string[];
  baseUrl?: string;
  description: string;
}

const PROVIDERS: LlmProviderConfig[] = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    logo: OpenAILogo, 
    models: ['gpt-4o', 'gpt-4o-mini'], 
    baseUrl: 'https://api.openai.com/v1',
    description: 'ChatGPT et GPT-4. Excellent pour le raisonnement et la génération de code.'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    logo: AnthropicLogo, 
    models: ['claude-3-5-sonnet'], 
    baseUrl: 'https://api.anthropic.com',
    description: 'Claude 3.5. Très performant pour l\'analyse et les tâches complexes.'
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    logo: GeminiLogo, 
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'], 
    baseUrl: 'https://generativelanguage.googleapis.com',
    description: 'Modèles Google. Gratuit avec des limites généreuses.'
  },
];

// Status Banner simplifié
const StatusBanner = () => {
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const hasKeys = llmApiKeys.length > 0;
  const totalKeys = llmApiKeys.length;

  return (
    <motion.div
      className={`mb-8 p-6 rounded-xl border-2 ${hasKeys 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {hasKeys ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <Key className="h-12 w-12 text-blue-600" />
          )}
          <div>
            <h1 className={`text-2xl font-bold ${hasKeys ? 'text-green-800' : 'text-blue-800'}`}>
              {hasKeys ? `${totalKeys} clé(s) configurée(s)` : 'Configuration des clés LLM'}
            </h1>
            <p className={`text-sm ${hasKeys ? 'text-green-700' : 'text-blue-700'}`}>
              {hasKeys 
                ? 'Votre configuration est active. Les clés tournent automatiquement.' 
                : 'Ajoutez vos clés API pour utiliser différents modèles LLM'}
            </p>
          </div>
        </div>
        {!hasKeys && (
          <div className="hidden md:flex space-x-6">
            <div className="flex items-center space-x-2 text-blue-700">
              <Zap className="h-5 w-5" />
              <span className="text-sm font-medium">Rotation automatique</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Gestion d'erreurs</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Composant Provider simplifié
const SimpleProviderCard = ({ provider }: { provider: LlmProviderConfig }) => {
  const { toast } = useToast();
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const addLlmApiKey = useStore((state) => state.addLlmApiKey);
  const removeLlmApiKey = useStore((state) => state.removeLlmApiKey);
  const isAddingLlmApiKey = useStore((state) => state.isAddingLlmApiKey);

  const [apiKey, setApiKey] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const providerKeys = llmApiKeys.filter(k => k.provider === provider.id);
  const hasKey = providerKeys.length > 0;
  const keyCount = providerKeys.length;

  useEffect(() => {
    if (providerKeys.length > 0) {
      setApiKey(providerKeys[0].key);
    }
  }, [providerKeys]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer une clé API", variant: "destructive" });
      return;
    }

    // Supprimer les anciennes clés pour ce provider
    for (const key of providerKeys) {
      const globalIndex = llmApiKeys.findIndex(k => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }

    // Ajouter la nouvelle clé
    await addLlmApiKey(provider.id, apiKey, provider.baseUrl, provider.models[0]);
    toast({ title: "Succès", description: `Clé ${provider.name} sauvegardée` });
  };

  const handleRemove = async () => {
    for (const key of providerKeys) {
      const globalIndex = llmApiKeys.findIndex(k => k.key === key.key && k.provider === provider.id);
      if (globalIndex !== -1) {
        await removeLlmApiKey(globalIndex);
      }
    }
    setApiKey('');
    toast({ title: "Supprimé", description: `Clé ${provider.name} supprimée` });
  };

  const Logo = provider.logo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`overflow-hidden transition-all duration-200 ${
        hasKey 
          ? 'ring-2 ring-green-200 bg-green-50/50' 
          : 'hover:shadow-md border-gray-200'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Logo className="h-10 w-10 text-gray-700" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                  {hasKey && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <h4 className="text-sm font-medium text-gray-700 mb-2">Modèles disponibles:</h4>
              <div className="flex flex-wrap gap-2">
                {provider.models.map(model => (
                  <Badge key={model} variant="secondary" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API
              </label>
              <Input
                type="password"
                placeholder="Entrez votre clé API..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {hasKey ? `${keyCount} clé(s) configurée(s)` : 'Aucune clé configurée'}
              </div>
              <div className="flex space-x-2">
                {hasKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isAddingLlmApiKey}
                  >
                    Supprimer
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isAddingLlmApiKey || !apiKey.trim()}
                  size="sm"
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

// Info section pour les nouveaux utilisateurs
const OnboardingInfo = () => {
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const hasKeys = llmApiKeys.length > 0;
  const [isVisible, setIsVisible] = useState(!hasKeys);

  if (hasKeys && !isVisible) return null;

  return (
    <motion.div
      className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Key className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-800">Premier pas</h3>
            <p className="text-sm text-purple-600">Configurez votre première clé LLM</p>
          </div>
        </div>
        {hasKeys && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-purple-600"
          >
            ×
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start space-x-3">
          <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-purple-600">1</span>
          </div>
          <div>
            <p className="font-medium text-purple-800">Choisissez un provider</p>
            <p className="text-purple-600">Gemini offre un niveau gratuit généreux</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-purple-600">2</span>
          </div>
          <div>
            <p className="font-medium text-purple-800">Ajoutez votre clé API</p>
            <p className="text-purple-600">Obtenez-la depuis le site du provider</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-purple-600">3</span>
          </div>
          <div>
            <p className="font-medium text-purple-800">Sauvegardez</p>
            <p className="text-purple-600">Votre agent est prêt à fonctionner !</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const LlmApiKeyManagementPage = memo(() => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <StatusBanner />
      <OnboardingInfo />
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Providers disponibles
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROVIDERS.map((provider) => (
            <SimpleProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Conseils</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Vous pouvez configurer plusieurs providers pour une redondance automatique</li>
            <li>• En cas d'erreur sur une clé, le système bascule automatiquement vers la suivante</li>
            <li>• Les clés sont stockées de manière sécurisée et chiffrées</li>
          </ul>
        </div>
      </div>
    </div>
  );
});