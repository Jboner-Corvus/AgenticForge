// Memory usage monitor
export class MemoryMonitor {
  // Get memory usage report
  getMemoryReport() {
    const mem = this.getMemoryUsage();
    if (!mem) return null;

    return {
      ...mem,
      formatted: this.formatMemoryUsage(mem),
      timestamp: Date.now(),
    };
  }

  // Get current memory usage
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return {
        arrayBuffers: mem.arrayBuffers,
        external: mem.external,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        rss: mem.rss,
      };
    }

    // Browser environment
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        limit: mem.jsHeapSizeLimit,
        total: mem.totalJSHeapSize,
        used: mem.usedJSHeapSize,
      };
    }

    return null;
  }

  // Check if memory usage is high
  isMemoryUsageHigh(threshold: number = 0.8) {
    const mem = this.getMemoryUsage();
    if (!mem) return false;

    // Check if we're in Node.js environment
    if (
      typeof process !== 'undefined' &&
      typeof process.memoryUsage === 'function'
    ) {
      // Node.js environment
      if (
        'heapUsed' in mem &&
        'heapTotal' in mem &&
        typeof mem.heapUsed === 'number' &&
        typeof mem.heapTotal === 'number' &&
        mem.heapTotal > 0
      ) {
        return mem.heapUsed / mem.heapTotal > threshold;
      }
    } else {
      // Browser environment
      if (
        'used' in mem &&
        'total' in mem &&
        typeof mem.used === 'number' &&
        typeof mem.total === 'number' &&
        mem.total > 0
      ) {
        return mem.used / mem.total > threshold;
      }
    }

    return false;
  }

  // Format memory usage for display
  private formatMemoryUsage(mem: any) {
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatted: Record<string, string> = {};
    for (const [key, value] of Object.entries(mem)) {
      if (typeof value === 'number') {
        formatted[key] = formatBytes(value);
      } else {
        formatted[key] = String(value);
      }
    }

    return formatted;
  }
}

// Analytics service for tracking user behavior and system usage
export class TodoAnalytics {
  private eventLog: Array<{
    data?: any;
    event: string;
    sessionId?: string;
    timestamp: number;
    userId?: string;
  }> = [];

  private sessionStats: Map<
    string,
    {
      duration: number;
      projectCount: number;
      startTime: number;
      taskCount: number;
    }
  > = new Map();

  private userStats: Map<
    string,
    {
      lastActive: number;
      projectCount: number;
      taskCount: number;
    }
  > = new Map();

  // Get a full analytics report
  getAnalyticsReport() {
    return {
      recentEvents: this.getRecentEvents(50),
      timestamp: new Date().toISOString(),
      usage: this.getUsageStats(),
    };
  }

  // Get recent events
  getRecentEvents(count: number = 100) {
    return this.eventLog.slice(-count);
  }

  // Get events for a specific session
  getSessionEvents(sessionId: string, count: number = 100) {
    return this.eventLog
      .filter((event) => event.sessionId === sessionId)
      .slice(-count);
  }

  // Get session statistics
  getSessionStats(sessionId: string) {
    return this.sessionStats.get(sessionId) || null;
  }

  // Get usage statistics
  getUsageStats() {
    const totalEvents = this.eventLog.length;
    const uniqueUsers = new Set(
      this.eventLog.map((e) => e.userId).filter(Boolean),
    ).size;
    const uniqueSessions = new Set(
      this.eventLog.map((e) => e.sessionId).filter(Boolean),
    ).size;

    // Calculate events per user
    const eventsPerUser = uniqueUsers > 0 ? totalEvents / uniqueUsers : 0;

    // Calculate events per session
    const eventsPerSession =
      uniqueSessions > 0 ? totalEvents / uniqueSessions : 0;

    // Get most common events
    const eventCounts: Record<string, number> = {};
    this.eventLog.forEach((event) => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    });

