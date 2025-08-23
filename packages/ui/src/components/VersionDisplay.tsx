import { useEffect, useState, useCallback } from 'react';
import { clientConfig } from '../config';

interface VersionInfo {
  current: string;
  name: string;
  description: string;
  rootName: string;
  buildDate: string;
  services: {
    web: string;
    api: string;
    postgres: string;
    redis: string;
  };
  environment: string;
  repository: string;
  homepage: string;
}

interface UpdateCheckResult {
  hasUpdate: boolean;
  current: string;
  latest: string;
  comparison?: {
    current: string;
    latest: string;
    hasUpdate: boolean;
    severity: 'patch' | 'minor' | 'major';
    releaseNotes: string;
    releaseDate: string;
    downloadUrl: string;
    features: string[];
    bugFixes: string[];
    breakingChanges: string[];
  };
  error?: string;
}

interface VersionDisplayProps {
  showUpdateIndicator?: boolean;
  onUpdateClick?: (updateInfo: UpdateCheckResult) => void;
  position?: 'bottom-right' | 'header' | 'sidebar';
  enableAutoCheck?: boolean;
  checkInterval?: number; // in milliseconds
}

export function VersionDisplay({ 
  showUpdateIndicator = true,
  onUpdateClick,
  position = 'bottom-right',
  enableAutoCheck = true,
  checkInterval = 300000 // 5 minutes
}: VersionDisplayProps = {}) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchVersion = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/version/current', {
        headers: {
          'Authorization': `Bearer ${clientConfig.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVersionInfo(data);
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching version:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Fallback to package.json version if API fails
      setVersionInfo({
        current: '1.0.304', // From package.json
        name: '@gforge/core',
        description: 'G-Forge Core Backend',
        rootName: '@jboner-corvus/agenticforge',
        buildDate: new Date().toISOString(),
        services: { 
          web: 'localhost:3002', 
          api: 'localhost:3001',
          postgres: 'localhost:5432',
          redis: 'localhost:6379'
        },
        environment: 'development',
        repository: 'https://github.com/Jboner-Corvus/AgenticForge.git',
        homepage: 'https://github.com/Jboner-Corvus/AgenticForge#readme'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!versionInfo || !showUpdateIndicator) return;
    
    try {
      const response = await fetch('/api/version/check', {
        headers: {
          'Authorization': `Bearer ${clientConfig.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpdateInfo(data);
        setLastChecked(new Date());
        
        // Trigger callback if update available
        if (data.hasUpdate && onUpdateClick) {
          onUpdateClick(data);
        }
      } else {
        console.warn('Failed to check for updates:', response.statusText);
      }
    } catch (err) {
      console.warn('Error checking for updates:', err);
    }
  }, [versionInfo, showUpdateIndicator, onUpdateClick]);

  const handleVersionClick = useCallback(() => {
    if (updateInfo?.hasUpdate && onUpdateClick) {
      onUpdateClick(updateInfo);
    } else if (versionInfo?.repository) {
      window.open(versionInfo.repository, '_blank');
    }
  }, [updateInfo, onUpdateClick, versionInfo]);

  // Initial version fetch
  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  // Check for updates after version is loaded
  useEffect(() => {
    if (versionInfo && showUpdateIndicator) {
      checkForUpdates();
    }
  }, [versionInfo, showUpdateIndicator, checkForUpdates]);

  // Auto-check for updates periodically
  useEffect(() => {
    if (!enableAutoCheck || !showUpdateIndicator) return;
    
    const interval = setInterval(checkForUpdates, checkInterval);
    return () => clearInterval(interval);
  }, [enableAutoCheck, showUpdateIndicator, checkForUpdates, checkInterval]);

  if (error && !versionInfo) {
    return (
      <div className={getPositionClasses(position)}>
        <div className="text-xs text-red-500 bg-background/80 backdrop-blur-sm px-2 py-1 rounded cursor-pointer hover:bg-background/90 transition-colors"
             onClick={() => fetchVersion()}
             title={`Error: ${error}. Click to retry.`}>
          ⚠ Version unavailable
        </div>
      </div>
    );
  }

  if (!versionInfo) {
    return (
      <div className={getPositionClasses(position)}>
        <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          {isLoading ? 'Loading...' : 'Loading version...'}
        </div>
      </div>
    );
  }

  const hasUpdate = updateInfo?.hasUpdate ?? false;
  const severity = updateInfo?.comparison?.severity;
  
  return (
    <div className={getPositionClasses(position)}>
      <div 
        className={`text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded transition-colors cursor-pointer hover:bg-background/90 ${
          hasUpdate ? 'border border-orange-500/50' : ''
        }`}
        onClick={handleVersionClick}
        title={getTooltipText(versionInfo, updateInfo, error)}
      >
        <div className="flex items-center gap-2">
          <span className={hasUpdate ? 'text-orange-400' : 'text-muted-foreground'}>
            v{versionInfo.current}
          </span>
          
          {hasUpdate && showUpdateIndicator && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                severity === 'major' ? 'bg-red-500 animate-pulse' :
                severity === 'minor' ? 'bg-orange-500 animate-pulse' :
                'bg-blue-500 animate-pulse'
              }`} />
              <span className="text-xs text-orange-400">
                → v{updateInfo?.latest}
              </span>
            </div>
          )}
          
          {error && (
            <span className="text-yellow-500" title={error}>⚠</span>
          )}
          
          {lastChecked && (
            <span className="text-xs text-muted-foreground/60">
              {formatLastChecked(lastChecked)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getPositionClasses(position: 'bottom-right' | 'header' | 'sidebar'): string {
  switch (position) {
    case 'bottom-right':
      return 'fixed bottom-4 right-4';
    case 'header':
      return 'flex items-center';
    case 'sidebar':
      return 'flex items-center w-full';
    default:
      return 'fixed bottom-4 right-4';
  }
}

function getTooltipText(
  versionInfo: VersionInfo, 
  updateInfo: UpdateCheckResult | null, 
  error: string | null
): string {
  const lines = [];
  
  lines.push(`${versionInfo.name} v${versionInfo.current}`);
  lines.push(`Environment: ${versionInfo.environment}`);
  lines.push(`Build: ${new Date(versionInfo.buildDate).toLocaleDateString()}`);
  
  if (updateInfo?.hasUpdate) {
    lines.push('');
    lines.push(`🚀 Update available: v${updateInfo.latest}`);
    lines.push(`Severity: ${updateInfo.comparison?.severity}`);
    
    if (updateInfo.comparison?.features.length) {
      lines.push(`Features: ${updateInfo.comparison.features.length}`);
    }
    if (updateInfo.comparison?.bugFixes.length) {
      lines.push(`Bug fixes: ${updateInfo.comparison.bugFixes.length}`);
    }
    if (updateInfo.comparison?.breakingChanges.length) {
      lines.push(`⚠ Breaking changes: ${updateInfo.comparison.breakingChanges.length}`);
    }
    
    lines.push('');
    lines.push('Click to upgrade');
  } else if (updateInfo) {
    lines.push('');
    lines.push('✓ Up to date');
    lines.push('Click to view repository');
  }
  
  if (error) {
    lines.push('');
    lines.push(`⚠ ${error}`);
  }
  
  return lines.join('\n');
}

function formatLastChecked(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}