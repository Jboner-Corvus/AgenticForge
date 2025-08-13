import { BarChart, Flame, Zap, Clock, Sparkles } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from './ui/badge';
import { OpenAILogo, AnthropicLogo, GeminiLogo, OpenRouterLogo } from './icons/LlmLogos';
import { AnimatePresence, motion } from 'framer-motion';
import { useCombinedStore as useStore } from '../store';

// --- Mock Data and Hook ---
interface ApiKeyUsage {
  id: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google Gemini' | 'OpenRouter';
  keyMask: string;
  requests: { count: number; limit: number };
  tokens: { count: number; limit: number };
  rank: number;
}

const getProviderVisuals = (provider: ApiKeyUsage['provider']) => {
    const visuals = {
      OpenAI: { Logo: OpenAILogo, color: 'bg-green-500', name: 'OpenAI' },
      Anthropic: { Logo: AnthropicLogo, color: 'bg-purple-500', name: 'Anthropic' },
      'Google Gemini': { Logo: GeminiLogo, color: 'bg-blue-500', name: 'Google Gemini' },
      OpenRouter: { Logo: OpenRouterLogo, color: 'bg-pink-500', name: 'OpenRouter' },
    };
    return visuals[provider] || { Logo: Sparkles, color: 'bg-gray-500', name: 'Unknown' };
};

const UsageBar = ({ value, limit, color }: { value: number; limit: number; color: string }) => {
    const percentage = (value / limit) * 100;
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{value.toLocaleString()}</span>
          <span>{limit.toLocaleString()}</span>
        </div>
        <Progress value={percentage} indicatorClassName={color} />
      </div>
    );
};

// --- Main Component ---
export const LeaderboardPage = memo(() => {
  const [leaderboardData, setLeaderboardData] = useState<ApiKeyUsage[]>([]);
  const llmApiKeys = useStore((state) => state.llmApiKeys);
  const isLoadingLeaderboardStats = useStore((state) => state.isLoadingLeaderboardStats);
  const authToken = useStore((state) => state.authToken);
  const sessionId = useStore((state) => state.sessionId);

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken || !sessionId) return;
      
      try {
        const response = await fetch('/api/leaderboard', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Session-ID': sessionId,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };

    fetchData();
  }, [authToken, sessionId]);

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

  const groupedByProvider = leaderboardData.reduce((acc, key) => {
    (acc[key.provider] = acc[key.provider] || []).push(key);
    return acc;
  }, {} as Record<string, ApiKeyUsage[]>);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(groupedByProvider).map(([providerName, keys]) => {
              const { Logo, color, name } = getProviderVisuals(providerName as ApiKeyUsage['provider']);
              return (
                <Card key={providerName} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className={`flex flex-row items-center justify-between p-4 ${color}`}>
                    <div className="flex items-center">
                      <Logo className="h-6 w-6 mr-3 text-white" />
                      <CardTitle className="text-xl font-bold text-white">{name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {keys.map((key) => (
                      <motion.div
                        key={key.id}
                        className="p-4 border rounded-lg bg-background/50"
                        whileHover={{ scale: 1.02, boxShadow: '0px 5px 15px rgba(0,0,0,0.1)' }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Badge className={`mr-3 text-lg font-bold ${color} text-white`}>#{key.rank}</Badge>
                            <span className="font-mono text-sm">{key.keyMask}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center text-sm font-medium mb-2">
                              <Zap className="h-4 w-4 mr-2 text-primary" />
                              Requests
                            </div>
                            <UsageBar value={key.requests.count} limit={key.requests.limit} color={color} />
                          </div>
                          <div>
                            <div className="flex items-center text-sm font-medium mb-2">
                              <Flame className="h-4 w-4 mr-2 text-orange-500" />
                              Tokens
                            </div>
                            <UsageBar value={key.tokens.count} limit={key.tokens.limit} color={color} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});