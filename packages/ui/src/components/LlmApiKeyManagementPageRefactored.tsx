import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Key,
  Shield,
  RefreshCw,
  Search,
  Brain,
  RotateCcw,
  Target,
  Zap,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

// Import des hooks personnalisés
import { useLlmKeys } from './llm/hooks/useLlmKeys';
import { useLlmAnalytics } from './llm/hooks/useLlmAnalytics';
import { useNotifications } from './llm/hooks/useNotifications';

// Import des composants modulaires
import BackendKeysList from './llm/components/BackendKeysList';
import NotificationSystem from './llm/components/NotificationSystem';
import AnalyticsDashboard from './llm/components/AnalyticsDashboard';

// Définition des providers (extrait du fichier original)
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
    logo: () => null, // Placeholder
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    description:
      "Modèles GPT d'OpenAI avec des capacités avancées de raisonnement.",
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: () => null, // Placeholder
    models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com',
    description:
      'Modèles Google Gemini 2.5 Pro. Haute performance avec des capacités avancées.',
  },
  {
    id: 'qwen',
    name: 'Qwen (Tongyi Lab)',
    logo: () => null, // Placeholder
    models: ['qwen3-coder-plus'],
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    description:
      "Qwen 3 Coder Plus d'Alibaba Cloud. Modèle spécialisé pour le développement logiciel.",
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: () => null, // Placeholder
    models: ['z-ai/glm-4.5-air:free'],
    baseUrl: 'https://openrouter.ai/api/v1',
    description:
      'OpenRouter avec modèle GLM-4.5 Air gratuit - Fonctionne parfaitement ✅',
  },
];

