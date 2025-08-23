declare class MemoryMonitor {
    getMemoryReport(): {
        formatted: Record<string, string>;
        timestamp: number;
        arrayBuffers: number;
        external: number;
        heapTotal: number;
        heapUsed: number;
        rss: number;
        limit?: undefined;
        total?: undefined;
        used?: undefined;
    } | {
        formatted: Record<string, string>;
        timestamp: number;
        limit: any;
        total: any;
        used: any;
        arrayBuffers?: undefined;
        external?: undefined;
        heapTotal?: undefined;
        heapUsed?: undefined;
        rss?: undefined;
    } | null;
    getMemoryUsage(): {
        arrayBuffers: number;
        external: number;
        heapTotal: number;
        heapUsed: number;
        rss: number;
        limit?: undefined;
        total?: undefined;
        used?: undefined;
    } | {
        limit: any;
        total: any;
        used: any;
        arrayBuffers?: undefined;
        external?: undefined;
        heapTotal?: undefined;
        heapUsed?: undefined;
        rss?: undefined;
    } | null;
    isMemoryUsageHigh(threshold?: number): boolean;
    private formatMemoryUsage;
}
declare class TodoAnalytics {
    private eventLog;
    private sessionStats;
    private userStats;
    getAnalyticsReport(): {
        recentEvents: {
            data?: any;
            event: string;
            sessionId?: string;
            timestamp: number;
            userId?: string;
        }[];
        timestamp: string;
        usage: {
            eventsPerSession: number;
            eventsPerUser: number;
            sessionStats: {
                [k: string]: {
                    duration: number;
                    projectCount: number;
                    startTime: number;
                    taskCount: number;
                };
            };
            topEvents: [string, number][];
            totalEvents: number;
            uniqueSessions: number;
            uniqueUsers: number;
            userStats: {
                [k: string]: {
                    lastActive: number;
                    projectCount: number;
                    taskCount: number;
                };
            };
        };
    };
    getRecentEvents(count?: number): {
        data?: any;
        event: string;
        sessionId?: string;
        timestamp: number;
        userId?: string;
    }[];
    getSessionEvents(sessionId: string, count?: number): {
        data?: any;
        event: string;
        sessionId?: string;
        timestamp: number;
        userId?: string;
    }[];
    getSessionStats(sessionId: string): {
        duration: number;
        projectCount: number;
        startTime: number;
        taskCount: number;
    } | null;
    getUsageStats(): {
        eventsPerSession: number;
        eventsPerUser: number;
        sessionStats: {
            [k: string]: {
                duration: number;
                projectCount: number;
                startTime: number;
                taskCount: number;
            };
        };
        topEvents: [string, number][];
        totalEvents: number;
        uniqueSessions: number;
        uniqueUsers: number;
        userStats: {
            [k: string]: {
                lastActive: number;
                projectCount: number;
                taskCount: number;
            };
        };
    };
    getUserEvents(userId: string, count?: number): {
        data?: any;
        event: string;
        sessionId?: string;
        timestamp: number;
        userId?: string;
    }[];
    getUserStats(userId: string): {
        lastActive: number;
        projectCount: number;
        taskCount: number;
    } | null;
    reset(): void;
    trackEvent(event: string, userId?: string, sessionId?: string, data?: any): void;
}
declare class TodoPerformanceMonitor {
    private errorCounts;
    private metrics;
    private operationCounts;
    private operationTimings;
    getAllMetricStats(): Record<string, any>;
    getAllOperationStats(): Record<string, any>;
    getMetricStats(metricName: string): {
        avg: number;
        count: number;
        max: number;
        median: number;
        min: number;
        p95: number;
        p99: number;
    } | null;
    getOperationStats(operation: string): {
        avgDuration: number;
        count: number;
        errors: number;
        maxDuration: number;
        medianDuration: number;
        minDuration: number;
        p95: number;
        p99: number;
    } | null;
    getPerformanceReport(): {
        metrics: Record<string, any>;
        operations: Record<string, any>;
        timestamp: string;
        uptime: number;
    };
    recordError(operation: string): void;
    recordMetric(metricName: string, value: number): void;
    recordOperation(operation: string, duration: number): void;
    reset(): void;
}
declare const todoPerformanceMonitor: TodoPerformanceMonitor;
declare const todoAnalytics: TodoAnalytics;
declare const memoryMonitor: MemoryMonitor;
declare function measureAsyncOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T>;
declare function measureOperation<T>(operationName: string, operation: () => T): T;
declare function performanceMonitor(operationName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

export { MemoryMonitor, TodoAnalytics, TodoPerformanceMonitor, measureAsyncOperation, measureOperation, memoryMonitor, performanceMonitor, todoAnalytics, todoPerformanceMonitor };
