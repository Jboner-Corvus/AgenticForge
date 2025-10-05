import pino from 'pino';
import { mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// Configuration pour la rotation des logs
interface LogRotationConfig {
  maxSize: string; // Taille maximale du fichier (ex: '10MB')
  maxFiles: number; // Nombre maximal de fichiers à conserver
  interval: string; // Intervalle de vérification (ex: '1d')
}

// Métriques pour les workers
interface WorkerMetrics {
  jobId: string;
  startTime: number;
  endTime?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  toolExecutions: Record<string, number>;
  errors: number;
  warnings: number;
}

// Niveaux de log personnalisés pour les workers
enum WorkerLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  TOOL = 'tool',      // Spécifique aux exécutions d'outils
  METRIC = 'metric',   // Spécifique aux métriques
  PERFORMANCE = 'perf' // Spécifique aux performances
}

class WorkerLogger {
  private logger: pino.Logger;
  private metrics: WorkerMetrics;
  private logDir: string;
  private rotationConfig: LogRotationConfig;
  private currentLogFile: string;
  private rotationTimer?: NodeJS.Timeout;

  constructor(
    jobId: string,
    sessionId: string,
    logDir = './logs',
    rotationConfig?: Partial<LogRotationConfig>
  ) {
    this.logDir = logDir;
    this.rotationConfig = {
      maxSize: rotationConfig?.maxSize || '10MB',
      maxFiles: rotationConfig?.maxFiles || 5,
      interval: rotationConfig?.interval || '1d'
    };

    // Créer le répertoire de logs s'il n'existe pas
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Déterminer le nom du fichier de log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentLogFile = join(this.logDir, `worker-${jobId}-${timestamp}.log`);

    // Configuration du logger Pino
    this.logger = pino({
      level: process.env.WORKER_LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          // Ajouter des métadonnées communes à tous les logs
          return {
            ...object,
            timestamp: new Date().toISOString(),
            service: 'worker',
            jobId,
            sessionId
          };
        }
      },
      timestamp: false // Nous ajoutons notre propre timestamp
    }, pino.destination({
      dest: this.currentLogFile,
      sync: false // Écriture asynchrone pour de meilleures performances
    }));

    // Initialiser les métriques
    this.metrics = {
      jobId,
      startTime: Date.now(),
      toolExecutions: {},
      errors: 0,
      warnings: 0
    };

    // Configurer la rotation des logs
    this.setupLogRotation();

    this.info('Worker logger initialized', { jobId, sessionId, logFile: this.currentLogFile });
  }

  // Vérifier et faire la rotation des logs si nécessaire
  private checkAndRotateLogs(): void {
    try {
      if (existsSync(this.currentLogFile)) {
        const stats = statSync(this.currentLogFile);
        const maxSizeBytes = this.parseSize(this.rotationConfig.maxSize);
        
        if (stats.size > maxSizeBytes) {
          this.rotateLogFile();
        }
      }
    } catch (error) {
      console.error('Error checking log file size:', error);
    }
  }

  // Convertir une taille en chaîne (ex: '10MB') en octets
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }
    
    const [, size, unit] = match;
    return parseInt(size) * units[unit.toUpperCase()];
  }

  // Effectuer la rotation du fichier de log
  private rotateLogFile(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = this.currentLogFile.replace(/\.log$/, `-${timestamp}.log`);
      
      // Renommer le fichier actuel
      const fs = require('fs');
      fs.renameSync(this.currentLogFile, rotatedFile);
      
      // Nettoyer les anciens fichiers
      this.cleanupOldLogs();
      
      this.info('Log file rotated', {
        oldFile: rotatedFile,
        newFile: this.currentLogFile
      });
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  // Nettoyer les anciens fichiers de logs
  private cleanupOldLogs(): void {
    try {
      const fs = require('fs');
      const files = fs.readdirSync(this.logDir)
        .filter((file: string) => file.startsWith('worker-') && file.endsWith('.log'))
        .map((file: string) => ({
          name: file,
          path: join(this.logDir, file),
          mtime: fs.statSync(join(this.logDir, file)).mtime
        }))
        .sort((a: any, b: any) => b.mtime - a.mtime); // Plus récent en premier
      
      // Garder seulement les maxFiles plus récents
      if (files.length > this.rotationConfig.maxFiles) {
        const filesToDelete = files.slice(this.rotationConfig.maxFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          this.info('Deleted old log file', { file: file.name });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  // Configurer la rotation automatique des logs
  private setupLogRotation(): void {
    // Vérifier la taille à intervalles réguliers
    const intervalMs = this.parseInterval(this.rotationConfig.interval);
    this.rotationTimer = setInterval(() => {
      this.checkAndRotateLogs();
    }, intervalMs);
  }

  // Convertir un intervalle en chaîne (ex: '1d') en millisecondes
  private parseInterval(intervalStr: string): number {
    const units: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = intervalStr.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) {
      throw new Error(`Invalid interval format: ${intervalStr}`);
    }
    
    const [, interval, unit] = match;
    return parseInt(interval) * units[unit.toLowerCase()];
  }

  // Méthodes de logging avec différents niveaux
  debug(message: string, meta?: any): void {
    this.logger.debug({ type: WorkerLogLevel.DEBUG, ...meta }, message);
  }

  info(message: string, meta?: any): void {
    this.logger.info({ type: WorkerLogLevel.INFO, ...meta }, message);
  }

  warn(message: string, meta?: any): void {
    this.metrics.warnings++;
    this.logger.warn({ type: WorkerLogLevel.WARN, metrics: this.getMetricsSnapshot(), ...meta }, message);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.metrics.errors++;
    this.logger.error({
      type: WorkerLogLevel.ERROR,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      metrics: this.getMetricsSnapshot(),
      ...meta
    }, message);
  }

  fatal(message: string, error?: Error, meta?: any): void {
    this.metrics.errors++;
    this.logger.fatal({
      type: WorkerLogLevel.FATAL,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      metrics: this.getMetricsSnapshot(),
      ...meta
    }, message);
  }

  // Logging spécialisé pour les exécutions d'outils
  tool(toolName: string, action: 'start' | 'end' | 'error', params?: any, result?: any, duration?: number): void {
    // Mettre à jour les métriques d'outils
    if (!this.metrics.toolExecutions[toolName]) {
      this.metrics.toolExecutions[toolName] = 0;
    }
    this.metrics.toolExecutions[toolName]++;

    const logData = {
      type: WorkerLogLevel.TOOL,
      toolName,
      action,
      params,
      result: result && typeof result === 'object' ? 'object' : result,
      duration,
      metrics: this.getMetricsSnapshot()
    };

    if (action === 'error') {
      this.metrics.errors++;
      this.logger.error(logData, `Tool execution failed: ${toolName}`);
    } else {
      this.logger.info(logData, `Tool ${action}: ${toolName}`);
    }
  }

  // Logging pour les métriques de performance
  performance(operation: string, duration: number, details?: any): void {
    this.logger.info({
      type: WorkerLogLevel.PERFORMANCE,
      operation,
      duration,
      details,
      metrics: this.getMetricsSnapshot()
    }, `Performance: ${operation} took ${duration}ms`);
  }

  // Logging pour les métriques personnalisées
  metric(name: string, value: number | string, unit?: string, details?: any): void {
    this.logger.info({
      type: WorkerLogLevel.METRIC,
      metricName: name,
      value,
      unit,
      details,
      metrics: this.getMetricsSnapshot()
    }, `Metric: ${name} = ${value}${unit ? ` ${unit}` : ''}`);
  }

  // Obtenir un instantané des métriques actuelles
  private getMetricsSnapshot(): any {
    return {
      uptime: Date.now() - this.metrics.startTime,
      memoryUsage: process.memoryUsage(),
      toolExecutions: this.metrics.toolExecutions,
      errors: this.metrics.errors,
      warnings: this.metrics.warnings
    };
  }

  // Finaliser le logging (à appeler à la fin du travail du worker)
  finalize(result?: any): void {
    this.metrics.endTime = Date.now();
    const totalDuration = this.metrics.endTime - this.metrics.startTime;

    this.logger.info({
      type: 'finalization',
      result,
      metrics: {
        ...this.getMetricsSnapshot(),
        totalDuration
      }
    }, 'Worker execution completed');

    // S'assurer que tous les logs sont écrits
    this.logger.flush();
    
    // Nettoyer le timer de rotation
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }

  // Créer un logger enfant avec un contexte supplémentaire
  child(context: any): WorkerLogger {
    const childLogger = Object.create(WorkerLogger.prototype);
    childLogger.logger = this.logger.child(context);
    childLogger.metrics = this.metrics;
    childLogger.logDir = this.logDir;
    childLogger.rotationConfig = this.rotationConfig;
    childLogger.currentLogFile = this.currentLogFile;
    // Ne pas copier le timer pour éviter multiples timers
    return childLogger;
  }
}

export { WorkerLogger, WorkerLogLevel, type LogRotationConfig, type WorkerMetrics };