import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Eye, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { useUIStore } from '../store/uiStore';
import { useLatestTokenStats, useIsProcessing } from '../store/hooks';
import { formatTokenCount } from '../lib/utils/tokenEstimation';

interface TokenUsageDisplayProps {
  variant?: 'minimal' | 'detailed';
  className?: string;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  variant = 'minimal',
  className = '',
}) => {
  const tokenStats = useLatestTokenStats();
  const isProcessing = useIsProcessing();
  const fetchLatestTokenStats = useUIStore(
    (state) => state.fetchLatestTokenStats,
  );

  // Fetch token stats when processing finishes
  useEffect(() => {
    if (!isProcessing && tokenStats === null) {
      fetchLatestTokenStats();
    }
  }, [isProcessing, fetchLatestTokenStats, tokenStats]);

  // Auto-refresh every 5 seconds when not processing
  useEffect(() => {
    if (!isProcessing) {
      const interval = setInterval(() => {
        fetchLatestTokenStats();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isProcessing, fetchLatestTokenStats]);

  if (!tokenStats || tokenStats.total_tokens === 0) {
    return null;
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <Activity className="h-3 w-3" />
        <span>{formatTokenCount(tokenStats.input_tokens)} ctx</span>
        {tokenStats.timestamp && (
          <span className="opacity-70">
            à {formatTime(tokenStats.timestamp)}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-3 bg-muted/50 rounded-lg border ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Utilisation des tokens</span>
        {tokenStats.timestamp && (
          <Badge variant="outline" className="text-xs">
            {formatTime(tokenStats.timestamp)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">Entrée:</span>
          <span className="font-mono">
            {formatTokenCount(tokenStats.input_tokens)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">Sortie:</span>
          <span className="font-mono">
            {formatTokenCount(tokenStats.output_tokens)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-orange-500" />
          <span className="text-muted-foreground">Total:</span>
          <span className="font-mono font-medium">
            {formatTokenCount(tokenStats.total_tokens)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
