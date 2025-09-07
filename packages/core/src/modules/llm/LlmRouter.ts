import { getLoggerInstance } from '../../logger.js';
import { getLlmProvider } from '../../utils/llmProvider.js';
import { LlmKeyManager } from './LlmKeyManager.js';
import { LlmError } from '../../utils/LlmError.js';

const log = getLoggerInstance();

export interface LlmRouterConfig {
  hierarchy: string[];
  maxRetries: number;
  retryDelayMs: number;
  maxFailuresPerProvider: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
  healthCheckInterval: number;
  enableAdaptiveRouting: boolean;
  enableCircuitBreaker: boolean;
}

export interface ProviderStats {
  provider: string;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  lastFailureTime: number;
  circuitBreakerOpen: boolean;
  totalRequests: number;
  consecutiveFailures: number;
}

export interface RouteResult {
  response: string;
  provider: string;
  attempts: number;
  totalTime: number;
  fallbackUsed: boolean;
}

export class LlmRouter {
  private config: LlmRouterConfig;
  private providerStats: Map<string, ProviderStats> = new Map();
  private lastHealthCheck: number = 0;

  constructor(config: Partial<LlmRouterConfig> = {}) {
    // Configuration simplifiée: utilise uniquement le provider configuré
    this.config = {
      hierarchy: config.hierarchy || [], // Utilise la hiérarchie fournie ou vide
      maxRetries: config.maxRetries || 1, // Réduit à 1 seule tentative
      retryDelayMs: config.retryDelayMs || 0, // Pas de délai
      maxFailuresPerProvider: config.maxFailuresPerProvider || 1,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 1, // Désactivé
      circuitBreakerResetTime: config.circuitBreakerResetTime || 0,
      healthCheckInterval: config.healthCheckInterval || 0,
      enableAdaptiveRouting: false, // DÉSACTIVÉ: pas de routage adaptatif
      enableCircuitBreaker: false, // DÉSACTIVÉ: pas de circuit breaker
    };

    log.info(
      '🎯 LLM Router: Configuration simple - utilise uniquement le provider configuré',
      { hierarchy: this.config.hierarchy },
    );

    // Initialiser les statistiques pour tous les providers
    this.initializeProviderStats();
  }

  private initializeProviderStats(): void {
    for (const provider of this.config.hierarchy) {
      this.providerStats.set(provider, {
        provider,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        lastFailureTime: 0,
        circuitBreakerOpen: false,
        totalRequests: 0,
        consecutiveFailures: 0,
      });
    }
  }

  /**
   * Obtient la liste des providers dans l'ordre configuré (pas de routage adaptatif)
   */
  private getOrderedProviders(): string[] {
    return [...this.config.hierarchy];
  }

  /**
   * Calcule un score de performance pour un provider
   */
  private calculateProviderScore(stats: ProviderStats): number {
    if (stats.totalRequests === 0) {
      return 0.5; // Score neutre pour les providers non testés
    }

    const successRate = stats.successCount / stats.totalRequests;
    const responseTimeScore = Math.max(0, 1 - stats.avgResponseTime / 10000); // Pénalité pour les temps longs
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

    // Pénalité progressive basée sur les échecs consécutifs
    return Math.min(
      1,
      stats.consecutiveFailures / this.config.maxFailuresPerProvider,
    );
  }

  /**
   * Vérifie si le circuit breaker est ouvert pour un provider
   */
  private isCircuitBreakerOpen(stats: ProviderStats): boolean {
    if (!this.config.enableCircuitBreaker || !stats.circuitBreakerOpen) {
      return false;
    }

    // Vérifier si il faut réinitialiser le circuit breaker
    const timeSinceLastFailure = Date.now() - stats.lastFailureTime;
    if (timeSinceLastFailure > this.config.circuitBreakerResetTime) {
      stats.circuitBreakerOpen = false;
      stats.consecutiveFailures = 0;
      log.info(`🔄 Circuit breaker reset for provider ${stats.provider}`);
      return false;
    }

    return true;
  }

