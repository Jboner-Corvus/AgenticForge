export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  sessionId?: string;
  jobId?: string;
}

export interface TodoWebSocketMessage extends WebSocketMessage {
  type: 'claude_code_todo' | 'unified_todo' | 'todo_list';
  data: {
    type: string;
    sessionId?: string;
    timestamp: number;
    title: string;
    todos: Array<{
      id: string;
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      priority?: string;
      createdAt?: number;
      updatedAt?: number;
    }>;
    stats: {
      pending: number;
      in_progress: number;
      completed: number;
      total: number;
    };
  };
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageListeners: Map<
    string,
    Array<(message: WebSocketMessage) => void>
  > = new Map();
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private jobId: string | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private lastActivity = Date.now();
  private connectionTimeout: NodeJS.Timeout | null = null;

  // Performance optimization: message queuing and batching
  private messageQueue: WebSocketMessage[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 100; // 100ms

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(): string {
    // Construire l'URL WebSocket à partir de l'URL actuelle
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    // En production Docker, le WebSocket doit se connecter via le proxy nginx
    // qui forward vers le backend. Utiliser le même host/port que le frontend.
    return `${protocol}//${host}/ws`;
  }

  private getAuthHeaders(): { [key: string]: string } {
    // Récupérer le token d'authentification depuis les variables d'environnement ou localStorage
    const token = import.meta.env.VITE_AUTH_TOKEN ||
                 localStorage.getItem('auth_token') ||
                 document.cookie
                   .split('; ')
                   .find(row => row.startsWith('agenticforge_session_id='))
                   ?.split('=')[1];

    const headers: { [key: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Session-ID'] = token;
    }

    return headers;
  }

  public connect(): void {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN) ||
      this.connectionState === 'connected'
    ) {
      return;
    }

    this.updateConnectionState('connecting');
    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    const authHeaders = this.getAuthHeaders();

    console.log(`📡 [WebSocket] Connecting to ${wsUrl}...`);
    if (Object.keys(authHeaders).length > 0) {
      console.log('📡 [WebSocket] Using authentication headers');
    }

    // Set connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (this.connectionState === 'connecting') {
        console.warn('📡 [WebSocket] Connection timeout, scheduling reconnect...');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, 10000); // 10 second timeout

