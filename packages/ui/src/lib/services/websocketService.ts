
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
  private messageListeners: Map<string, Array<(message: WebSocketMessage) => void>> = new Map();
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private jobId: string | null = null;

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

  public connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    
    console.log(`📡 [WebSocket] Connecting to ${wsUrl}...`);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('📡 [WebSocket] Connection failed:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('📡 [WebSocket] Connected successfully');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionListeners(true);
      
      // S'abonner aux événements de job si on a un jobId
      if (this.jobId) {
        this.subscribeToJobEvents(this.jobId);
      }
    };

    this.ws.onmessage = (event) => {
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
      console.log(`📡 [WebSocket] Connection closed (code: ${event.code})`);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.notifyConnectionListeners(false);
      
      if (event.code !== 1000) { // Not a normal closure
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('📡 [WebSocket] Error:', error);
      this.isConnecting = false;
    };
  }

  private distributeMessage(message: WebSocketMessage): void {
    // Envoyer aux listeners spécifiques du type de message
    const typeListeners = this.messageListeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error(`📡 [WebSocket] Listener error for ${message.type}:`, error);
        }
      });
    }

    // Envoyer aussi aux listeners génériques
    const generalListeners = this.messageListeners.get('*');
    if (generalListeners) {
      generalListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('📡 [WebSocket] General listener error:', error);
        }
      });
    }

    // Pour compatibilité avec le système existant, envoyer aussi via postMessage
    if (message.type === 'claude_code_todo' || message.type === 'unified_todo' || message.type === 'todo_list') {
      window.postMessage(message, '*');
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('📡 [WebSocket] Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`📡 [WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
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
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('📡 [WebSocket] Failed to send message:', error);
      return false;
    }
  }

  public subscribe(messageType: string, listener: (message: WebSocketMessage) => void): () => void {
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

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
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
      jobId
    });
  }

  public subscribeToTodos(listener: (message: TodoWebSocketMessage) => void): () => void {
    const unsubscribes = [
      this.subscribe('claude_code_todo', listener as any),
      this.subscribe('unified_todo', listener as any),
      this.subscribe('todo_list', listener as any)
    ];
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.messageListeners.clear();
    this.connectionListeners.length = 0;
  }
}

// Instance singleton
export const websocketService = new WebSocketService();

// Hook React pour utiliser le service WebSocket
export function useWebSocket() {
  return websocketService;
}

export default websocketService;