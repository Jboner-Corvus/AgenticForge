import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "./chunk-2TWFUMQU.js";
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/todoEventOptimization.ts
init_esm_shims();
var DEFAULT_CONFIG = {
  batchSize: 10,
  batchTimeout: 100,
  // 100ms
  enableCompression: true,
  maxQueueSize: 1e3
};
var OptimizedEventStream = class {
  listeners = /* @__PURE__ */ new Map();
  optimizer;
  constructor(optimizer) {
    this.optimizer = optimizer;
  }
  // Process a batch of events efficiently
  processBatch(events) {
    const eventsBySession = /* @__PURE__ */ new Map();
    events.forEach((event) => {
      if (!eventsBySession.has(event.sessionId)) {
        eventsBySession.set(event.sessionId, []);
      }
      eventsBySession.get(event.sessionId).push(event);
    });
    eventsBySession.forEach((sessionEvents, sessionId) => {
      const batchEvent = {
        events: sessionEvents,
        id: this.optimizer["generateId"](),
        sessionId,
        timestamp: Date.now(),
        type: "BATCH_UPDATE"
      };
      this.publish(batchEvent);
    });
  }
  // Publish an event to all subscribers
  publish(event) {
    if ("events" in event) {
      this.optimizer.addEvents(event.events);
    } else {
      this.optimizer.addEvent(event);
    }
    const sessionListeners = this.listeners.get(event.sessionId);
    if (sessionListeners) {
      sessionListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }
  // Subscribe to events for a specific session
  subscribe(sessionId, callback) {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, /* @__PURE__ */ new Set());
    }
    const sessionListeners = this.listeners.get(sessionId);
    sessionListeners.add(callback);
    return () => {
      sessionListeners.delete(callback);
      if (sessionListeners.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }
};
var TodoEventOptimizer = class {
  batchTimer = null;
  config;
  eventQueue = [];
  redisClient;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.redisClient = getRedisClientInstance();
  }
  // Add a single event to the queue
  addEvent(event) {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn("Event queue is full, dropping oldest events");
      this.eventQueue = this.eventQueue.slice(
        this.eventQueue.length - this.config.maxQueueSize + 1
      );
    }
    this.eventQueue.push(event);
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchTimeout);
    }
  }
  // Add multiple events to the queue
  addEvents(events) {
    events.forEach((event) => this.addEvent(event));
  }
  // Force flush all pending events
  async flushAll() {
    await this.flushBatch();
  }
  // Get current queue size
  getQueueSize() {
    return this.eventQueue.length;
  }
  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  // Compress event payload to reduce network overhead
  compressEvent(event) {
    return event;
  }
  // Flush the current batch of events
  async flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.eventQueue.length === 0) {
      return;
    }
    const batchEvent = {
      events: [...this.eventQueue],
      id: this.generateId(),
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      type: "BATCH_UPDATE"
    };
    this.eventQueue = [];
    await this.sendEvent(batchEvent);
  }
  // Generate unique ID for events
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  // Get current session ID (this would come from context in real implementation)
  getSessionId() {
    return "default";
  }
  // Send a single event or batch
  async sendEvent(event) {
    try {
      const optimizedEvent = this.config.enableCompression ? this.compressEvent(event) : event;
      if (this.redisClient) {
        const channel = `todo_events:${event.sessionId}`;
        await this.redisClient.publish(channel, JSON.stringify(optimizedEvent));
      }
      console.log(`Sent ${event.type} event for session ${event.sessionId}`);
    } catch (error) {
      console.error("Failed to send todo event:", error);
    }
  }
};
var todoEventOptimizer = new TodoEventOptimizer();
var optimizedEventStream = new OptimizedEventStream(
  todoEventOptimizer
);
function createBatchEvent(sessionId, events) {
  return {
    events,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    sessionId,
    timestamp: Date.now(),
    type: "BATCH_UPDATE"
  };
}
function createTodoEvent(type, sessionId, data) {
  return {
    data,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    sessionId,
    timestamp: Date.now(),
    type
  };
}

export {
  OptimizedEventStream,
  TodoEventOptimizer,
  todoEventOptimizer,
  optimizedEventStream,
  createBatchEvent,
  createTodoEvent
};