const LlmApiKeyManagementPageRefactored: React.FC = () => {
  // État local simplifié
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [smartRotationEnabled, setSmartRotationEnabled] = useState(true);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(true);

  // Utilisation des hooks personnalisés
  const {
    backendKeys,
    masterKey,
    isLoading,
    // error, // Not used in this component
    refreshKeys,
    testKey,
    isTestingKey,
  } = useLlmKeys();

  const { systemHealth, recommendations, isAnalyzing } =
    useLlmAnalytics(backendKeys);

  const { notifications, addNotification, removeNotification } =
    useNotifications();

  // Filtrage des clés
  const filteredKeys = useMemo(() => {
    return backendKeys.filter((key) => {
      const matchesSearch =
        searchTerm === '' ||
        key.apiProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.apiModel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProvider =
        selectedProvider === 'all' || key.apiProvider === selectedProvider;
      const matchesStatus = showInactive || !key.isPermanentlyDisabled;

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [backendKeys, searchTerm, selectedProvider, showInactive]);

  // Gestionnaires d'événements
  const handleRefresh = async () => {
    try {
      await refreshKeys();
      addNotification({
        type: 'success',
        title: 'Données actualisées',
        message: 'Les clés API ont été rechargées avec succès.',
        duration: 3000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Erreur de rafraîchissement',
        message: 'Impossible de recharger les données.',
        duration: 5000,
      });
    }
  };

  const handleTestKey = async (index: number) => {
    try {
      await testKey(index);
      addNotification({
        type: 'success',
        title: 'Test réussi',
        message: `Clé ${backendKeys[index]?.apiProvider} validée avec succès`,
        duration: 4000,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Échec du test',
        message:
          err instanceof Error ? err.message : 'Erreur inconnue lors du test',
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 overflow-y-auto">
      {/* Système de notifications */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {/* Header avec statistiques */}
      <motion.div
        className={`mb-6 p-6 rounded-xl border-2 backdrop-blur-sm ${
          backendKeys.length > 0 &&
          recommendations.filter((r) => r.priority === 'high').length === 0
            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50'
            : backendKeys.length > 0 &&
                recommendations.filter((r) => r.priority === 'high').length > 0
              ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50'
              : 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700/50'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {backendKeys.length > 0 &&
            recommendations.filter((r) => r.priority === 'high').length ===
              0 ? (
              <div className="bg-green-900/50 p-3 rounded-full border border-green-700/50">
                <Brain className="h-12 w-12 text-green-400" />
              </div>
            ) : backendKeys.length > 0 &&
              recommendations.filter((r) => r.priority === 'high').length >
                0 ? (
              <div className="bg-yellow-900/50 p-3 rounded-full border border-yellow-700/50">
                <Shield className="h-12 w-12 text-yellow-400" />
              </div>
            ) : (
              <div className="bg-purple-900/50 p-3 rounded-full border border-purple-700/50">
                <Key className="h-12 w-12 text-purple-400" />
              </div>
            )}
            <div>
              <h1
                className={`text-2xl font-bold ${
                  backendKeys.length > 0 &&
                  recommendations.filter((r) => r.priority === 'high')
                    .length === 0
                    ? 'text-green-300'
                    : backendKeys.length > 0 &&
                        recommendations.filter((r) => r.priority === 'high')
                          .length > 0
                      ? 'text-yellow-300'
                      : 'text-purple-300'
                }`}
              >
                Gestionnaire LLM Intelligent - {backendKeys.length} clé(s)
              </h1>
              <p
                className={`text-sm ${
                  backendKeys.length > 0 &&
                  recommendations.filter((r) => r.priority === 'high')
                    .length === 0
                    ? 'text-green-400/80'
                    : backendKeys.length > 0 &&
                        recommendations.filter((r) => r.priority === 'high')
                          .length > 0
                      ? 'text-yellow-400/80'
                      : 'text-purple-400/80'
                }`}
              >
                {backendKeys.length > 0 &&
                recommendations.filter((r) => r.priority === 'high').length ===
                  0
                  ? `Système optimal avec ${backendKeys.filter((k) => !k.isPermanentlyDisabled).length} clés actives.`
                  : backendKeys.length > 0 &&
                      recommendations.filter((r) => r.priority === 'high')
                        .length > 0
                    ? `${recommendations.filter((r) => r.priority === 'high').length} problème(s) détecté(s).`
                    : "Ajoutez vos clés API pour bénéficier de l'intelligence artificielle avancée"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dashboard d'analytics */}
      {backendKeys.length > 0 && (
        <AnalyticsDashboard
          systemHealth={systemHealth}
          recommendations={recommendations}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Master Key Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg border border-yellow-800/50"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-300">
              Master Key (.env)
            </h3>
          </div>
          <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50 mt-2 md:mt-0">
            Variable d'environnement
          </Badge>
        </div>
        <div className="mt-3 text-sm text-yellow-200/90">
          Cette clé est chargée depuis vos variables d'environnement et sert de
          solution de repli. Elle a la plus haute priorité dans la hiérarchie
          des clés.
        </div>
        <div className="mt-3 flex items-center text-xs text-yellow-400/90">
          <Key className="h-3 w-3 mr-1" />
          <span>
            {masterKey?.keyValue
              ? `${masterKey.keyValue.substring(0, 8)}...${masterKey.keyValue.substring(masterKey.keyValue.length - 4)}`
              : "Aucune clé maîtresse trouvée dans les variables d'environnement"}
          </span>
        </div>
      </motion.div>

      {/* Filtres et recherche */}
      <Card className="mb-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par provider ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600/50"
              />
            </div>

            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
                <SelectValue placeholder="Tous les providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les providers</SelectItem>
                {PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <label htmlFor="show-inactive" className="text-sm text-gray-300">
                Afficher inactives
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="smart-rotation"
                checked={smartRotationEnabled}
                onCheckedChange={setSmartRotationEnabled}
              />
              <label
                htmlFor="smart-rotation"
                className="text-sm text-gray-300 flex items-center gap-2"
              >
                <RotateCcw
                  className={`h-4 w-4 ${smartRotationEnabled ? 'text-green-400' : 'text-gray-500'}`}
                />
                Rotation intelligente
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="auto-optimization"
                checked={autoOptimizationEnabled}
                onCheckedChange={setAutoOptimizationEnabled}
              />
              <label
                htmlFor="auto-optimization"
                className="text-sm text-gray-300 flex items-center gap-2"
              >
                <Target
                  className={`h-4 w-4 ${autoOptimizationEnabled ? 'text-purple-400' : 'text-gray-500'}`}
                />
                Optimisation auto
              </label>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des clés backend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Key className="h-5 w-5 mr-2 text-purple-400" />
            Clés API configurées
          </h2>
        </div>

        <BackendKeysList
          keys={filteredKeys}
          isLoading={isLoading}
          testingKeyIndex={backendKeys.findIndex((_, index) =>
            isTestingKey(index),
          )}
          onTestKey={handleTestKey}
        />
      </div>

      {/* Footer avec fonctionnalités intelligentes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 space-y-4"
      >
        {/* Smart Features Status */}
        <div className="flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              smartRotationEnabled
                ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            <RotateCcw
              className={`h-3 w-3 ${smartRotationEnabled ? 'animate-spin' : ''}`}
            />
            <span>Rotation Intelligente</span>
            <div
              className={`h-2 w-2 rounded-full ${
                smartRotationEnabled
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
            />
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              autoOptimizationEnabled
                ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            <Target
              className={`h-3 w-3 ${autoOptimizationEnabled ? 'animate-pulse' : ''}`}
            />
            <span>Optimisation Auto</span>
            <div
              className={`h-2 w-2 rounded-full ${
                autoOptimizationEnabled
                  ? 'bg-purple-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
            />
          </div>
        </div>

        {/* System Features */}
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1">
              <Brain className="h-4 w-4 text-cyan-400" />
              Surveillance IA Active
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              Rotation Automatique
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4 text-purple-400" />
              Optimisation Intelligente
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-400" />
              Sécurité Renforcée
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LlmApiKeyManagementPageRefactored;
