import {
  Save,
  Info,
  CheckCircle,
  Settings,
  Key,
  Zap,
  Shield,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  Check,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Brain,
  TrendingUp,
  Activity,
  BarChart3,
  Target,
  Plus,
  Search,
  Trash2,
  Edit,
  RotateCcw,
  Star,
  Zap as Lightning,
  Lock,
  Unlock,
  MoreHorizontal,
  TestTube,
} from 'lucide-react';
import { memo, useState, useEffect, useMemo } from 'react';
import { useCombinedStore } from '../store';
import { getMasterLlmApiKeyApi } from '../lib/api';
import { OpenAILogo, GeminiLogo, QwenLogo } from './icons/LlmLogos';
import { OpenRouterLogo } from './icons/LlmLogos/OpenRouterLogo';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { CombinedAppState } from '../store';
import { LlmApiKey, BackendLlmApiKey } from '../store/types';
import { getLlmApiKeysApi, testLlmApiKey } from '../lib/api';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// ===== INTELLIGENT LLM MANAGER =====

// Types for intelligent analytics (removed unused KeyHealthMetrics)

interface SmartRecommendation {
  type: 'rotate' | 'disable' | 'monitor' | 'optimize';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  keyId?: string;
}

interface SystemAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeKeys: number;
  degradedKeys: number;
  systemHealth: number;
}

// ===== SCHÉMAS DE VALIDATION =====
const apiKeyValidationSchema = z.object({
  provider: z.string().min(1, 'Le provider est requis'),
  key: z.string()
    .min(8, 'La clé API doit contenir au moins 8 caractères')
    .refine((key) => {
      // Validation basée sur le format du provider
      const openaiPattern = /^sk-/;
      const anthropicPattern = /^sk-ant-/;
      const googlePattern = /^AI/;
      const xaiPattern = /^xai-/;
      const openrouterPattern = /^sk-or-/;

      return openaiPattern.test(key) ||
              anthropicPattern.test(key) ||
              googlePattern.test(key) ||
              xaiPattern.test(key) ||
              openrouterPattern.test(key) ||
              key.length >= 20; // Longueur minimale pour autres formats
    }, 'Format de clé API invalide pour ce provider'),
  nickname: z.string()
    .min(1, 'Le surnom est requis')
    .max(50, 'Le surnom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Le surnom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores'),
  model: z.string().min(1, 'Le modèle est requis'),
});

// ===== SYSTÈME DE NOTIFICATIONS =====
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