  /**
   * Met à jour les statistiques après un succès
   */
  private recordSuccess(provider: string, responseTime: number): void {
    const stats = this.providerStats.get(provider);
    if (!stats) return;

    stats.successCount++;
    stats.totalRequests++;
    stats.consecutiveFailures = 0;
    stats.circuitBreakerOpen = false;

    // Mise à jour du temps de réponse moyen avec fenêtre glissante
    const alpha = 0.1; // Facteur de lissage
    stats.avgResponseTime =
      stats.avgResponseTime * (1 - alpha) + responseTime * alpha;

    log.debug(
      {
        provider,
        successRate:
          ((stats.successCount / stats.totalRequests) * 100).toFixed(1) + '%',
        avgResponseTime: Math.round(stats.avgResponseTime),
        totalRequests: stats.totalRequests,
      },
      '✅ LLM Router: Success recorded',
    );
  }

  /**
   * Met à jour les statistiques après un échec
   */
  private recordFailure(provider: string, error: Error): void {
    const stats = this.providerStats.get(provider);
    if (!stats) return;

    stats.failureCount++;
    stats.totalRequests++;
    stats.consecutiveFailures++;
    stats.lastFailureTime = Date.now();

    // Ouvrir le circuit breaker si nécessaire
    if (
      this.config.enableCircuitBreaker &&
      stats.consecutiveFailures >= this.config.maxFailuresPerProvider
    ) {
      stats.circuitBreakerOpen = true;
      log.warn(
        `🚨 Circuit breaker opened for provider ${provider} after ${stats.consecutiveFailures} consecutive failures`,
      );
    }

    log.debug(
      {
        provider,
        consecutiveFailures: stats.consecutiveFailures,
        failureRate:
          ((stats.failureCount / stats.totalRequests) * 100).toFixed(1) + '%',
        circuitBreakerOpen: stats.circuitBreakerOpen,
      },
      '❌ LLM Router: Failure recorded',
    );
  }

  /**
   * Vérifie si un provider est disponible
   */
  private async isProviderAvailable(provider: string): Promise<boolean> {
    try {
      const hasKeys = await LlmKeyManager.hasAvailableKeys(provider);
      const stats = this.providerStats.get(provider);
      const circuitBreakerOpen = stats
        ? this.isCircuitBreakerOpen(stats)
        : false;

      return hasKeys && !circuitBreakerOpen;
    } catch (error) {
      log.warn(`Error checking availability for provider ${provider}:`, error);
      return false;
    }
  }

  /**
   * Calcule le délai de retry adaptatif
   */
  private calculateRetryDelay(attempt: number, provider: string): number {
    const baseDelay = this.config.retryDelayMs;
    const stats = this.providerStats.get(provider);

    // Délai exponentiel avec jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3; // ±30% de variation
    let delay = exponentialDelay * (1 + jitter);

    // Délai supplémentaire si le provider a des problèmes récents
    if (stats && stats.consecutiveFailures > 0) {
      delay *= 1 + stats.consecutiveFailures * 0.5;
    }

    return Math.min(delay, 30000); // Maximum 30 secondes
  }

