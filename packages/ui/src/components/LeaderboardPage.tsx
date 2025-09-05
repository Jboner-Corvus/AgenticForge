import { BarChart, Clock, Sparkles, CheckCircle, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import {
  OpenAILogo,
  AnthropicLogo,
  GeminiLogo,
  OpenRouterLogo,
} from './icons/LlmLogos';
import { AnimatePresence, motion } from 'framer-motion';
import { useCombinedStore } from '../store';
import { useLLMKeysStore, LLMKey } from '../store/llmKeysStore';
// Removed unused import LlmApiKey
import { Button } from './ui/button';
import { getLeaderboardStats } from '../lib/api';

type ApiKeyUsage = LLMKey & {
  rank: number;
  keyMask: string;
};

// PROVIDER DISPLAY MAPPING
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  'google-flash': 'Google Gemini Flash',
  'google-pro': 'Google Gemini Pro',
  gemini: 'Google Gemini',
  google: 'Google Gemini',
  xai: 'xAI Grok',
  qwen: 'Qwen3 Coder',
  openrouter: 'OpenRouter',
  unknown: 'Unknown Provider',
};

const getProviderVisuals = (providerId: string, fallbackName?: string) => {
  const providerKey = providerId?.toLowerCase() || 'unknown';
  
  const visuals: Record<
    string,
    { Logo: React.FC<{ className?: string }>; color: string; name: string }
  > = {
    openai: { Logo: OpenAILogo, color: 'bg-green-500', name: 'OpenAI' },
    anthropic: {
      Logo: AnthropicLogo,
      color: 'bg-purple-500',
      name: 'Anthropic Claude',
    },
    google: { Logo: GeminiLogo, color: 'bg-blue-500', name: 'Google Gemini' },
    'google-flash': { Logo: GeminiLogo, color: 'bg-blue-400', name: 'Google Gemini Flash' },
    'google-pro': { Logo: GeminiLogo, color: 'bg-blue-600', name: 'Google Gemini Pro' },
    gemini: { Logo: GeminiLogo, color: 'bg-blue-500', name: 'Google Gemini' },
    xai: { 
      Logo: () => <div className="text-green-400 font-bold text-lg">𝕏</div>, 
      color: 'bg-green-500', 
      name: 'xAI Grok' 
    },
    qwen: { 
      Logo: () => <div className="text-blue-400 font-bold">Q</div>, 
      color: 'bg-blue-500', 
      name: 'Qwen3 Coder' 
    },
    openrouter: {
      Logo: OpenRouterLogo,
      color: 'bg-pink-500',
      name: 'OpenRouter',
    },
  };
  
  return visuals[providerKey] || {
    Logo: () => (
      <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center text-xs font-bold text-gray-300">
        {providerKey.charAt(0).toUpperCase()}
      </div>
    ),
    color: 'bg-gray-500',
    name: PROVIDER_DISPLAY_NAMES[providerKey] || fallbackName || 'Unknown Provider',
  };
};

