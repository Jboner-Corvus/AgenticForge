// Export des modules de base de données
export {
  PostgresPoolManager,
  getPostgresPool,
  closePostgresPool,
} from './postgresPool.ts';
export { DatabaseCircuitBreaker } from './circuitBreaker.ts';
export {
  PostgresMonitor,
  getPostgresMonitor,
  stopPostgresMonitoring,
} from './postgresMonitor.ts';

// Types communs
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  minConnections?: number;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
}
