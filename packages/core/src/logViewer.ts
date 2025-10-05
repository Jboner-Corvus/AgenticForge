import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { WorkerLogger } from './workerLogger';

interface LogEntry {
  timestamp: string;
  level: string;
  type: string;
  message: string;
  jobId: string;
  sessionId: string;
  metrics?: any;
  [key: string]: any;
}

interface LogFilter {
  jobId?: string;
  sessionId?: string;
  level?: string;
  type?: string;
  since?: string;
  until?: string;
  limit?: number;
}

export class LogViewer {
  private logDir: string;

  constructor(logDir = './logs') {
    this.logDir = logDir;
  }

  /**
   * Récupère la liste des fichiers de logs disponibles
   */
  getLogFiles(): Array<{ filename: string; path: string; size: number; modified: Date }> {
    if (!existsSync(this.logDir)) {
      return [];
    }

    try {
      return readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(filename => {
          const path = join(this.logDir, filename);
          const stats = statSync(path);
          return {
            filename,
            path,
            size: stats.size,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    } catch (error) {
      console.error('Erreur lors de la lecture des fichiers de logs:', error);
      return [];
    }
  }

  /**
   * Récupère les logs pour un job spécifique
   */
  getLogsForJob(jobId: string, filter?: LogFilter): LogEntry[] {
    const logFiles = this.getLogFiles().filter(file => file.filename.includes(`worker-${jobId}`));
    const logs: LogEntry[] = [];

    for (const file of logFiles) {
      try {
        const content = readFileSync(file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line) as LogEntry;
            if (this.matchesFilter(logEntry, { ...filter, jobId })) {
              logs.push(logEntry);
            }
          } catch (parseError) {
            // Ignorer les lignes qui ne sont pas du JSON valide
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${file.filename}:`, error);
      }
    }

    return this.sortLogs(logs, filter?.limit);
  }

  /**
   * Récupère tous les logs avec filtres optionnels
   */
  getAllLogs(filter?: LogFilter): LogEntry[] {
    const logFiles = this.getLogFiles();
    const logs: LogEntry[] = [];

    for (const file of logFiles) {
      try {
        const content = readFileSync(file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line) as LogEntry;
            if (this.matchesFilter(logEntry, filter)) {
              logs.push(logEntry);
            }
          } catch (parseError) {
            // Ignorer les lignes qui ne sont pas du JSON valide
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${file.filename}:`, error);
      }
    }

    return this.sortLogs(logs, filter?.limit);
  }

  /**
   * Récupère les métriques pour un job spécifique
   */
  getMetricsForJob(jobId: string): any {
    const logs = this.getLogsForJob(jobId);
    
    if (logs.length === 0) {
      return null;
    }

    // Trouver le log de finalisation pour obtenir les métriques complètes
    const finalLog = logs.find(log => log.type === 'finalization');
    
    if (finalLog && finalLog.metrics) {
      return finalLog.metrics;
    }

    // Sinon, calculer les métriques à partir des logs
    const metrics = {
      jobId,
      startTime: logs[0]?.timestamp,
      endTime: logs[logs.length - 1]?.timestamp,
      totalLogs: logs.length,
      errors: logs.filter(log => log.level === 'error' || log.level === 'fatal').length,
      warnings: logs.filter(log => log.level === 'warn').length,
      toolExecutions: {} as Record<string, number>,
      performanceMetrics: [] as Array<{ operation: string; duration: number }>
    };

    // Compter les exécutions d'outils
    logs.filter(log => log.type === 'tool').forEach(log => {
      const toolName = log.toolName;
      if (!metrics.toolExecutions[toolName]) {
        metrics.toolExecutions[toolName] = 0;
      }
      metrics.toolExecutions[toolName]++;
    });

    // Extraire les métriques de performance
    logs.filter(log => log.type === 'perf').forEach(log => {
      metrics.performanceMetrics.push({
        operation: log.operation,
        duration: log.duration
      });
    });

    return metrics;
  }

  /**
   * Affiche les logs de manière formatée dans la console
   */
  displayLogs(logs: LogEntry[], options?: { showMetrics?: boolean; colorize?: boolean }): void {
    const { showMetrics = true, colorize = true } = options || {};

    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const level = log.level.toUpperCase().padEnd(5);
      const type = log.type ? `[${log.type}]` : '';
      
      let message = `[${timestamp}] ${level} ${type} ${log.message}`;
      
      if (colorize) {
        const colors = {
          debug: '\x1b[36m',    // Cyan
          info: '\x1b[32m',     // Green
          warn: '\x1b[33m',     // Yellow
          error: '\x1b[31m',    // Red
          fatal: '\x1b[35m',    // Magenta
          reset: '\x1b[0m'      // Reset
        };
        
        const color = colors[log.level as keyof typeof colors] || colors.reset;
        message = `${color}${message}${colors.reset}`;
      }
      
      console.log(message);

      // Afficher les détails supplémentaires
      if (log.toolName) {
        console.log(`  Tool: ${log.toolName}, Action: ${log.action}, Duration: ${log.duration}ms`);
      }
      
      if (log.operation) {
        console.log(`  Operation: ${log.operation}, Duration: ${log.duration}ms`);
      }
      
      if (log.metricName) {
        console.log(`  Metric: ${log.metricName} = ${log.value}${log.unit ? ` ${log.unit}` : ''}`);
      }

      if (showMetrics && log.metrics) {
        console.log(`  Metrics: uptime=${log.metrics.uptime}ms, errors=${log.metrics.errors}, warnings=${log.metrics.warnings}`);
      }
      
      if (log.error) {
        console.log(`  Error: ${log.error.message}`);
      }
      
      console.log(''); // Ligne vide pour la lisibilité
    });
  }

