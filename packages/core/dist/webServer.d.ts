import * as chokidar from 'chokidar';
import { Application } from 'express';
import { Server } from 'http';
import { Redis } from 'ioredis';
import { Client } from 'pg';

declare let configWatcher: chokidar.FSWatcher | null;
declare function initializeWebServer(pgClient: Client, redisClient: Redis): Promise<{
    app: Application;
    server: Server;
}>;

export { configWatcher, initializeWebServer };
