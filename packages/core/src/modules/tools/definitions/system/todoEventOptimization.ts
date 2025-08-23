import { getRedisClientInstance } from '../../../../modules/redis/redisClient.ts';

// Batch event structure
export interface BatchEvent {
  events: TodoEvent[];
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'BATCH_UPDATE';
}

// Configuration for event batching
export interface EventBatchingConfig {
  batchSize: number; // Maximum number of events per batch
  batchTimeout: number; // Time in ms to wait before sending a partial batch
  enableCompression: boolean; // Whether to compress large payloads
  maxQueueSize: number; // Maximum number of events in queue
}

// Base event structure
export interface TodoEvent {
  data: any;
  id: string;
  sessionId: string;
  timestamp: number;
  type: TodoEventType;
}

// Event types for todo list operations
export type TodoEventType =
  | 'BATCH_UPDATE'
  | 'PROJECT_CREATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_UPDATED'
  | 'STATE_SYNC'
  | 'TASK_CREATED'
  | 'TASK_DELETED'
  | 'TASK_UPDATED';

// Default configuration
const DEFAULT_CONFIG: EventBatchingConfig = {
  batchSize: 10,
  batchTimeout: 100, // 100ms
  enableCompression: true,
  maxQueueSize: 1000,
};

// Optimized event stream for handling incoming events
export class OptimizedEventStream {
  private listeners: Map<string, Set<(event: BatchEvent | TodoEvent) => void>> =
    new Map();
  private optimizer: TodoEventOptimizer;

  constructor(optimizer: TodoEventOptimizer) {
    this.optimizer = optimizer;
  }

  // Process a batch of events efficiently
  processBatch(events: TodoEvent[]): void {
    // Group events by session for more efficient processing
    const eventsBySession = new Map<string, TodoEvent[]>();

    events.forEach((event) => {
      if (!eventsBySession.has(event.sessionId)) {
        eventsBySession.set(event.sessionId, []);
      }
      eventsBySession.get(event.sessionId)!.push(event);
    });

    // Process each session's events
    eventsBySession.forEach((sessionEvents, sessionId) => {
      // Create batch event for this session
      const batchEvent: BatchEvent = {
        events: sessionEvents,
        id: this.optimizer['generateId'](),
        sessionId,
        timestamp: Date.now(),
        type: 'BATCH_UPDATE',
      };

      // Publish batch event
      this.publish(batchEvent);
    });
  }

  // Publish an event to all subscribers
  publish(event: BatchEvent | TodoEvent): void {
    // Add to optimizer queue
    if ('events' in event) {
      // Batch event
      this.optimizer.addEvents(event.events);
    } else {
      // Single event
      this.optimizer.addEvent(event);
    }

    // Notify subscribers
    const sessionListeners = this.listeners.get(event.sessionId);
    if (sessionListeners) {
      sessionListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Subscribe to events for a specific session
  subscribe(
    sessionId: string,
    callback: (event: BatchEvent | TodoEvent) => void,
  ): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }

    const sessionListeners = this.listeners.get(sessionId)!;
    sessionListeners.add(callback);

    // Return unsubscribe function
    return () => {
      sessionListeners.delete(callback);
      if (sessionListeners.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }
}

// Event batching and optimization manager
export class TodoEventOptimizer {
  private batchTimer: NodeJS.Timeout | null = null;
  private config: EventBatchingConfig;
  private eventQueue: TodoEvent[] = [];
  private redisClient: any;

  constructor(config: Partial<EventBatchingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.redisClient = getRedisClientInstance();
  }

  // Add a single event to the queue
  addEvent(event: TodoEvent): void {
    // Check queue size limit
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn('Event queue is full, dropping oldest events');
      this.eventQueue = this.eventQueue.slice(
        this.eventQueue.length - this.config.maxQueueSize + 1,
      );
    }

    this.eventQueue.push(event);

    // Check if we should flush the batch
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // Set timer for partial batch
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchTimeout);
    }
  }

  // Add multiple events to the queue
  addEvents(events: TodoEvent[]): void {
    events.forEach((event) => this.addEvent(event));
  }

  // Force flush all pending events
  async flushAll(): Promise<void> {
    await this.flushBatch();
  }

  // Get current queue size
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  // Update configuration
  updateConfig(newConfig: Partial<EventBatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Compress event payload to reduce network overhead
  private compressEvent(event: BatchEvent | TodoEvent): BatchEvent | TodoEvent {
    // For now, we'll just return the event as-is
    // In a more advanced implementation, we could:
    // 1. Remove redundant data
    // 2. Use binary serialization
    // 3. Apply actual compression algorithms
    return event;
  }

  // Flush the current batch of events
  private async flushBatch(): Promise<void> {
    // Clear timer if it exists
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Nothing to flush
    if (this.eventQueue.length === 0) {
      return;
    }

    // Create batch event
    const batchEvent: BatchEvent = {
      events: [...this.eventQueue],
      id: this.generateId(),
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      type: 'BATCH_UPDATE',
    };

    // Clear the queue
    this.eventQueue = [];

    // Send batch event
    await this.sendEvent(batchEvent);
  }

  // Generate unique ID for events
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get current session ID (this would come from context in real implementation)
  private getSessionId(): string {
    // This is a placeholder - in real implementation, this would come from the execution context
    return 'default';
  }

  // Send a single event or batch
  private async sendEvent(event: BatchEvent | TodoEvent): Promise<void> {
    try {
      // Optimize payload if needed
      const optimizedEvent = this.config.enableCompression
        ? this.compressEvent(event)
        : event;

      // Send to Redis pub/sub
      if (this.redisClient) {
        const channel = `todo_events:${event.sessionId}`;
        await this.redisClient.publish(channel, JSON.stringify(optimizedEvent));
      }

      console.log(`Sent ${event.type} event for session ${event.sessionId}`);
    } catch (error) {
      console.error('Failed to send todo event:', error);
      // TODO: Implement retry logic or dead letter queue
    }
  }
}

// Global instances
export const todoEventOptimizer = new TodoEventOptimizer();
export const optimizedEventStream = new OptimizedEventStream(
  todoEventOptimizer,
);

// Utility function to create batch events
export function createBatchEvent(
  sessionId: string,
  events: TodoEvent[],
): BatchEvent {
  return {
    events,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    sessionId,
    timestamp: Date.now(),
    type: 'BATCH_UPDATE',
  };
}

// Utility function to create todo events
export function createTodoEvent(
  type: TodoEventType,
  sessionId: string,
  data: any,
): TodoEvent {
  return {
    data,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    sessionId,
    timestamp: Date.now(),
    type,
  };
}