    try {
      // Append auth token as URL parameter for WebSocket connection
      const urlWithAuth = new URL(wsUrl);

      // Add the token as a query parameter for WebSocket authentication
      if (authHeaders['Authorization']) {
        const token = authHeaders['Authorization'].replace('Bearer ', '');
        urlWithAuth.searchParams.set('token', token);
        console.log('📡 [WebSocket] Added auth token to URL params');
      }

      this.ws = new WebSocket(urlWithAuth.toString());
      this.setupEventListeners();
    } catch (error) {
      console.error('📡 [WebSocket] Connection failed:', error);
      this.handleConnectionError(error as Error);
    }
  }

  private updateConnectionState(state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'): void {
    this.connectionState = state;
    this.lastActivity = Date.now();

    // Clear connection timeout if connected
    if (state === 'connected' && this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private handleConnectionError(error: Error): void {
    this.isConnecting = false;
    this.updateConnectionState('disconnected');

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    console.error('📡 [WebSocket] Connection error:', error.message);
    this.scheduleReconnect();
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('📡 [WebSocket] Connected successfully');
      this.updateConnectionState('connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionListeners(true);

      // Send any queued messages
      if (this.messageQueue.length > 0) {
        console.log(`📡 [WebSocket] Sending ${this.messageQueue.length} queued messages`);
        this.processBatch();
      }

      // S'abonner aux événements de job si on a un jobId
      if (this.jobId) {
        this.subscribeToJobEvents(this.jobId);
      }
    };

    this.ws.onmessage = (event) => {
      this.lastActivity = Date.now();
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📡 [WebSocket] Received message:', message.type);

        // Distribuer le message aux listeners appropriés
        this.distributeMessage(message);
      } catch (error) {
        console.error('📡 [WebSocket] Failed to parse message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`📡 [WebSocket] Connection closed (code: ${event.code}, reason: ${event.reason})`);
      this.updateConnectionState('disconnected');
      this.isConnecting = false;
      this.stopHeartbeat();
      this.notifyConnectionListeners(false);

      // Only reconnect if not a normal closure and we haven't reached max attempts
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('📡 [WebSocket] Scheduling reconnection...');
        this.updateConnectionState('reconnecting');
        this.scheduleReconnect();
      } else if (event.code !== 1000) {
        console.warn('📡 [WebSocket] Max reconnection attempts reached, giving up');
      }
    };

    this.ws.onerror = (error) => {
      console.error('📡 [WebSocket] Error:', error);
      this.lastActivity = Date.now();
    };
  }

  private distributeMessage(message: WebSocketMessage): void {
    // Envoyer aux listeners spécifiques du type de message
    const typeListeners = this.messageListeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error(
            `📡 [WebSocket] Listener error for ${message.type}:`,
            error,
          );
        }
      });
    }

    // Envoyer aussi aux listeners génériques
    const generalListeners = this.messageListeners.get('*');
    if (generalListeners) {
      generalListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error('📡 [WebSocket] General listener error:', error);
        }
      });
    }

    // Pour compatibilité avec le système existant, envoyer aussi via postMessage
    if (
      message.type === 'claude_code_todo' ||
      message.type === 'unified_todo' ||
      message.type === 'todo_list'
    ) {
      window.postMessage(message, '*');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('📡 [WebSocket] Max reconnection attempts reached');
      this.notifyReconnectFailed();
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `📡 [WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    setTimeout(() => {
      if (!this.isConnected()) {
        this.connect();
      }
    }, delay);
  }

  private notifyReconnectFailed(): void {
    const errorListeners = this.messageListeners.get('connection_error');
    if (errorListeners) {
      errorListeners.forEach((listener) => {
        try {
          listener({
            type: 'connection_error',
            data: {
              message: 'Failed to reconnect after multiple attempts',
              attempts: this.reconnectAttempts
            },
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('📡 [WebSocket] Error listener failed:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingStart = Date.now();
        this.send({
          type: 'ping',
          data: {
            timestamp: pingStart,
            latency: this.lastActivity ? pingStart - this.lastActivity : 0
          },
          timestamp: pingStart,
        });
      }
    }, 30000); // Ping every 30 seconds

    // Add connection health check every 5 minutes
    setInterval(() => {
      if (this.connectionState === 'connected' && this.lastActivity) {
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        if (timeSinceLastActivity > 300000) { // 5 minutes
          console.warn('📡 [WebSocket] No activity for 5 minutes, checking connection health');
          // Send a test message to verify connection
          this.send({
            type: 'health_check',
            data: {},
            timestamp: Date.now(),
          });
        }
      }
    }, 60000); // Check every minute
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error('📡 [WebSocket] Connection listener error:', error);
      }
    });
  }

  public send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('📡 [WebSocket] Cannot send message, not connected');
      // Queue message for later sending
      this.messageQueue.push(message);
      return false;
    }

    try {
      // For high-frequency messages (like pings), send immediately
      if (message.type === 'ping' || message.type === 'health_check') {
        this.ws.send(JSON.stringify(message));
        return true;
      }

      // Add to batch queue
      this.messageQueue.push(message);
      this.processBatch();
      return true;
    } catch (error) {
      console.error('📡 [WebSocket] Failed to send message:', error);
      return false;
    }
  }

  private processBatch(): void {
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // If we have enough messages, send immediately
    if (this.messageQueue.length >= this.BATCH_SIZE) {
      this.sendBatch();
    } else {
      // Wait for more messages or timeout
      this.batchTimeout = setTimeout(() => {
        if (this.messageQueue.length > 0) {
          this.sendBatch();
        }
      }, this.BATCH_DELAY);
    }
  }

  private sendBatch(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.messageQueue.length === 0) {
      return;
    }

    const batch = this.messageQueue.splice(0, this.BATCH_SIZE);

    if (batch.length === 1) {
      // Single message, send normally
      this.ws.send(JSON.stringify(batch[0]));
    } else {
      // Multiple messages, send as batch
      const batchMessage = {
        type: 'batch',
        data: {
          messages: batch,
          count: batch.length
        },
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(batchMessage));
    }

    console.log(`📡 [WebSocket] Sent batch of ${batch.length} messages`);
  }

  // Send message immediately without batching
  public sendImmediate(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('📡 [WebSocket] Cannot send immediate message, not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('📡 [WebSocket] Failed to send immediate message:', error);
      return false;
    }
  }

  public subscribe(
    messageType: string,
    listener: (message: WebSocketMessage) => void,
  ): () => void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, []);
    }

    this.messageListeners.get(messageType)!.push(listener);

    // Retourner une fonction de désinscription
    return () => {
      const listeners = this.messageListeners.get(messageType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  public onConnectionChange(
    listener: (connected: boolean) => void,
  ): () => void {
    this.connectionListeners.push(listener);

    // Notifier immédiatement de l'état actuel
    listener(this.isConnected());

    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public setJobId(jobId: string | null): void {
    this.jobId = jobId;
    if (jobId && this.isConnected()) {
      this.subscribeToJobEvents(jobId);
    }
  }

  public setSessionId(_sessionId: string | null): void {
    // Session ID is not stored locally, only used for message routing
  }

  private subscribeToJobEvents(jobId: string): void {
    this.send({
      type: 'subscribe_job_events',
      data: { jobId },
      timestamp: Date.now(),
      jobId,
    });
  }

  public subscribeToTodos(
    listener: (message: TodoWebSocketMessage) => void,
  ): () => void {
    const unsubscribes = [
      this.subscribe('claude_code_todo', listener as any),
      this.subscribe('unified_todo', listener as any),
      this.subscribe('todo_list', listener as any),
    ];

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }

  public disconnect(): void {
    console.log('📡 [WebSocket] Disconnecting...');

    this.stopHeartbeat();
    this.updateConnectionState('disconnected');

    // Clean up timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    // Clear message queue
    this.messageQueue.length = 0;
    this.messageListeners.clear();
    this.connectionListeners.length = 0;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // Performance and status utilities
  public getConnectionState(): string {
    return this.connectionState;
  }

  public getConnectionStats(): {
    state: string;
    isConnected: boolean;
    reconnectAttempts: number;
    lastActivity: number;
    uptime?: number;
  } {
    return {
      state: this.connectionState,
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      lastActivity: this.lastActivity,
      uptime: this.connectionState === 'connected' ? Date.now() - this.lastActivity : undefined,
    };
  }

  public forceReconnect(): void {
    console.log('📡 [WebSocket] Force reconnect requested');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}

// Instance singleton
export const websocketService = new WebSocketService();

// Hook React pour utiliser le service WebSocket
export function useWebSocket() {
  return websocketService;
}

export default websocketService;