const NotificationSystem = ({ notifications, removeNotification }: {
  notifications: Array<NotificationProps & { id: string }>;
  removeNotification: (id: string) => void;
}) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    <AnimatePresence>
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className={`p-4 rounded-lg shadow-lg border max-w-sm ${
            notification.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-100' :
            notification.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-100' :
            notification.type === 'warning' ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100' :
            'bg-blue-900/90 border-blue-700 text-blue-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              {notification.type === 'error' && <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              <div>
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm opacity-90 mt-1">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-current opacity-70 hover:opacity-100 ml-2"
            >
              ×
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// Hook personnalisé pour les notifications
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  const addNotification = (notification: NotificationProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto-remove après la durée spécifiée
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, addNotification, removeNotification };
};

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
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    description:
      "Modèles GPT d'OpenAI avec des capacités avancées de raisonnement.",
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: GeminiLogo,
    models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com',
    description:
      'Modèles Google Gemini 2.5 Pro. Haute performance avec des capacités avancées.',
  },
  {
    id: 'qwen',
    name: 'Qwen (Tongyi Lab)',
    logo: QwenLogo,
    models: ['qwen3-coder-plus'],
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    description:
      "Qwen 3 Coder Plus d'Alibaba Cloud. Modèle spécialisé pour le développement logiciel.",
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: OpenRouterLogo,
    models: ['z-ai/glm-4.5-air:free'],
    baseUrl: 'https://openrouter.ai/api/v1',
    description:
      'OpenRouter avec modèle GLM-4.5 Air gratuit - Fonctionne parfaitement ✅',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    logo: OpenAILogo, // Using OpenAI logo as placeholder
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    baseUrl: 'https://api.anthropic.com/v1',
    description:
      "Modèles Claude d'Anthropic. Excellence en raisonnement et en compréhension.",
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    logo: OpenAILogo, // Using OpenAI logo as placeholder
    models: ['grok-4'],
    baseUrl: 'https://api.x.ai/v1',
    description: 'Grok-4 modèle avancé de xAI.',
  },
];

// PROVIDER DISPLAY NAMES
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  'google-flash': 'Google Gemini Flash',
  gemini: 'Gemini',
  google: 'Google Gemini',
  xai: 'xAI Grok',
  qwen: 'Qwen3 Coder',
  openrouter: 'OpenRouter',
};

// ===== INTELLIGENT ANALYTICS SYSTEM =====

// Smart Analytics Dashboard Component
const SmartAnalyticsDashboard: React.FC<{
  backendKeys?: BackendLlmApiKey[];
  systemHealth: SystemAnalytics;
  recommendations: SmartRecommendation[];
}> = ({
  backendKeys: _backendKeys,
  systemHealth,
  recommendations,
}) => {
  const criticalRecommendations = recommendations.filter(r => r.priority === 'high');
  const hasCriticalIssues = criticalRecommendations.length > 0;

  return (
    <motion.div
      className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* System Health Card */}
      <Card className={`col-span-1 lg:col-span-2 ${
        systemHealth.systemHealth > 80 ? 'border-green-500/50 bg-green-900/10' :
        systemHealth.systemHealth > 60 ? 'border-yellow-500/50 bg-yellow-900/10' :
        'border-red-500/50 bg-red-900/10'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className={`h-5 w-5 ${
              systemHealth.systemHealth > 80 ? 'text-green-400' :
              systemHealth.systemHealth > 60 ? 'text-yellow-400' : 'text-red-400'
            }`} />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Intelligence Artificielle du Système
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Santé Globale</span>
              <Badge className={`${
                systemHealth.systemHealth > 80 ? 'bg-green-900/50 text-green-300' :
                systemHealth.systemHealth > 60 ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-red-900/50 text-red-300'
              }`}>
                {systemHealth.systemHealth}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{systemHealth.totalRequests.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Requêtes Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{systemHealth.successfulRequests.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Réussites</div>
              </div>
            </div>

            {hasCriticalIssues && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-300 font-medium">
                    {criticalRecommendations.length} action(s) requise(s)
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="border-blue-500/50 bg-blue-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300">Métriques de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Temps de Réponse Moyen</span>
              <span className="text-lg font-bold text-blue-400">
                {systemHealth.averageResponseTime}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Clés Actives</span>
              <span className="text-lg font-bold text-green-400">
                {systemHealth.activeKeys}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Clés Dégradées</span>
              <span className={`text-lg font-bold ${
                systemHealth.degradedKeys > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {systemHealth.degradedKeys}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card className="border-purple-500/50 bg-purple-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-purple-400" />
            <span className="text-purple-300">Recommandations IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded text-xs ${
                  rec.priority === 'high' ? 'bg-red-900/20 border border-red-500/30' :
                  rec.priority === 'medium' ? 'bg-yellow-900/20 border border-yellow-500/30' :
                  'bg-green-900/20 border border-green-500/30'
                }`}
              >
                <div className="font-medium text-white">{rec.title}</div>
                <div className="text-gray-400 truncate">{rec.description}</div>
              </motion.div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-green-400">Système optimal</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Intelligent Key Health Monitor
const KeyHealthMonitor: React.FC<{ keyData: BackendLlmApiKey }> = ({ keyData }) => {
  const healthScore = useMemo(() => {
    // Calculate health score based on various metrics
    let score = 100;

    // Penalize for errors
    if (keyData.errorCount > 0) {
      score -= Math.min(keyData.errorCount * 5, 40);
    }

    // Penalize for old usage
    const daysSinceLastUse = keyData.lastUsed
      ? (Date.now() - keyData.lastUsed) / (1000 * 60 * 60 * 24)
      : 30;

    if (daysSinceLastUse > 7) {
      score -= Math.min(daysSinceLastUse - 7, 20);
    }

    return Math.max(0, Math.round(score));
  }, [keyData.errorCount, keyData.lastUsed]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/20';
    if (score >= 60) return 'bg-yellow-900/20';
    return 'bg-red-900/20';
  };

  return (
    <div className={`p-3 rounded-lg ${getHealthBg(healthScore)} border`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Santé de la Clé</span>
        <span className={`text-lg font-bold ${getHealthColor(healthScore)}`}>
          {healthScore}%
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            healthScore >= 80 ? 'bg-green-500' :
            healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${healthScore}%` }}
        />
      </div>
      {keyData.errorCount > 0 && (
        <div className="mt-2 text-xs text-red-400">
          {keyData.errorCount} erreur(s) détectée(s)
        </div>
      )}
    </div>
  );
};

// Smart Status Banner
const SmartStatusBanner: React.FC<{
  backendKeys?: BackendLlmApiKey[];
  systemHealth: SystemAnalytics;
  recommendations: SmartRecommendation[];
}> = ({
  backendKeys,
  systemHealth: _systemHealth,
  recommendations,
}) => {
  const llmApiKeys = useCombinedStore(
    (state: CombinedAppState) => state.llmApiKeys,
  );
  const hasKeys =
    (backendKeys && backendKeys.length > 0) || llmApiKeys.length > 0;
  const totalKeys = backendKeys ? backendKeys.length : llmApiKeys.length;
  const activeKeys = backendKeys
    ? backendKeys.filter((k) => !k.isPermanentlyDisabled).length
    : llmApiKeys.filter((k) => k.isActive).length;

  const criticalIssues = recommendations.filter(r => r.priority === 'high').length;

  return (
    <motion.div
      className={`mb-6 p-6 rounded-xl border-2 backdrop-blur-sm ${
        hasKeys && criticalIssues === 0
          ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50'
          : hasKeys && criticalIssues > 0
          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50'
          : 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-700/50'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {hasKeys && criticalIssues === 0 ? (
            <div className="bg-green-900/50 p-3 rounded-full border border-green-700/50">
              <Brain className="h-12 w-12 text-green-400" />
            </div>
          ) : hasKeys && criticalIssues > 0 ? (
            <div className="bg-yellow-900/50 p-3 rounded-full border border-yellow-700/50">
              <AlertTriangle className="h-12 w-12 text-yellow-400" />
            </div>
          ) : (
            <div className="bg-purple-900/50 p-3 rounded-full border border-purple-700/50">
              <Key className="h-12 w-12 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-bold ${
              hasKeys && criticalIssues === 0 ? 'text-green-300' :
              hasKeys && criticalIssues > 0 ? 'text-yellow-300' :
              'text-purple-300'
            }`}>
              {hasKeys
                ? `Gestionnaire LLM Intelligent - ${totalKeys} clé(s)`
                : 'Configuration des clés LLM'}
            </h1>
            <p className={`text-sm ${
              hasKeys && criticalIssues === 0 ? 'text-green-400/80' :
              hasKeys && criticalIssues > 0 ? 'text-yellow-400/80' :
              'text-purple-400/80'
            }`}>
              {hasKeys && criticalIssues === 0
                ? `Système optimal avec ${activeKeys} clés actives. IA surveille automatiquement les performances.`
                : hasKeys && criticalIssues > 0
                ? `${criticalIssues} problème(s) détecté(s). L'IA recommande des actions correctives.`
                : 'Ajoutez vos clés API pour bénéficier de l\'intelligence artificielle avancée'}
            </p>
          </div>
        </div>

        {hasKeys && (
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-cyan-400/80">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">Surveillance IA</span>
            </div>
            <div className="flex items-center space-x-2 text-green-400/80">
              <RotateCcw className="h-5 w-5" />
              <span className="text-sm font-medium">Rotation Auto</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-400/80">
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">Optimisation</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Composant Provider avec thème gothique professionnel
const SimpleProviderCard = ({
  provider,
  onNotification
}: {
  provider: LlmProviderConfig;
  onNotification: (notification: NotificationProps) => void;
}) => {
  const llmApiKeys = useCombinedStore(
    (state: CombinedAppState) => state.llmApiKeys,
  );
  const addLlmApiKey = useCombinedStore(
    (state: CombinedAppState) => state.addLlmApiKey,
  );
  const removeLlmApiKey = useCombinedStore(
    (state: CombinedAppState) => state.removeLlmApiKey,
  );
  const isAddingLlmApiKey = useCombinedStore(
    (state: CombinedAppState) => state.isAddingLlmApiKey,
  );
  const activeLlmApiKeyIndex = useCombinedStore(
    (state: CombinedAppState) => state.activeLlmApiKeyIndex,
  );
  const setActiveLlmApiKey = useCombinedStore(
    (state: CombinedAppState) => state.setActiveLlmApiKey,
  );

  const [apiKey, setApiKey] = useState('');
  const [nickname, setNickname] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const authToken = useCombinedStore(
    (state: CombinedAppState) => state.authToken,
  );

  const providerKeys = llmApiKeys.filter(
    (k: LlmApiKey) => k.provider === provider.id,
  );
  const hasKey = providerKeys.length > 0;
  const activeModel = hasKey ? providerKeys[0].model : provider.models[0];
  const keyData = hasKey ? providerKeys[0] : null;

  const isActive =
    hasKey && llmApiKeys[activeLlmApiKeyIndex]?.key === keyData?.key;

  useEffect(() => {
    if (keyData) {
      setApiKey(keyData.key || '');
      setNickname(keyData.nickname || '');
    }
  }, [keyData]);

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      onNotification({
        type: 'warning',
        title: 'Champ requis',
        message: 'Veuillez saisir une clé API avant de la tester.',
        duration: 4000,
      });
      return;
    }

    // Validation côté client
    const validation = apiKeyValidationSchema.safeParse({
      provider: provider.id,
      key: apiKey,
      nickname: nickname || `Test-${provider.name}`,
      model: provider.models[0],
    });

    if (!validation.success) {
      onNotification({
        type: 'error',
        title: 'Format invalide',
        message: validation.error.errors[0].message,
        duration: 5000,
      });
      return;
    }

    setTestStatus('testing');
    try {
      const result = await testLlmApiKey(
        provider.id,
        apiKey,
        provider.baseUrl,
        authToken,
        null,
      );
      if (result.success) {
        setTestStatus('success');
        onNotification({
          type: 'success',
          title: 'Test réussi',
          message: `Clé ${provider.name} validée avec succès${result.message ? `: ${result.message}` : ''}`,
          duration: 4000,
        });
      } else {
        setTestStatus('error');
        onNotification({
          type: 'error',
          title: 'Test échoué',
          message: result.message || 'La validation de la clé a échoué.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Test API Key failed', error);
      setTestStatus('error');
      onNotification({
        type: 'error',
        title: 'Erreur de test',
        message: error instanceof Error ? error.message : 'Erreur inconnue lors du test',
        duration: 5000,
      });
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
      const globalIndex = llmApiKeys.findIndex(
        (k: LlmApiKey) => k.key === key.key && k.provider === provider.id,
      );
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
        tags: [provider.models[0]],
      },
      provider: provider.id,
      key: apiKey,
      nickname: nickname,
      baseUrl: provider.baseUrl,
      model: provider.models[0],
    };
    await addLlmApiKey(newKey);

    // Refresh the backend keys display
    const authToken = useCombinedStore.getState().authToken;
    if (authToken) {
      try {
        const keys = await getLlmApiKeysApi(authToken, null);
        const backendKeysConverted: BackendLlmApiKey[] = keys.map((key) => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: key.usageStats?.failedRequests || 0,
          lastUsed: key.usageStats?.lastUsed
            ? new Date(key.usageStats.lastUsed).getTime()
            : undefined,
          priority: key.priority,
          isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10,
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
      const globalIndex = llmApiKeys.findIndex(
        (k: LlmApiKey) => k.key === key.key && k.provider === provider.id,
      );
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
    const globalIndex = llmApiKeys.findIndex(
      (k: LlmApiKey) => k.key === keyData?.key && k.provider === provider.id,
    );
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
      <Card
        className={`overflow-hidden transition-all duration-300 h-full flex flex-col
        bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700
        shadow-xl hover:shadow-2xl hover:border-purple-500/50
        ${isActive ? 'ring-2 ring-green-500/50' : hasKey ? 'ring-2 ring-purple-500/30' : ''}`}
      >
        <CardContent className="p-6 flex-grow flex flex-col">
          {/* En-tête de la carte avec logo et informations */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-800 p-2 rounded-lg border border-gray-600">
                <Logo className="h-10 w-10 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-white">
                    {provider.name}
                  </h3>
                  {isActive && (
                    <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  {provider.description}
                </p>
                {hasKey && keyData && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50 text-xs">
                      <Zap className="h-3 w-3 mr-1 inline" />
                      Modèle: {activeModel}
                    </Badge>
                    <Badge className="bg-gray-700/50 text-gray-300 border border-gray-600 text-xs">
                      <Calendar className="h-3 w-3 mr-1 inline" />
                      Ajoutée le:{' '}
                      {new Date(keyData.createdAt).toLocaleDateString()}
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
                Modèle{provider.models.length > 1 ? 's' : ''} disponible
                {provider.models.length > 1 ? 's' : ''}
              </h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-400">
                  Modèle principal utilisé:
                </div>
                <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50">
                  {provider.models[0]}
                </Badge>
                {provider.models.length > 1 && (
                  <>
                    <div className="text-xs text-gray-400 mt-3">
                      Autres modèles supportés:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {provider.models.slice(1).map((model) => (
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
              <label
                htmlFor={`nickname-field-${provider.id}`}
                className="block text-sm font-medium text-gray-300"
              >
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
              <label
                htmlFor={`api-key-field-${provider.id}`}
                className="block text-sm font-medium text-gray-300"
              >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="h-7 w-7 text-gray-400 hover:text-white"
                  >
                    {isKeyVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 text-gray-400 hover:text-white"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex space-x-2">
                {hasKey && !isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetActive}
                    className="border-green-500/50 text-green-400 hover:bg-green-900/30 hover:text-green-300"
                  >
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
                  {testStatus === 'testing' && (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  )}
                  {testStatus === 'success' && (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {testStatus === 'error' && (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {testStatus === 'idle' && 'Tester'}
                  {testStatus === 'testing' && 'Test...'}
                  {testStatus === 'success' && 'Valide'}
                  {testStatus === 'error' && 'Échec'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    isAddingLlmApiKey || !apiKey.trim() || !nickname.trim()
                  }
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



export const LlmApiKeyManagementPage = memo(() => {
  const authToken = useCombinedStore(
    (state: CombinedAppState) => state.authToken,
  );
  const [backendKeys, setBackendKeys] = useState<BackendLlmApiKey[]>([]);
  const [masterKey, setMasterKey] = useState<LlmApiKey | null>(null);
  const [testingKey, setTestingKey] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [smartRotationEnabled, setSmartRotationEnabled] = useState(true);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(true);

  // Intelligent Analytics State
  const [systemHealth, setSystemHealth] = useState<SystemAnalytics>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeKeys: 0,
    degradedKeys: 0,
    systemHealth: 100,
  });

  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);

  // Système de notifications
  const { notifications, addNotification, removeNotification } = useNotifications();

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
          console.warn('Failed to fetch master key:', error);
        }

        setMasterKey(masterKeyData);

        // Convert LlmApiKey[] to BackendLlmApiKey[]
        const backendKeysConverted: BackendLlmApiKey[] = keys.map((key) => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: key.usageStats?.failedRequests || 0,
          lastUsed: key.usageStats?.lastUsed
            ? new Date(key.usageStats.lastUsed).getTime()
            : undefined,
          priority: key.priority,
          isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10, // Mark as disabled if too many errors
        }));

        setBackendKeys(backendKeysConverted);
        console.log('🔑 Backend keys loaded:', keys);
      } catch (error) {
        console.error('Failed to load backend keys:', error);
      }
    };

    loadBackendKeys();
  }, [authToken]);

  // Fonction pour tester une clé LLM avec gestion d'erreurs améliorée
  const testKey = async (keyIndex: number) => {
    if (!authToken) {
      addNotification({
        type: 'error',
        title: 'Authentification requise',
        message: 'Token d\'authentification manquant. Vérifiez votre configuration.',
        duration: 6000,
      });
      return;
    }

    setTestingKey(keyIndex);
    try {
      const keyToTest = backendKeys[keyIndex];
      if (!keyToTest) throw new Error('Clé introuvable');

      // Validation côté client avant le test
      const validation = apiKeyValidationSchema.safeParse({
        provider: keyToTest.apiProvider,
        key: keyToTest.apiKey,
        nickname: `Test-${keyToTest.apiProvider}`,
        model: keyToTest.apiModel || 'default',
      });

      if (!validation.success) {
        throw new Error(`Format de clé invalide: ${validation.error.errors[0].message}`);
      }

      // Use the existing testLlmApiKey function
      const result = await testLlmApiKey(
        keyToTest.apiProvider,
        keyToTest.apiKey,
        keyToTest.baseUrl || undefined,
        authToken,
        null,
      );

      if (result.success) {
        // Reload keys to see updates
        const keys = await getLlmApiKeysApi(authToken, null);
        const backendKeysConverted: BackendLlmApiKey[] = keys.map((key) => ({
          apiKey: key.key || '',
          apiModel: key.model || '',
          apiProvider: key.provider || '',
          baseUrl: key.baseUrl,
          errorCount: key.usageStats?.failedRequests || 0,
          lastUsed: key.usageStats?.lastUsed
            ? new Date(key.usageStats.lastUsed).getTime()
            : undefined,
          priority: key.priority,
          isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10,
        }));
        setBackendKeys(backendKeysConverted);

        addNotification({
          type: 'success',
          title: 'Test réussi',
          message: `Clé ${keyToTest.apiProvider} validée avec succès${result.message ? `: ${result.message}` : ''}`,
          duration: 4000,
        });
      } else {
        throw new Error(result.message || 'Échec de la validation de la clé');
      }
    } catch (error) {
      console.error(`❌ Key test failed for ${keyIndex}:`, error);

      addNotification({
        type: 'error',
        title: 'Échec du test',
        message: error instanceof Error ? error.message : 'Erreur inconnue lors du test',
        duration: 6000,
      });
    } finally {
      setTestingKey(null);
    }
  };

  // Fonction de rafraîchissement des données
  const refreshData = async () => {
    if (!authToken) return;

    setIsRefreshing(true);
    try {
      // Recharger les clés du backend
      const keys = await getLlmApiKeysApi(authToken, null);
      const backendKeysConverted: BackendLlmApiKey[] = keys.map((key) => ({
        apiKey: key.key || '',
        apiModel: key.model || '',
        apiProvider: key.provider || '',
        baseUrl: key.baseUrl,
        errorCount: key.usageStats?.failedRequests || 0,
        lastUsed: key.usageStats?.lastUsed
          ? new Date(key.usageStats.lastUsed).getTime()
          : undefined,
        priority: key.priority,
        isPermanentlyDisabled: (key.usageStats?.failedRequests || 0) > 10,
      }));
      setBackendKeys(backendKeysConverted);

      // Recharger la clé maître
      try {
        const masterKeyData = await getMasterLlmApiKeyApi(authToken, null);
        setMasterKey(masterKeyData);
      } catch (error) {
        console.warn('Failed to refresh master key:', error);
      }

      addNotification({
        type: 'success',
        title: 'Données actualisées',
        message: 'Les clés API ont été rechargées avec succès.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      addNotification({
        type: 'error',
        title: 'Erreur de rafraîchissement',
        message: 'Impossible de recharger les données. Veuillez réessayer.',
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Intelligent Analytics Calculation
  useEffect(() => {
    // Calculate system health and recommendations based on backend keys
    const calculateAnalytics = () => {
      const totalKeys = backendKeys.length;
      const activeKeys = backendKeys.filter(k => !k.isPermanentlyDisabled).length;
      const degradedKeys = backendKeys.filter(k => k.errorCount > 5).length;

      // Calculate system health score
      let healthScore = 100;
      if (degradedKeys > 0) healthScore -= degradedKeys * 15;
      if (activeKeys === 0 && totalKeys > 0) healthScore = 20;
      if (totalKeys === 0) healthScore = 0;

      const newSystemHealth: SystemAnalytics = {
        totalRequests: backendKeys.reduce((sum, k) => sum + (k.errorCount || 0), 0),
        successfulRequests: backendKeys.reduce((sum, k) => sum + Math.max(0, (k.errorCount || 0) - 2), 0),
        failedRequests: backendKeys.reduce((sum, k) => sum + (k.errorCount || 0), 0),
        averageResponseTime: 150, // Mock value - would be calculated from real metrics
        activeKeys,
        degradedKeys,
        systemHealth: Math.max(0, healthScore),
      };

      setSystemHealth(newSystemHealth);

      // Generate smart recommendations
      const newRecommendations: SmartRecommendation[] = [];

      if (degradedKeys > 0) {
        newRecommendations.push({
          type: 'rotate',
          priority: 'high',
          title: 'Rotation de Clés Requise',
          description: `${degradedKeys} clé(s) dégradée(s) détectée(s)`,
          action: 'Faire tourner les clés défaillantes',
        });
      }

      if (activeKeys === 0 && totalKeys > 0) {
        newRecommendations.push({
          type: 'disable',
          priority: 'high',
          title: 'Aucune Clé Active',
          description: 'Toutes les clés sont désactivées',
          action: 'Activer au moins une clé',
        });
      }

      if (totalKeys === 0) {
        newRecommendations.push({
          type: 'monitor',
          priority: 'medium',
          title: 'Configuration Requise',
          description: 'Aucune clé API configurée',
          action: 'Ajouter votre première clé API',
        });
      }

      // Check for old/unused keys
      const oldKeys = backendKeys.filter(k => {
        const daysSinceLastUse = k.lastUsed
          ? (Date.now() - k.lastUsed) / (1000 * 60 * 60 * 24)
          : 30;
        return daysSinceLastUse > 30;
      });

      if (oldKeys.length > 0) {
        newRecommendations.push({
          type: 'optimize',
          priority: 'low',
          title: 'Optimisation Disponible',
          description: `${oldKeys.length} clé(s) inutilisée(s) depuis plus de 30 jours`,
          action: 'Considérer la suppression des clés inutiles',
        });
      }

      setRecommendations(newRecommendations);
    };

    calculateAnalytics();
  }, [backendKeys]);

  // Filtered keys based on search and filters
  const filteredKeys = useMemo(() => {
    return backendKeys.filter(key => {
      const matchesSearch = searchTerm === '' ||
        key.apiProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.apiModel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProvider = selectedProvider === 'all' || key.apiProvider === selectedProvider;
      const matchesStatus = showInactive || !key.isPermanentlyDisabled;

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [backendKeys, searchTerm, selectedProvider, showInactive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Système de notifications */}
      <NotificationSystem
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Intelligent Status Banner */}
      <SmartStatusBanner
        backendKeys={backendKeys}
        systemHealth={systemHealth}
        recommendations={recommendations}
      />

      {/* Smart Analytics Dashboard */}
      {backendKeys.length > 0 && (
        <SmartAnalyticsDashboard
          backendKeys={backendKeys}
          systemHealth={systemHealth}
          recommendations={recommendations}
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

      {/* Smart Filters and Search */}
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

            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
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
              <label htmlFor="smart-rotation" className="text-sm text-gray-300 flex items-center gap-2">
                <RotateCcw className={`h-4 w-4 ${smartRotationEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                Rotation intelligente
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="auto-optimization"
                checked={autoOptimizationEnabled}
                onCheckedChange={setAutoOptimizationEnabled}
              />
              <label htmlFor="auto-optimization" className="text-sm text-gray-300 flex items-center gap-2">
                <Target className={`h-4 w-4 ${autoOptimizationEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
                Optimisation auto
              </label>
            </div>

            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Intelligent Key Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <AnimatePresence>
          {filteredKeys.map((key, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Card className={`overflow-hidden transition-all duration-300 h-full group hover:scale-105 ${
                index === 0 ? 'ring-2 ring-green-500/50 shadow-green-500/20 shadow-lg' :
                key.isPermanentlyDisabled ? 'ring-2 ring-red-500/30 opacity-75' :
                'ring-1 ring-gray-700/50 hover:ring-purple-500/30'
              }`}>
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Enhanced Header with Better Design */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        key.isPermanentlyDisabled ? 'bg-red-900/50' :
                        index === 0 ? 'bg-green-900/50 shadow-green-500/30 shadow-lg' :
                        'bg-gradient-to-br from-cyan-900/50 to-purple-900/50 group-hover:shadow-lg group-hover:shadow-purple-500/20'
                      }`}>
                        {key.apiProvider === 'openai' && <OpenAILogo className="h-7 w-7 text-white" />}
                        {key.apiProvider === 'gemini' && <GeminiLogo className="h-7 w-7 text-white" />}
                        {key.apiProvider === 'qwen' && <QwenLogo className="h-7 w-7 text-white" />}
                        {key.apiProvider === 'openrouter' && <OpenRouterLogo className="h-7 w-7 text-white" />}
                        {!['openai', 'gemini', 'qwen', 'openrouter'].includes(key.apiProvider) && (
                          <Key className="h-7 w-7 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-white">
                            {PROVIDER_DISPLAY_NAMES[key.apiProvider] || key.apiProvider}
                          </h3>
                          {index === 0 && (
                            <Badge className="bg-green-900/50 text-green-300 border border-green-700/50 animate-pulse">
                              <Star className="h-3 w-3 mr-1" />
                              ACTIVE
                            </Badge>
                          )}
                          {key.isPermanentlyDisabled && (
                            <Badge className="bg-red-900/50 text-red-300 border border-red-700/50">
                              <XCircle className="h-3 w-3 mr-1" />
                              DISABLED
                            </Badge>
                          )}
                          {smartRotationEnabled && !key.isPermanentlyDisabled && (
                            <Badge className="bg-blue-900/50 text-blue-300 border border-blue-700/50">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              SMART
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{key.apiModel}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`h-2 w-2 rounded-full ${
                            key.isPermanentlyDisabled ? 'bg-red-500' :
                            index === 0 ? 'bg-green-500 animate-pulse' :
                            'bg-yellow-500'
                          }`} />
                          <span className="text-xs text-gray-500">
                            {key.isPermanentlyDisabled ? 'Hors service' :
                             index === 0 ? 'En production' :
                             'En attente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-900/30">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem onClick={() => testKey(index)} className="hover:bg-purple-900/30">
                          <TestTube className="h-4 w-4 mr-2" />
                          Tester la clé
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-purple-900/30">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:bg-red-900/30">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Intelligent Health Monitor */}
                  <KeyHealthMonitor keyData={key} />

                  {/* Key Details */}
                  <div className="flex-grow space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Utilisation:</span>
                      <span className="text-white font-medium">
                        {key.errorCount || 0}
                      </span>
                    </div>

                    {key.lastUsed && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Dernière utilisation:</span>
                        <span className="text-white font-medium">
                          {new Date(key.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {key.errorCount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Erreurs:</span>
                        <span className="text-red-400 font-medium">
                          {key.errorCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="space-y-3 mt-4">
                    {/* Primary Action Row */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testKey(index)}
                        disabled={testingKey === index}
                        className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                      >
                        {testingKey === index ? (
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Tester
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 transition-all duration-200 ${
                          key.isPermanentlyDisabled
                            ? 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                            : 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                      >
                        {key.isPermanentlyDisabled ? (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copier
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20 transition-all duration-200"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Stats
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-gray-400 hover:text-green-400 hover:bg-green-900/20 transition-all duration-200"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Config
                      </Button>
                    </div>

                    {/* Smart Features Row */}
                    {smartRotationEnabled && !key.isPermanentlyDisabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-500/30"
                      >
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-purple-300">Rotation intelligente active</span>
                        </div>
                        <Badge className="bg-green-900/50 text-green-300 text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          AUTO
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredKeys.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Brain className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {backendKeys.length === 0 ? 'Aucune clé configurée' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-400 mb-6">
            {backendKeys.length === 0
              ? 'Ajoutez votre première clé API pour commencer à utiliser l\'IA intelligente'
              : 'Aucune clé ne correspond à vos critères de recherche'
            }
          </p>
          {backendKeys.length === 0 && (
            <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Première Clé
            </Button>
          )}
        </motion.div>
      )}

      {/* Smart Recommendations Panel */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Target className="h-5 w-5" />
                Recommandations Intelligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      rec.priority === 'high' ? 'bg-red-900/20 border-red-500/30' :
                      rec.priority === 'medium' ? 'bg-yellow-900/20 border-yellow-500/30' :
                      'bg-green-900/20 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-white">{rec.title}</h4>
                          <Badge className={`${
                            rec.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                            rec.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-green-900/50 text-green-300'
                          }`}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{rec.description}</p>
                        <p className="text-cyan-400 text-sm font-medium">{rec.action}</p>
                      </div>
                      <Button
                        size="sm"
                        className={`ml-4 ${
                          rec.priority === 'high'
                            ? 'bg-red-600 hover:bg-red-500'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-600 hover:bg-yellow-500'
                            : 'bg-green-600 hover:bg-green-500'
                        }`}
                      >
                        <Lightning className="h-4 w-4 mr-2" />
                        Action
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enhanced Footer Stats with Smart Features Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 space-y-4"
      >
        {/* Smart Features Status */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            smartRotationEnabled
              ? 'bg-green-900/30 text-green-300 border border-green-700/50'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
          }`}>
            <RotateCcw className={`h-3 w-3 ${smartRotationEnabled ? 'animate-spin' : ''}`} />
            <span>Rotation Intelligente</span>
            <div className={`h-2 w-2 rounded-full ${
              smartRotationEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`} />
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            autoOptimizationEnabled
              ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
          }`}>
            <Target className={`h-3 w-3 ${autoOptimizationEnabled ? 'animate-pulse' : ''}`} />
            <span>Optimisation Auto</span>
            <div className={`h-2 w-2 rounded-full ${
              autoOptimizationEnabled ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
            }`} />
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
              <Lightning className="h-4 w-4 text-yellow-400" />
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

      {/* Master Key Display */}
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
        <div className="mt-2 text-xs text-yellow-400/70">
          Pour configurer une clé maîtresse, ajoutez
          LLM_API_KEY=valeur_de_votre_clé dans votre fichier .env
        </div>
      </motion.div>

      {/* User Keys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Key className="h-5 w-5 mr-2 text-purple-400" />
            Clés API configurées
          </h2>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-900/30"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
        {backendKeys.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <Key className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-300">
                Aucune clé API ajoutée
              </h3>
              <p className="mt-2 text-gray-500">
                Ajoutez votre première clé API pour commencer à utiliser
                différents fournisseurs LLM.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {backendKeys.map((key, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/50'
                    : key.isPermanentlyDisabled
                      ? 'bg-gradient-to-r from-red-900/30 to-rose-900/30 border-red-600/50'
                      : 'bg-gray-700/50 border-gray-600/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="flex items-center space-x-2">
                    {index === 0 && (
                      <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                        <Zap className="h-3 w-3 mr-1" />
                        ACTIVE
                      </Badge>
                    )}
                    {key.isPermanentlyDisabled && index !== 0 && (
                      <Badge className="bg-red-900/50 text-red-300 border border-red-700/50">
                        <XCircle className="h-3 w-3 mr-1" />
                        DÉSACTIVÉE
                      </Badge>
                    )}
                    {key.priority && (
                      <Badge className="bg-blue-900/50 text-blue-300 border border-blue-700/50">
                        <Settings className="h-3 w-3 mr-1" />
                        Priorité: {key.priority}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-purple-900/50 text-purple-300 border border-purple-700/50">
                      {key.apiProvider}
                    </Badge>
                    <span className="text-white font-medium">
                      {key.apiModel || 'Modèle par défaut'}
                    </span>
                    <span className="text-gray-400 text-sm truncate max-w-xs">
                      Clé: {key.apiKey?.substring(0, 8)}...
                      {key.apiKey?.substring(key.apiKey.length - 4)}
                    </span>
                    {key.baseUrl && (
                      <span className="text-blue-400 text-xs">
                        {new URL(key.baseUrl).hostname}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                  {key.lastUsed && (
                    <Badge className="bg-green-900/50 text-green-300 border border-green-700/50 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(key.lastUsed).toLocaleDateString()}
                    </Badge>
                  )}
                  {key.errorCount > 0 && (
                    <Badge
                      className={`${key.errorCount > 5 ? 'bg-red-900/50 text-red-300 border-red-700/50' : 'bg-orange-900/50 text-orange-300 border-orange-700/50'} text-xs`}
                    >
                      Erreurs: {key.errorCount}
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
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Settings className="h-6 w-6 mr-3 text-purple-400" />
          Fournisseurs disponibles
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {PROVIDERS.map((provider) => (
             <SimpleProviderCard
               key={provider.id}
               provider={provider}
               onNotification={addNotification}
             />
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
              <span>
                Vous pouvez configurer plusieurs providers pour une redondance
                automatique
              </span>
            </li>
            <li className="flex items-start">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>
                En cas d\'erreur sur une clé, le système bascule automatiquement
                vers la suivante selon la hiérarchie
              </span>
            </li>
            <li className="flex items-start">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>
                Les clés sont stockées de manière sécurisée et chiffrées
                localement
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
