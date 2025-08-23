import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  init_esm_shims
} from "./chunk-SB7UONON.js";

// src/modules/tools/definitions/system/todoPerformanceMonitoring.ts
init_esm_shims();
var MemoryMonitor = class {
  // Get memory usage report
  getMemoryReport() {
    const mem = this.getMemoryUsage();
    if (!mem) return null;
    return {
      ...mem,
      formatted: this.formatMemoryUsage(mem),
      timestamp: Date.now()
    };
  }
  // Get current memory usage
  getMemoryUsage() {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        arrayBuffers: mem.arrayBuffers,
        external: mem.external,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        rss: mem.rss
      };
    }
    if (typeof performance !== "undefined" && performance.memory) {
      const mem = performance.memory;
      return {
        limit: mem.jsHeapSizeLimit,
        total: mem.totalJSHeapSize,
        used: mem.usedJSHeapSize
      };
    }
    return null;
  }
  // Check if memory usage is high
  isMemoryUsageHigh(threshold = 0.8) {
    const mem = this.getMemoryUsage();
    if (!mem) return false;
    if (typeof process !== "undefined" && typeof process.memoryUsage === "function") {
      if ("heapUsed" in mem && "heapTotal" in mem && typeof mem.heapUsed === "number" && typeof mem.heapTotal === "number" && mem.heapTotal > 0) {
        return mem.heapUsed / mem.heapTotal > threshold;
      }
    } else {
      if ("used" in mem && "total" in mem && typeof mem.used === "number" && typeof mem.total === "number" && mem.total > 0) {
        return mem.used / mem.total > threshold;
      }
    }
    return false;
  }
  // Format memory usage for display
  formatMemoryUsage(mem) {
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    const formatted = {};
    for (const [key, value] of Object.entries(mem)) {
      if (typeof value === "number") {
        formatted[key] = formatBytes(value);
      } else {
        formatted[key] = String(value);
      }
    }
    return formatted;
  }
};
var TodoAnalytics = class {
  eventLog = [];
  sessionStats = /* @__PURE__ */ new Map();
  userStats = /* @__PURE__ */ new Map();
  // Get a full analytics report
  getAnalyticsReport() {
    return {
      recentEvents: this.getRecentEvents(50),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      usage: this.getUsageStats()
    };
  }
  // Get recent events
  getRecentEvents(count = 100) {
    return this.eventLog.slice(-count);
  }
  // Get events for a specific session
  getSessionEvents(sessionId, count = 100) {
    return this.eventLog.filter((event) => event.sessionId === sessionId).slice(-count);
  }
  // Get session statistics
  getSessionStats(sessionId) {
    return this.sessionStats.get(sessionId) || null;
  }
  // Get usage statistics
  getUsageStats() {
    const totalEvents = this.eventLog.length;
    const uniqueUsers = new Set(
      this.eventLog.map((e) => e.userId).filter(Boolean)
    ).size;
    const uniqueSessions = new Set(
      this.eventLog.map((e) => e.sessionId).filter(Boolean)
    ).size;
    const eventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;
    const eventsPerSession = uniqueSessions > 0 ? totalEvents / uniqueSessions : 0;
    const eventCounts = {};
    this.eventLog.forEach((event) => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    });
    const sortedEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      eventsPerSession,
      eventsPerUser,
      sessionStats: Object.fromEntries(this.sessionStats),
      topEvents: sortedEvents,
      totalEvents,
      uniqueSessions,
      uniqueUsers,
      userStats: Object.fromEntries(this.userStats)
    };
  }
  // Get events for a specific user
  getUserEvents(userId, count = 100) {
    return this.eventLog.filter((event) => event.userId === userId).slice(-count);
  }
  // Get user statistics
  getUserStats(userId) {
    return this.userStats.get(userId) || null;
  }
  // Reset analytics data
  reset() {
    this.eventLog = [];
    this.userStats.clear();
    this.sessionStats.clear();
  }
  // Track an event
  trackEvent(event, userId, sessionId, data) {
    this.eventLog.push({
      data,
      event,
      sessionId,
      timestamp: Date.now(),
      userId
    });
    if (this.eventLog.length > 1e4) {
      this.eventLog.shift();
    }
    if (userId) {
      const userStat = this.userStats.get(userId) || {
        lastActive: Date.now(),
        projectCount: 0,
        taskCount: 0
      };
      if (event === "task_created") {
        userStat.taskCount++;
      } else if (event === "project_created") {
        userStat.projectCount++;
      }
      userStat.lastActive = Date.now();
      this.userStats.set(userId, userStat);
    }
    if (sessionId) {
      const sessionStat = this.sessionStats.get(sessionId) || {
        duration: 0,
        projectCount: 0,
        startTime: Date.now(),
        taskCount: 0
      };
      if (event === "task_created") {
        sessionStat.taskCount++;
      } else if (event === "project_created") {
        sessionStat.projectCount++;
      }
      sessionStat.duration = Date.now() - sessionStat.startTime;
      this.sessionStats.set(sessionId, sessionStat);
    }
  }
};
var TodoPerformanceMonitor = class {
  errorCounts = /* @__PURE__ */ new Map();
  metrics = /* @__PURE__ */ new Map();
  operationCounts = /* @__PURE__ */ new Map();
  operationTimings = /* @__PURE__ */ new Map();
  // Get all metric statistics
  getAllMetricStats() {
    const stats = {};
    for (const metric of this.metrics.keys()) {
      stats[metric] = this.getMetricStats(metric);
    }
    return stats;
  }
  // Get all operation statistics
  getAllOperationStats() {
    const stats = {};
    for (const operation of this.operationTimings.keys()) {
      stats[operation] = this.getOperationStats(operation);
    }
    return stats;
  }
  // Get metric statistics
  getMetricStats(metricName) {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) {
      return null;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    return {
      avg,
      count: values.length,
      max,
      median,
      min,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  // Get operation statistics
  getOperationStats(operation) {
    const timings = this.operationTimings.get(operation) || [];
    if (timings.length === 0) {
      return null;
    }
    const sorted = [...timings].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    return {
      avgDuration: avg,
      count: this.operationCounts.get(operation) || 0,
      errors: this.errorCounts.get(operation) || 0,
      maxDuration: max,
      medianDuration: median,
      minDuration: min,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  // Get a performance report
  getPerformanceReport() {
    return {
      metrics: this.getAllMetricStats(),
      operations: this.getAllOperationStats(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime ? process.uptime() : 0
    };
  }
  // Record error
  recordError(operation) {
    this.errorCounts.set(operation, (this.errorCounts.get(operation) || 0) + 1);
  }
  // Record custom metric
  recordMetric(metricName, value) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName).push(value);
    if (this.metrics.get(metricName).length > 1e3) {
      this.metrics.get(metricName).shift();
    }
  }
  // Record operation timing
  recordOperation(operation, duration) {
    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }
    this.operationTimings.get(operation).push(duration);
    if (this.operationTimings.get(operation).length > 1e3) {
      this.operationTimings.get(operation).shift();
    }
    this.operationCounts.set(
      operation,
      (this.operationCounts.get(operation) || 0) + 1
    );
  }
  // Reset all metrics
  reset() {
    this.metrics.clear();
    this.operationCounts.clear();
    this.operationTimings.clear();
    this.errorCounts.clear();
  }
};
var todoPerformanceMonitor = new TodoPerformanceMonitor();
var todoAnalytics = new TodoAnalytics();
var memoryMonitor = new MemoryMonitor();
async function measureAsyncOperation(operationName, operation) {
  const start = Date.now();
  try {
    const result = await operation();
    const end = Date.now();
    todoPerformanceMonitor.recordOperation(operationName, end - start);
    return result;
  } catch (error) {
    const end = Date.now();
    todoPerformanceMonitor.recordOperation(operationName, end - start);
    todoPerformanceMonitor.recordError(operationName);
    throw error;
  }
}
function measureOperation(operationName, operation) {
  const start = Date.now();
  try {
    const result = operation();
    const end = Date.now();
    todoPerformanceMonitor.recordOperation(operationName, end - start);
    return result;
  } catch (error) {
    const end = Date.now();
    todoPerformanceMonitor.recordOperation(operationName, end - start);
    todoPerformanceMonitor.recordError(operationName);
    throw error;
  }
}
function performanceMonitor(operationName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const end = Date.now();
        todoPerformanceMonitor.recordOperation(operationName, end - start);
        return result;
      } catch (error) {
        const end = Date.now();
        todoPerformanceMonitor.recordOperation(operationName, end - start);
        todoPerformanceMonitor.recordError(operationName);
        throw error;
      }
    };
    return descriptor;
  };
}

export {
  MemoryMonitor,
  TodoAnalytics,
  TodoPerformanceMonitor,
  todoPerformanceMonitor,
  todoAnalytics,
  memoryMonitor,
  measureAsyncOperation,
  measureOperation,
  performanceMonitor
};