    const sortedEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      eventsPerSession,
      eventsPerUser,
      sessionStats: Object.fromEntries(this.sessionStats),
      topEvents: sortedEvents,
      totalEvents,
      uniqueSessions,
      uniqueUsers,
      userStats: Object.fromEntries(this.userStats),
    };
  }

  // Get events for a specific user
  getUserEvents(userId: string, count: number = 100) {
    return this.eventLog
      .filter((event) => event.userId === userId)
      .slice(-count);
  }

  // Get user statistics
  getUserStats(userId: string) {
    return this.userStats.get(userId) || null;
  }

  // Reset analytics data
  reset() {
    this.eventLog = [];
    this.userStats.clear();
    this.sessionStats.clear();
  }

  // Track an event
  trackEvent(event: string, userId?: string, sessionId?: string, data?: any) {
    // Add to event log
    this.eventLog.push({
      data,
      event,
      sessionId,
      timestamp: Date.now(),
      userId,
    });

    // Keep only the last 10000 events to prevent memory issues
    if (this.eventLog.length > 10000) {
      this.eventLog.shift();
    }

    // Update user stats
    if (userId) {
      const userStat = this.userStats.get(userId) || {
        lastActive: Date.now(),
        projectCount: 0,
        taskCount: 0,
      };

      // Update based on event type
      if (event === 'task_created') {
        userStat.taskCount++;
      } else if (event === 'project_created') {
        userStat.projectCount++;
      }

      userStat.lastActive = Date.now();
      this.userStats.set(userId, userStat);
    }

    // Update session stats
    if (sessionId) {
      const sessionStat = this.sessionStats.get(sessionId) || {
        duration: 0,
        projectCount: 0,
        startTime: Date.now(),
        taskCount: 0,
      };

      // Update based on event type
      if (event === 'task_created') {
        sessionStat.taskCount++;
      } else if (event === 'project_created') {
        sessionStat.projectCount++;
      }

      sessionStat.duration = Date.now() - sessionStat.startTime;
      this.sessionStats.set(sessionId, sessionStat);
    }
  }
}

// Performance monitoring and analytics for todo list operations
export class TodoPerformanceMonitor {
  private errorCounts: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();
  private operationCounts: Map<string, number> = new Map();
  private operationTimings: Map<string, number[]> = new Map();

  // Get all metric statistics
  getAllMetricStats() {
    const stats: Record<string, any> = {};

    for (const metric of this.metrics.keys()) {
      stats[metric] = this.getMetricStats(metric);
    }

    return stats;
  }

  // Get all operation statistics
  getAllOperationStats() {
    const stats: Record<string, any> = {};

    for (const operation of this.operationTimings.keys()) {
      stats[operation] = this.getOperationStats(operation);
    }

    return stats;
  }

  // Get metric statistics
  getMetricStats(metricName: string) {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) {
      return null;
    }

    // Calculate statistics
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return {
      avg: avg,
      count: values.length,
      max: max,
      median: median,
      min: min,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // Get operation statistics
  getOperationStats(operation: string) {
    const timings = this.operationTimings.get(operation) || [];
    if (timings.length === 0) {
      return null;
    }

    // Calculate statistics
    const sorted = [...timings].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return {
      avgDuration: avg,
      count: this.operationCounts.get(operation) || 0,
      errors: this.errorCounts.get(operation) || 0,
      maxDuration: max,
      medianDuration: median,
      minDuration: min,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // Get a performance report
  getPerformanceReport() {
    return {
      metrics: this.getAllMetricStats(),
      operations: this.getAllOperationStats(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
    };
  }

  // Record error
  recordError(operation: string) {
    this.errorCounts.set(operation, (this.errorCounts.get(operation) || 0) + 1);
  }

  // Record custom metric
  recordMetric(metricName: string, value: number) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    this.metrics.get(metricName)!.push(value);

    // Keep only the last 1000 values to prevent memory issues
    if (this.metrics.get(metricName)!.length > 1000) {
      this.metrics.get(metricName)!.shift();
    }
  }

  // Record operation timing
  recordOperation(operation: string, duration: number) {
    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }

    this.operationTimings.get(operation)!.push(duration);

    // Keep only the last 1000 timings to prevent memory issues
    if (this.operationTimings.get(operation)!.length > 1000) {
      this.operationTimings.get(operation)!.shift();
    }

    // Update operation count
    this.operationCounts.set(
      operation,
      (this.operationCounts.get(operation) || 0) + 1,
    );
  }

  // Reset all metrics
  reset() {
    this.metrics.clear();
    this.operationCounts.clear();
    this.operationTimings.clear();
    this.errorCounts.clear();
  }
}

// Global instances
export const todoPerformanceMonitor = new TodoPerformanceMonitor();
export const todoAnalytics = new TodoAnalytics();
export const memoryMonitor = new MemoryMonitor();

// Utility function to measure async operation performance
export async function measureAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
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

// Utility function to measure sync operation performance
export function measureOperation<T>(
  operationName: string,
  operation: () => T,
): T {
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

// Performance monitoring decorator
export function performanceMonitor(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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
