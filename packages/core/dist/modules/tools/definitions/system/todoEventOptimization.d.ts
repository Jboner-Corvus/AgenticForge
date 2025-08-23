interface BatchEvent {
    events: TodoEvent[];
    id: string;
    sessionId: string;
    timestamp: number;
    type: 'BATCH_UPDATE';
}
interface EventBatchingConfig {
    batchSize: number;
    batchTimeout: number;
    enableCompression: boolean;
    maxQueueSize: number;
}
interface TodoEvent {
    data: any;
    id: string;
    sessionId: string;
    timestamp: number;
    type: TodoEventType;
}
type TodoEventType = 'BATCH_UPDATE' | 'PROJECT_CREATED' | 'PROJECT_DELETED' | 'PROJECT_UPDATED' | 'STATE_SYNC' | 'TASK_CREATED' | 'TASK_DELETED' | 'TASK_UPDATED';
declare class OptimizedEventStream {
    private listeners;
    private optimizer;
    constructor(optimizer: TodoEventOptimizer);
    processBatch(events: TodoEvent[]): void;
    publish(event: BatchEvent | TodoEvent): void;
    subscribe(sessionId: string, callback: (event: BatchEvent | TodoEvent) => void): () => void;
}
declare class TodoEventOptimizer {
    private batchTimer;
    private config;
    private eventQueue;
    private redisClient;
    constructor(config?: Partial<EventBatchingConfig>);
    addEvent(event: TodoEvent): void;
    addEvents(events: TodoEvent[]): void;
    flushAll(): Promise<void>;
    getQueueSize(): number;
    updateConfig(newConfig: Partial<EventBatchingConfig>): void;
    private compressEvent;
    private flushBatch;
    private generateId;
    private getSessionId;
    private sendEvent;
}
declare const todoEventOptimizer: TodoEventOptimizer;
declare const optimizedEventStream: OptimizedEventStream;
declare function createBatchEvent(sessionId: string, events: TodoEvent[]): BatchEvent;
declare function createTodoEvent(type: TodoEventType, sessionId: string, data: any): TodoEvent;

export { type BatchEvent, type EventBatchingConfig, OptimizedEventStream, type TodoEvent, TodoEventOptimizer, type TodoEventType, createBatchEvent, createTodoEvent, optimizedEventStream, todoEventOptimizer };
