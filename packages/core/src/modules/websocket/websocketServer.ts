import { Server as HttpServer } from 'http';
import { Redis } from 'ioredis';
import { WebSocket, WebSocketServer } from 'ws';

import { getLoggerInstance } from '../../logger.ts';

const logger = getLoggerInstance();

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  sessionId?: string;
  jobId?: string;
}

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  jobId?: string;
  subscribedChannels: Set<string>;
  lastPing: number;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private redisClient: Redis;
  private redisSubscriber: Redis;
  private pingInterval: NodeJS.Timeout | undefined;

  constructor(server: HttpServer, redisClient: Redis) {
    this.redisClient = redisClient;
    this.redisSubscriber = redisClient.duplicate();

    // Créer le serveur WebSocket avec gestion CORS
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      // Permettre toutes les origines pour les WebSocket (géré côté client)
      perMessageDeflate: false,
      maxPayload: 1024 * 1024 // 1MB max payload
    });

    this.setupWebSocketServer();
    this.setupRedisSubscriber();
    this.startPingInterval();

    logger.info('📡 WebSocket server initialized');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        subscribedChannels: new Set(),
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      logger.info(`📡 Client connected: ${clientId} (${this.clients.size} total clients)`);

      // Configurer les listeners pour ce client
      this.setupClientListeners(client);

      // Envoyer un message de bienvenue
      this.sendToClient(client, {
        type: 'connection_established',
        data: { clientId },
        timestamp: Date.now()
      });
    });

    this.wss.on('error', (error) => {
      logger.error({ err: error }, '📡 WebSocket server error');
    });
  }

  private setupClientListeners(client: WebSocketClient): void {
    client.ws.on('message', (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error) {
        logger.error({ err: error, clientId: client.id }, '📡 Failed to parse WebSocket message');
      }
    });

    client.ws.on('close', (code, reason) => {
      logger.info(`📡 Client disconnected: ${client.id} (code: ${code}, reason: ${reason})`);
      this.handleClientDisconnect(client);
    });

    client.ws.on('error', (error) => {
      logger.error({ err: error, clientId: client.id }, '📡 WebSocket client error');
    });

    client.ws.on('pong', () => {
      client.lastPing = Date.now();
    });
  }

  private handleClientMessage(client: WebSocketClient, message: WebSocketMessage): void {
    logger.info(`📡 Received message from client ${client.id}:`, message.type, message.data);

    switch (message.type) {
      case 'ping':
        this.sendToClient(client, {
          type: 'pong',
          data: {},
          timestamp: Date.now()
        });
        break;

      case 'subscribe_job_events':
        logger.info(`📡 Processing subscribe_job_events for job: ${message.data?.jobId}`);
        if (message.data?.jobId) {
          this.subscribeClientToJobEvents(client, message.data.jobId);
        } else {
          logger.warn(`📡 subscribe_job_events missing jobId from client ${client.id}`);
        }
        break;

      case 'set_session':
        if (message.data?.sessionId) {
          client.sessionId = message.data.sessionId;
          logger.info(`📡 Client ${client.id} set session: ${client.sessionId}`);
        }
        break;

      default:
        logger.warn(`📡 Unknown message type: ${message.type} from client ${client.id}`);
    }
  }

  private subscribeClientToJobEvents(client: WebSocketClient, jobId: string): void {
    const channel = `job:${jobId}:events`;
    
    if (!client.subscribedChannels.has(channel)) {
      client.jobId = jobId;
      client.subscribedChannels.add(channel);
      
      // S'assurer que Redis est abonné à ce channel
      this.redisSubscriber.subscribe(channel);
      
      logger.info(`📡 Client ${client.id} subscribed to job events: ${jobId}`);
      
      this.sendToClient(client, {
        type: 'subscribed',
        data: { channel, jobId },
        timestamp: Date.now()
      });
    }
  }

  private handleClientDisconnect(client: WebSocketClient): void {
    // Nettoyer les abonnements
    client.subscribedChannels.forEach(channel => {
      // Vérifier si d'autres clients sont abonnés avant de se désabonner de Redis
      const hasOtherSubscribers = Array.from(this.clients.values())
        .some(c => c.id !== client.id && c.subscribedChannels.has(channel));
      
      if (!hasOtherSubscribers) {
        this.redisSubscriber.unsubscribe(channel);
      }
    });

    this.clients.delete(client.id);
  }

  private setupRedisSubscriber(): void {
    this.redisSubscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`📡 Redis message received on ${channel}:`, data.type);
        
        // Distribuer le message aux clients abonnés
        this.distributeMessage(channel, data);
      } catch (error) {
        logger.error({ err: error, channel }, '📡 Failed to parse Redis message');
      }
    });

    this.redisSubscriber.on('error', (error) => {
      logger.error({ err: error }, '📡 Redis subscriber error');
    });

    logger.info('📡 Redis subscriber initialized');
  }

  private distributeMessage(channel: string, message: WebSocketMessage): void {
    const relevantClients = Array.from(this.clients.values())
      .filter(client => client.subscribedChannels.has(channel));

    logger.info(`📡 Distributing message to ${relevantClients.length} clients on channel ${channel}`);

    relevantClients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  private sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error({ err: error, clientId: client.id }, '📡 Failed to send message to client');
      }
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const pingTimeout = 60000; // 1 minute timeout

      this.clients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Envoyer un ping
          try {
            client.ws.ping();
          } catch (error) {
            logger.error({ err: error, clientId: client.id }, '📡 Failed to ping client');
          }

          // Vérifier le timeout
          if (now - client.lastPing > pingTimeout) {
            logger.warn(`📡 Client ${client.id} ping timeout, closing connection`);
            client.ws.close(1000, 'Ping timeout');
          }
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public broadcastToAll(message: WebSocketMessage): void {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  public broadcastToJob(jobId: string, message: WebSocketMessage): void {
    const relevantClients = Array.from(this.clients.values())
      .filter(client => client.jobId === jobId);

    relevantClients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  public getStats(): {
    connectedClients: number;
    totalChannels: number;
    clientsByJob: Record<string, number>;
  } {
    const clientsByJob: Record<string, number> = {};
    const allChannels = new Set<string>();

    this.clients.forEach(client => {
      if (client.jobId) {
        clientsByJob[client.jobId] = (clientsByJob[client.jobId] || 0) + 1;
      }
      
      client.subscribedChannels.forEach(channel => {
        allChannels.add(channel);
      });
    });

    return {
      connectedClients: this.clients.size,
      totalChannels: allChannels.size,
      clientsByJob
    };
  }

  public async publishToChannel(channel: string, message: WebSocketMessage): Promise<void> {
    try {
      await this.redisClient.publish(channel, JSON.stringify(message));
      logger.info(`📡 Published message to channel: ${channel}`);
    } catch (error) {
      logger.error({ err: error, channel }, '📡 Failed to publish to channel');
      throw error;
    }
  }

  public close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Server shutdown');
      }
    });

    this.wss.close();
    this.redisSubscriber.disconnect();
    
    logger.info('📡 WebSocket server closed');
  }
}

// Instance globale (sera initialisée dans webServer.ts)
let websocketManager: WebSocketManager | null = null;

export function initializeWebSocketManager(server: HttpServer, redisClient: Redis): WebSocketManager {
  if (websocketManager) {
    logger.warn('📡 WebSocket manager already initialized');
    return websocketManager;
  }

  websocketManager = new WebSocketManager(server, redisClient);
  return websocketManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return websocketManager;
}

export default WebSocketManager;