import { BarChart, Flame, Zap, Clock, Sparkles } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from './ui/badge';
import { OpenAILogo, AnthropicLogo, GeminiLogo, OpenRouterLogo } from './icons/LlmLogos';
import { AnimatePresence, motion } from 'framer-motion';

// --- Mock Data and Hook ---
interface ApiKeyUsage {
  id: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google Gemini' | 'OpenRouter';
  keyMask: string;
  requests: { count: number; limit: number };
  tokens: { count: number; limit: number };
  rank: number;
}

const MOCK_LEADERBOARD_DATA: ApiKeyUsage[] = [
    { id: 'key-1', provider: 'OpenAI', keyMask: 'sk-a...123', requests: { count: 4500, limit: 5000 }, tokens: { count: 1800000, limit: 2000000 }, rank: 1 },
    { id: 'key-2', provider: 'Anthropic', keyMask: 'sk-b...456', requests: { count: 3200, limit: 10000 }, tokens: { count: 950000, limit: 1000000 }, rank: 2 },
    { id: 'key-3', provider: 'OpenRouter', keyMask: 'sk-c...789', requests: { count: 8800, limit: 10000 }, tokens: { count: 750000, limit: 1000000 }, rank: 3 },
    { id: 'key-4', provider: 'OpenAI', keyMask: 'sk-d...012', requests: { count: 1200, limit: 5000 }, tokens: { count: 300000, limit: 2000000 }, rank: 4 },
    { id: 'key-5', provider: 'Google Gemini', keyMask: 'sk-e...345', requests: { count: 500, limit: 1000 }, tokens: { count: 400000, limit: 500000 }, rank: 5 },
];

const useLeaderboardData = () => {
  const [data, setData] = useState<ApiKeyUsage[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => setData(MOCK_LEADERBOARD_DATA), 1000);
    return () => clearTimeout(timer);
  }, []);
  return { data };
};

// --- Helper Components ---
const CountdownTimer = () => {
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
  
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Resets in: {timeLeft}</span>
      </div>
    );
};

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
  const { data: leaderboardData } = useLeaderboardData();

  const groupedByProvider = leaderboardData.reduce((acc, key) => {
    (acc[key.provider] = acc[key.provider] || []).push(key);
    return acc;
  }, {} as Record<string, ApiKeyUsage[]>);

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
          <CountdownTimer />
        </div>

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
      </motion.div>
    </AnimatePresence>
  );
});