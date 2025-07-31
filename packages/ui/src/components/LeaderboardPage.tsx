import { BarChart } from 'lucide-react';
import { memo } from 'react';
import { useStore } from '../lib/store';
import { LoadingSpinner } from './LoadingSpinner';
import { Label } from './ui/label';

export const LeaderboardPage = memo(() => {
  const leaderboardStats = useStore((state) => state.leaderboardStats);
  const isLoadingLeaderboardStats = useStore((state) => state.isLoadingLeaderboardStats);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <BarChart className="mr-3 h-6 w-6" />Leaderboard
      </h2>
      <div className="space-y-4">
        {isLoadingLeaderboardStats ? (
          <div className="flex justify-center items-center h-40">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-3 bg-card rounded-md shadow-sm">
              <Label className="text-base">Tokens Saved:</Label>
              <span className="text-base text-muted-foreground font-semibold">{leaderboardStats.tokensSaved}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-card rounded-md shadow-sm">
              <Label className="text-base">Successful Runs:</Label>
              <span className="text-base text-muted-foreground font-semibold">{leaderboardStats.successfulRuns}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-card rounded-md shadow-sm">
              <Label className="text-base">Sessions Created:</Label>
              <span className="text-base text-muted-foreground font-semibold">{leaderboardStats.sessionsCreated}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-card rounded-md shadow-sm">
              <Label className="text-base">API Keys Added:</Label>
              <span className="text-base text-muted-foreground font-semibold">{leaderboardStats.apiKeysAdded}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
