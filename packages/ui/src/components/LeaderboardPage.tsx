import { BarChart, Clock, Sparkles, CheckCircle, Shield } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { OpenAILogo, AnthropicLogo, GeminiLogo, OpenRouterLogo } from './icons/LlmLogos';
import { AnimatePresence, motion } from 'framer-motion';
import { useCombinedStore } from '../store';
import { LlmApiKey } from '../store/types';

type ApiKeyUsage = LlmApiKey & {
  rank: number;
  keyMask: string;
};

const getProviderVisuals = (provider: LlmApiKey['providerName']) => {
    if (!provider) {
        return { Logo: Sparkles, color: 'bg-gray-500', name: 'Unknown' };
    }
    const visuals: Record<string, { Logo: React.FC<{ className?: string }>; color: string; name: string }> = {
      openai: { Logo: OpenAILogo, color: 'bg-green-500', name: 'OpenAI' },
      anthropic: { Logo: AnthropicLogo, color: 'bg-purple-500', name: 'Anthropic' },
      google: { Logo: GeminiLogo, color: 'bg-blue-500', name: 'Google Gemini' },
      openrouter: { Logo: OpenRouterLogo, color: 'bg-pink-500', name: 'OpenRouter' },
    };
    return visuals[provider] || { Logo: Sparkles, color: 'bg-gray-500', name: 'Unknown' };
};

// --- Main Component ---
export const LeaderboardPage = memo(() => {
  const [leaderboardData, setLeaderboardData] = useState<ApiKeyUsage[]>([]);
  const llmApiKeys = useCombinedStore((state) => state.llmApiKeys);
  const isLoadingLeaderboardStats = useCombinedStore((state) => state.isLoadingLeaderboardStats);
  const authToken = useCombinedStore((state) => state.authToken);
  const sessionId = useCombinedStore((state) => state.sessionId);
  const activeLlmApiKeyIndex = useCombinedStore((state) => state.activeLlmApiKeyIndex);

  // Generate mock data based on actual leaderboard stats and API keys
  useEffect(() => {
    if (!authToken || !sessionId) return;
    
    // Create mock data based on the actual API keys
    const mockData: ApiKeyUsage[] = llmApiKeys.map((key, index) => ({
      ...key,
      keyMask: key.keyValue ? `${key.keyValue?.substring(0, 8)}...${key.keyValue?.substring(key.keyValue.length - 4)}` : 'No Key',
      rank: index + 1
    }));
    
    setLeaderboardData(mockData);
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
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Resets in: {timeLeft}</span>
          </div>
        </div>

        {llmApiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">No API Keys Found</h3>
            <p className="mt-2 text-muted-foreground">
              Please add API keys in the LLM API Key Management section to see leaderboard stats.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Rang</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Fournisseur</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Surnom</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Requêtes</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Tokens</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Statut</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-background/50">
                {leaderboardData.map((key, index) => {
                  const { Logo, color, name } = getProviderVisuals(key.providerName);
                  const isActive = llmApiKeys[activeLlmApiKeyIndex]?.key === key.keyValue;
                  const isMasterKey = key.keyName === 'Master Key (.env)' || key.id === 'master-key';
                  
                  return (
                    <tr 
                      key={key.key || index} 
                      className={`hover:bg-gray-800/50 transition-colors ${isMasterKey ? 'bg-yellow-900/10' : ''}`}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                        <div className="flex items-center">
                          <Badge className={`text-lg font-bold ${color} text-white`}>#{key.rank}</Badge>
                          {isMasterKey && (
                            <Shield className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <div className="flex items-center">
                          <Logo className="h-5 w-5 mr-2" />
                          {name}
                          {isMasterKey && (
                            <Badge className="ml-2 bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                              Master
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-medium">
                        {key.nickname || key.keyName}
                        {isMasterKey && (
                          <div className="text-xs text-yellow-500/80">From Environment</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{key.usageStats?.totalRequests || 0}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{key.usageStats?.successfulRequests || 0}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        {isActive && (
                          <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {isMasterKey && !isActive && (
                          <Badge className="bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                            <Shield className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        )}
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