import { BarChart, Trophy, Medal, Star, Award } from 'lucide-react';
import { memo } from 'react';
import { useStore } from '../lib/store';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const LeaderboardPage = memo(() => {
  const leaderboardStats = useStore((state) => state.leaderboardStats);
  const isLoadingLeaderboardStats = useStore((state) => state.isLoadingLeaderboardStats);

  const stats = [
    { 
      title: "Tokens Saved", 
      value: leaderboardStats.tokensSaved, 
      icon: <Medal className="h-6 w-6 text-yellow-500" />,
      description: "Total tokens saved through efficient processing"
    },
    { 
      title: "Successful Runs", 
      value: leaderboardStats.successfulRuns, 
      icon: <Trophy className="h-6 w-6 text-blue-500" />,
      description: "Completed agent tasks without errors"
    },
    { 
      title: "Sessions Created", 
      value: leaderboardStats.sessionsCreated, 
      icon: <Star className="h-6 w-6 text-green-500" />,
      description: "Total number of sessions created"
    },
    { 
      title: "API Keys Added", 
      value: leaderboardStats.apiKeysAdded, 
      icon: <Award className="h-6 w-6 text-purple-500" />,
      description: "LLM API keys configured for use"
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <BarChart className="mr-3 h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold">Leaderboard</h2>
      </div>
      
      {isLoadingLeaderboardStats ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-12 p-6 bg-secondary rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 bg-background rounded-lg">
            <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
            <span className="text-sm font-medium">Token Saver</span>
            <span className="text-xs text-muted-foreground">1000+ tokens saved</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg">
            <Medal className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Task Master</span>
            <span className="text-xs text-muted-foreground">50+ successful runs</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg">
            <Star className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-sm font-medium">Session Creator</span>
            <span className="text-xs text-muted-foreground">10+ sessions created</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg">
            <Award className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium">API Explorer</span>
            <span className="text-xs text-muted-foreground">3+ API keys added</span>
          </div>
        </div>
      </div>
    </div>
  );
});
