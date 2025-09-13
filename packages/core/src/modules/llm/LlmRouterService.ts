import { LlmRouter, LlmRouterConfig, ProviderStats } from './LlmRouter.js';
import { LlmKeyManager } from './LlmKeyManager.js';
import { getLoggerInstance } from '../../logger.js';
import { config } from '../../config.js';

const log = getLoggerInstance();

/**
 * Service global pour gérer le routeur LLM et son intégration avec le Key Manager
 * Ce service fait le pont entre le routeur et l'interface de gestion des clés
 */
export class LlmRouterService {
  private static instance: LlmRouterService;
  private router: LlmRouter;
  private routerConfig: LlmRouterConfig;

  private constructor() {
    // Configuration initiale du routeur à partir de l'environnement
    this.routerConfig = {
      hierarchy: config.LLM_PROVIDER_HIERARCHY,
      maxRetries: config.LLM_ROUTER_MAX_RETRIES,
      retryDelayMs: config.LLM_ROUTER_RETRY_DELAY_MS,
      maxFailuresPerProvider: config.LLM_ROUTER_MAX_FAILURES_PER_PROVIDER,
      circuitBreakerThreshold: config.LLM_ROUTER_CIRCUIT_BREAKER_THRESHOLD,
      circuitBreakerResetTime: config.LLM_ROUTER_CIRCUIT_BREAKER_RESET_TIME,
      healthCheckInterval: config.LLM_ROUTER_HEALTH_CHECK_INTERVAL,
      enableAdaptiveRouting: config.LLM_ROUTER_ENABLE_ADAPTIVE_ROUTING,
      enableCircuitBreaker: config.LLM_ROUTER_ENABLE_CIRCUIT_BREAKER,
    };

    this.router = new LlmRouter(this.routerConfig);
    log.info(
      '🚀 LLM Router Service initialized with configuration:',
      this.routerConfig,
    );
  }

  public static getInstance(): LlmRouterService {
    if (!LlmRouterService.instance) {
      LlmRouterService.instance = new LlmRouterService();
    }
    return LlmRouterService.instance;
  }

  /**
   * Obtient le routeur LLM actuel
   */
  public getRouter(): LlmRouter {
    return this.router;
  }

  /**
   * Obtient les statistiques des providers pour l'interface web
   */
  public getProviderStatistics(): {
    providers: Array<
      ProviderStats & {
        isAvailable: boolean;
        successRate: number;
        performanceScore: number;
      }
    >;
    configuration: LlmRouterConfig;
    totalRequests: number;
    activeProviders: number;
  } {
    const stats = this.router.getProviderStats();
    let totalRequests = 0;
    let activeProviders = 0;

    const providers = Array.from(stats.entries()).map(([provider, stat]) => {
      const isAvailable = !stat.circuitBreakerOpen;
      const successRate =
        stat.totalRequests > 0 ? stat.successCount / stat.totalRequests : 0;
      const performanceScore = this.calculatePerformanceScore(stat);

      totalRequests += stat.totalRequests;
      if (isAvailable && stat.totalRequests > 0) activeProviders++;

      return {
        ...stat,
        isAvailable,
        successRate: Math.round(successRate * 100) / 100,
        performanceScore: Math.round(performanceScore * 100) / 100,
      };
    });

    return {
      providers,
      configuration: this.routerConfig,
      totalRequests,
      activeProviders,
    };
  }

  /**
   * Met à jour la configuration du routeur
   */
  public updateRouterConfig(newConfig: Partial<LlmRouterConfig>): void {
    this.routerConfig = { ...this.routerConfig, ...newConfig };
    this.router.updateConfig(this.routerConfig);
    log.info('📝 LLM Router configuration updated:', newConfig);
  }

  /**
   * Réinitialise les statistiques du routeur
   */
  public resetStatistics(): void {
    this.router.resetStats();
    log.info('🔄 LLM Router statistics reset');
  }

  /**
   * Force un health check sur tous les providers
   */
  public async performHealthCheck(): Promise<void> {
    await this.router.performHealthCheck();
    log.info('🔍 LLM Router health check completed');
  }

  /**
   * Retourne toujours la hiérarchie configurée (pas d'adaptation)
   */
  public getRecommendedHierarchy(): string[] {
    return this.routerConfig.hierarchy;
  }

  /**
   * Obtient les métriques de santé globale du système
   */
  public getHealthMetrics(): {
    overallHealth: 'healthy' | 'degraded' | 'critical';
    availableProviders: number;
    totalProviders: number;
    avgResponseTime: number;
    totalSuccessRate: number;
    circuitBreakersOpen: number;
    lastHealthCheck: number;
  } {
    const stats = this.router.getProviderStats();
    let availableProviders = 0;
    let totalProviders = stats.size;
    let totalResponseTime = 0;
    let totalRequests = 0;
    let totalSuccess = 0;
    let circuitBreakersOpen = 0;
    let providersWithData = 0;

    for (const [, stat] of stats) {
      if (!stat.circuitBreakerOpen) availableProviders++;
      if (stat.circuitBreakerOpen) circuitBreakersOpen++;

      if (stat.totalRequests > 0) {
        providersWithData++;
        totalResponseTime += stat.avgResponseTime;
        totalRequests += stat.totalRequests;
        totalSuccess += stat.successCount;
      }
    }

    const avgResponseTime =
      providersWithData > 0 ? totalResponseTime / providersWithData : 0;
    const totalSuccessRate =
      totalRequests > 0 ? totalSuccess / totalRequests : 1;

    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (availableProviders < totalProviders * 0.5) {
      overallHealth = 'critical';
    } else if (
      availableProviders < totalProviders * 0.8 ||
      totalSuccessRate < 0.8
    ) {
      overallHealth = 'degraded';
    }

    return {
      overallHealth,
      availableProviders,
      totalProviders,
      avgResponseTime: Math.round(avgResponseTime),
      totalSuccessRate: Math.round(totalSuccessRate * 100) / 100,
      circuitBreakersOpen,
      lastHealthCheck: Date.now(),
    };
  }

  /**
   * Maintient la configuration actuelle (pas de synchronisation automatique)
   */
  public async syncWithKeyManager(): Promise<void> {
    // Ne fait rien - le routeur utilise uniquement le provider configuré
    log.info(
      '🎯 LLM Router: Utilise la configuration statique, pas de synchronisation',
    );
  }

  /**
   * Calcule un score de performance pour un provider
   */
  private calculatePerformanceScore(stats: ProviderStats): number {
    if (stats.totalRequests === 0) {
      return 0.5; // Score neutre pour les providers non testés
    }

    const successRate = stats.successCount / stats.totalRequests;
    const responseTimeScore = Math.max(0, 1 - stats.avgResponseTime / 10000);
    const recentFailurePenalty = this.getRecentFailurePenalty(stats);

    return (
      successRate * 0.6 + responseTimeScore * 0.3 - recentFailurePenalty * 0.1
    );
  }

  /**
   * Calcule une pénalité basée sur les échecs récents
   */
  private getRecentFailurePenalty(stats: ProviderStats): number {
    const timeSinceLastFailure = Date.now() - stats.lastFailureTime;
    const recentFailureWindow = 300000; // 5 minutes

    if (timeSinceLastFailure > recentFailureWindow) {
      return 0; // Pas de pénalité si l'échec est ancien
    }

    return Math.min(
      1,
      stats.consecutiveFailures / this.routerConfig.maxFailuresPerProvider,
    );
  }
}

// Export de l'instance singleton
export const llmRouterService = LlmRouterService.getInstance();