  /**
   * Route une requête vers le provider configuré uniquement
   */
  async routeRequest(
    messages: any[],
    prompt: string,
    apiKey: string,
    modelName: string,
  ): Promise<RouteResult> {
    const startTime = Date.now();

    // Si pas de hiérarchie configurée, utiliser un seul provider par défaut
    const orderedProviders =
      this.config.hierarchy.length > 0
        ? this.getOrderedProviders()
        : ['openrouter-dusk'];
    let lastError: Error | null = null;
    let totalAttempts = 0;

    log.info(
      {
        providersOrder: orderedProviders,
        modelName,
      },
      '🎯 LLM Router: Using configured provider only',
    );

    // Utiliser uniquement le PREMIER provider dans la liste (pas de fallback)
    const provider = orderedProviders[0];

    if (!provider) {
      throw new LlmError('No provider configured in hierarchy');
    }

    log.info(
      `🎯 Using configured provider: ${provider} with model: ${modelName}`,
    );

    // Vérifier la disponibilité du provider configuré
    if (!(await this.isProviderAvailable(provider))) {
      throw new LlmError(`Configured provider ${provider} is not available`);
    }

    // Une seule tentative avec le provider configuré
    totalAttempts = 1;
    const attemptStartTime = Date.now();

    try {
      log.info(`🎯 Attempting ${provider} for model ${modelName}`);

      const response = await getLlmProvider(provider).getLlmResponse(
        messages,
        prompt,
        apiKey,
        modelName,
      );

      // Succès !
      const responseTime = Date.now() - attemptStartTime;
      this.recordSuccess(provider, responseTime);

      log.info(
        {
          provider,
          modelName,
          responseTime,
          totalTime: Date.now() - startTime,
        },
        '🎉 LLM Router: Request successful',
      );

      return {
        response,
        provider,
        attempts: totalAttempts,
        totalTime: Date.now() - startTime,
        fallbackUsed: false,
      };
    } catch (error) {
      const responseTime = Date.now() - attemptStartTime;
      lastError = error instanceof Error ? error : new Error(String(error));

      this.recordFailure(provider, lastError);

      log.error(
        {
          provider,
          modelName,
          error: lastError.message,
          responseTime,
        },
        `❌ LLM Router: Provider failed`,
      );

      const totalTime = Date.now() - startTime;
      throw new LlmError(
        `Provider ${provider} failed for model ${modelName}: ${lastError?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Détermine si on doit abandonner un provider immédiatement
   */
  private shouldSkipProvider(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Erreurs qui indiquent qu'il faut passer au provider suivant
    const criticalErrors = [
      'api key not valid',
      'invalid api key',
      'api_key_invalid',
      'unauthorized',
      'authentication failed',
      'no llm api key available',
    ];

    return criticalErrors.some((criticalError) =>
      message.includes(criticalError),
    );
  }

  /**
   * Obtient les statistiques des providers
   */
  getProviderStats(): Map<string, ProviderStats> {
    return new Map(this.providerStats);
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats(): void {
    this.initializeProviderStats();
    log.info('🔄 LLM Router: Statistics reset');
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<LlmRouterConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Réinitialiser les stats si la hiérarchie a changé
    if (
      JSON.stringify(oldConfig.hierarchy) !==
      JSON.stringify(this.config.hierarchy)
    ) {
      this.initializeProviderStats();
    }

    log.info(
      {
        oldConfig: oldConfig,
        newConfig: this.config,
      },
      '⚙️ LLM Router: Configuration updated',
    );
  }

  /**
   * Effectue un health check sur tous les providers
   */
  async performHealthCheck(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.config.healthCheckInterval) {
      return; // Trop tôt pour un nouveau health check
    }

    this.lastHealthCheck = now;
    log.info('🔍 LLM Router: Performing health check');

    for (const provider of this.config.hierarchy) {
      try {
        const isAvailable = await this.isProviderAvailable(provider);
        const stats = this.providerStats.get(provider);

        if (stats && stats.circuitBreakerOpen && isAvailable) {
          // Tentative de réouverture du circuit breaker
          const timeSinceLastFailure = now - stats.lastFailureTime;
          if (timeSinceLastFailure > this.config.circuitBreakerResetTime) {
            stats.circuitBreakerOpen = false;
            stats.consecutiveFailures = 0;
            log.info(`✅ Health check: Circuit breaker reset for ${provider}`);
          }
        }
      } catch (error) {
        log.warn(`Health check failed for ${provider}:`, error);
      }
    }
  }
}
