import { getLogger } from '../../logger.ts';

const logger = getLogger().child({ component: 'CircuitBreaker' });

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class DatabaseCircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED',
  };

  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly monitoringInterval = 30000; // 30 secondes

  constructor() {
    // Monitoring périodique de l'état
    setInterval(() => {
      this.logState();
    }, this.monitoringInterval);
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.resetTimeout) {
        this.state.state = 'HALF_OPEN';
        logger.info('Circuit breaker moved to HALF_OPEN');
      } else {
        const remainingTime = Math.ceil(
          (this.resetTimeout - (Date.now() - this.state.lastFailureTime)) /
            1000,
        );
        throw new Error(
          `Circuit breaker is OPEN - database unavailable. Retry in ${remainingTime}s`,
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state.state === 'HALF_OPEN') {
      logger.info('Circuit breaker test successful - moved to CLOSED');
    }
    this.state.failures = 0;
    this.state.state = 'CLOSED';
  }

  private onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'OPEN';
      logger.warn(
        {
          failures: this.state.failures,
          threshold: this.failureThreshold,
        },
        'Circuit breaker opened due to too many failures',
      );
    } else {
      logger.warn(
        {
          failures: this.state.failures,
          threshold: this.failureThreshold,
        },
        'Database operation failed, incrementing failure count',
      );
    }
  }

  private logState() {
    logger.debug(
      {
        state: this.state.state,
        failures: this.state.failures,
        timeSinceLastFailure: Date.now() - this.state.lastFailureTime,
      },
      'Circuit breaker state',
    );
  }

  public getState() {
    return {
      ...this.state,
      timeSinceLastFailure: Date.now() - this.state.lastFailureTime,
      isAvailable:
        this.state.state !== 'OPEN' ||
        Date.now() - this.state.lastFailureTime > this.resetTimeout,
    };
  }

  public reset() {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    };
    logger.info('Circuit breaker manually reset');
  }
}