  /**
   * Affiche un résumé des logs pour un job
   */
  displayJobSummary(jobId: string): void {
    const metrics = this.getMetricsForJob(jobId);
    
    if (!metrics) {
      console.log(`Aucun log trouvé pour le job ${jobId}`);
      return;
    }

    console.log(`\n=== Résumé du Job ${jobId} ===`);
    console.log(`Durée totale: ${this.calculateDuration(metrics.startTime, metrics.endTime)}`);
    console.log(`Nombre total de logs: ${metrics.totalLogs}`);
    console.log(`Erreurs: ${metrics.errors}`);
    console.log(`Avertissements: ${metrics.warnings}`);
    
    if (Object.keys(metrics.toolExecutions).length > 0) {
      console.log('\nExécutions d\'outils:');
      Object.entries(metrics.toolExecutions).forEach(([tool, count]) => {
        console.log(`  ${tool}: ${count} fois`);
      });
    }
    
    if (metrics.performanceMetrics.length > 0) {
      console.log('\nMétriques de performance:');
      metrics.performanceMetrics.forEach((item: any) => {
        console.log(`  ${item.operation}: ${item.duration}ms`);
      });
    }
    
    console.log('========================\n');
  }

  /**
   * Vérifie si un log correspond aux filtres
   */
  private matchesFilter(log: LogEntry, filter?: LogFilter): boolean {
    if (!filter) return true;

    if (filter.jobId && log.jobId !== filter.jobId) return false;
    if (filter.sessionId && log.sessionId !== filter.sessionId) return false;
    if (filter.level && log.level !== filter.level) return false;
    if (filter.type && log.type !== filter.type) return false;
    
    if (filter.since && new Date(log.timestamp) < new Date(filter.since)) return false;
    if (filter.until && new Date(log.timestamp) > new Date(filter.until)) return false;
    
    return true;
  }

  /**
   * Trie les logs et applique une limite
   */
  private sortLogs(logs: LogEntry[], limit?: number): LogEntry[] {
    const sorted = logs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return limit ? sorted.slice(-limit) : sorted;
  }

  /**
   * Calcule la durée entre deux timestamps
   */
  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      return `${(duration / 60000).toFixed(2)}m`;
    }
  }
}

// Fonctions utilitaires pour une utilisation rapide
export function viewLogsForJob(jobId: string, options?: { filter?: LogFilter; display?: boolean }): LogEntry[] {
  const viewer = new LogViewer();
  const logs = viewer.getLogsForJob(jobId, options?.filter);
  
  if (options?.display !== false) {
    viewer.displayLogs(logs);
  }
  
  return logs;
}

export function viewJobSummary(jobId: string): void {
  const viewer = new LogViewer();
  viewer.displayJobSummary(jobId);
}

export function listAvailableJobs(): string[] {
  const viewer = new LogViewer();
  const files = viewer.getLogFiles();
  
  // Extraire les IDs des jobs à partir des noms de fichiers
  const jobIds = new Set<string>();
  files.forEach(file => {
    const match = file.filename.match(/worker-(.+?)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log/);
    if (match) {
      jobIds.add(match[1]);
    }
  });
  
  return Array.from(jobIds);
}