// --- Main Component ---
export const LeaderboardPage = memo(() => {
  const [leaderboardData, setLeaderboardData] = useState<ApiKeyUsage[]>([]);
  const [leaderboardStats, setLeaderboardStats] = useState<{
    tokensSaved: number;
    successfulRuns: number;
    sessionsCreated: number;
    apiKeysAdded: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use the correct LLM keys store
  const { keys: llmApiKeys, isLoading: _isLoadingKeys, fetchKeys } = useLLMKeysStore();
  const isLoadingLeaderboardStats = useCombinedStore(
    (state) => state.isLoadingLeaderboardStats,
  );
  const authToken = useCombinedStore((state) => state.authToken);
  const sessionId = useCombinedStore((state) => state.sessionId);

  // Function to refresh leaderboard data
  const refreshLeaderboardData = async () => {
    if (!authToken || !sessionId) return;

    setIsRefreshing(true);
    try {
      setError(null);
      const stats = await getLeaderboardStats(authToken, sessionId);
      setLeaderboardStats(stats);
    } catch (err) {
      console.error('Failed to refresh leaderboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load LLM keys when component mounts
  useEffect(() => {
    const loadKeys = async () => {
      if (authToken && sessionId) {
        try {
          await fetchKeys();
        } catch (error) {
          console.warn('Failed to load LLM keys in leaderboard:', error);
        }
      }
    };

    loadKeys();
  }, [authToken, sessionId, fetchKeys]);

  // Fetch real leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!authToken || !sessionId) return;

      try {
        setError(null);

        // Fetch real leaderboard stats from API
        const stats = await getLeaderboardStats(authToken, sessionId);
        setLeaderboardStats(stats);

        // Create leaderboard data based on actual API keys with enhanced masking
        const getMaskedKey = (keyValue: string, providerId: string): string => {
          if (!keyValue) return 'No Key';
          
          const maskingRules: Record<string, { start: number; end: number }> = {
            openai: { start: 7, end: 6 },
            anthropic: { start: 8, end: 6 },
            google: { start: 6, end: 6 },
            'google-flash': { start: 6, end: 6 },
            'google-pro': { start: 6, end: 6 },
            gemini: { start: 6, end: 6 },
            xai: { start: 8, end: 6 },
            qwen: { start: 4, end: 4 },
            openrouter: { start: 8, end: 6 },
            default: { start: 4, end: 4 },
          };
          
          const rule = maskingRules[providerId] || maskingRules.default;
          
          if (keyValue.length <= rule.start + rule.end) {
            return `${keyValue.charAt(0)}${'*'.repeat(Math.max(1, keyValue.length - 2))}${keyValue.charAt(keyValue.length - 1)}`;
          }
          
          const start = keyValue.substring(0, rule.start);
          const end = keyValue.substring(keyValue.length - rule.end);
          const middle = '*'.repeat(Math.max(3, keyValue.length - rule.start - rule.end));
          
          return `${start}${middle}${end}`;
        };

        const apiKeyData: ApiKeyUsage[] = llmApiKeys.map((key: LLMKey, index: number) => ({
          ...key,
          keyMask: getMaskedKey(key.keyValue || '', key.providerId),
          rank: index + 1,
        }));

        setLeaderboardData(apiKeyData);
      } catch (err) {
        console.error('Failed to fetch leaderboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');

        // Fallback to mock data if API fails with enhanced masking
        const getMaskedKeyFallback = (keyValue: string): string => {
          if (!keyValue) return 'No Key';
          const start = Math.min(4, keyValue.length - 4);
          const end = 4;
          return keyValue.length > start + end
            ? `${keyValue.substring(0, start)}${'*'.repeat(Math.max(3, keyValue.length - start - end))}${keyValue.substring(keyValue.length - end)}`
            : `${keyValue.charAt(0)}${'*'.repeat(Math.max(1, keyValue.length - 2))}${keyValue.charAt(keyValue.length - 1)}`;
        };

        const mockData: ApiKeyUsage[] = llmApiKeys.map((key: LLMKey, index: number) => ({
          ...key,
          keyMask: getMaskedKeyFallback(key.keyValue || ''),
          rank: index + 1,
        }));
        setLeaderboardData(mockData);
      }
    };

    fetchLeaderboardData();
  }, [authToken, sessionId, llmApiKeys]);

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoadingLeaderboardStats) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Sparkles className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Error Loading Leaderboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Showing cached data if available, or mock data for demonstration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="p-6 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
           <div className="flex items-center mb-4 sm:mb-0">
             <BarChart className="mr-3 h-8 w-8 text-primary" />
             <h2 className="text-3xl font-bold">API Key Leaderboard</h2>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <Clock className="h-4 w-4" />
               <span>Resets in: {timeLeft}</span>
             </div>
             <Button
               onClick={refreshLeaderboardData}
               disabled={isRefreshing || !authToken || !sessionId}
               variant="outline"
               size="sm"
               className="flex items-center gap-2"
             >
               <TrendingUp className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
               {isRefreshing ? 'Refreshing...' : 'Refresh'}
             </Button>
           </div>
         </div>

        {/* Statistics Cards */}
        {leaderboardStats && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <motion.div
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Tokens Saved</p>
                    <p className="text-2xl font-bold">{leaderboardStats.tokensSaved.toLocaleString()}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-200" />
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Successful Runs</p>
                    <p className="text-2xl font-bold">{leaderboardStats.successfulRuns.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Sessions Created</p>
                    <p className="text-2xl font-bold">{leaderboardStats.sessionsCreated.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">API Keys Added</p>
                    <p className="text-2xl font-bold">{leaderboardStats.apiKeysAdded.toLocaleString()}</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-200" />
                </div>
              </motion.div>
            </div>

            {/* Enhanced Additional Info */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    <strong>Performance Insights:</strong> {llmApiKeys.length} API key{llmApiKeys.length !== 1 ? 's' : ''} configured • 
                    {llmApiKeys.filter(k => k.isActive).length} active
                    {leaderboardStats.successfulRuns > 0 && (
                      <span className="ml-2">
                        • Success rate: {((leaderboardStats.successfulRuns / Math.max(1, leaderboardStats.successfulRuns + leaderboardStats.sessionsCreated)) * 100).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
                {llmApiKeys.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Providers: {Array.from(new Set(llmApiKeys.map(k => k.providerId))).join(', ')} • 
                    Total usage: {llmApiKeys.reduce((sum, k) => sum + (k.usageCount || 0), 0).toLocaleString()} requests
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {leaderboardData.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No API Keys Found</h3>
            <p className="mt-2 text-muted-foreground">
              Please add API keys in the LLM API Key Management section to see
              leaderboard stats.
            </p>
            <Button
              onClick={() => window.location.hash = '#llm-keys'}
              className="mt-4"
              variant="outline"
            >
              Go to Key Management
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6"
                  >
                    Rang
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                  >
                    Fournisseur
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                  >
                    Surnom
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                  >
                    Requêtes
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                  >
                    Tokens
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                  >
                    Statut
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-background/50">
                {leaderboardData.map((key, index) => {
                  const { Logo, color, name } = getProviderVisuals(
                    key.providerId,
                    key.providerName,
                  );
                  const isMasterKey =
                    key.keyName === 'Master Key (.env)' ||
                    key.id === 'master-key';

                  return (
                    <tr
                      key={key.id || index}
                      className={`hover:bg-gray-800/50 transition-colors ${isMasterKey ? 'bg-yellow-900/10' : ''}`}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                        <div className="flex items-center">
                          <Badge
                            className={`text-lg font-bold ${color} text-white`}
                          >
                            #{key.rank}
                          </Badge>
                          {isMasterKey && (
                            <Shield className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <Logo className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{name}</span>
                            <span className="text-xs text-gray-400">ID: {key.providerId}</span>
                          </div>
                          {isMasterKey && (
                            <Badge className="ml-2 bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                              <Shield className="h-3 w-3 mr-1" />
                              Master
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">{key.keyName}</span>
                          <span className="text-xs text-gray-400 font-mono">{key.keyMask}</span>
                          {isMasterKey && (
                            <div className="text-xs text-yellow-500/80 mt-1">
                              From Environment
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {key.usageStats?.totalRequests?.toLocaleString() || key.usageCount?.toLocaleString() || '0'}
                          </span>
                          {key.usageStats && (
                            <span className="text-xs text-gray-400">
                              {key.usageStats.failedRequests > 0 ? `${key.usageStats.failedRequests} failed` : 'All success'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {key.usageStats?.successfulRequests?.toLocaleString() || '0'}
                          </span>
                          {key.usageStats && key.usageStats.totalRequests > 0 && (
                            <span className="text-xs text-gray-400">
                              {Math.round((key.usageStats.successfulRequests / key.usageStats.totalRequests) * 100)}% success
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex flex-col gap-1">
                          {key.isActive ? (
                            <Badge className="bg-green-900/50 text-green-300 border border-green-700/50 w-fit">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-700/50 text-gray-300 border border-gray-600 w-fit">
                              Inactive
                            </Badge>
                          )}
                          {isMasterKey && (
                            <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50 w-fit">
                              <Shield className="h-3 w-3 mr-1" />
                              Master
                            </Badge>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            P{key.priority} • {key.usageCount || 0} uses
                          </div>
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {/* Espace pour les futurs boutons d'action */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
