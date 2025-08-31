import { T as Tool } from '../../../types-CXEr7hYR.js';
import 'fastmcp';
import 'ioredis';
import 'bullmq';
import 'zod';
import 'pg';
import '../../llm/LlmKeyManager.js';
import 'pino';

declare const clientConsoleTool: Tool<any, any>;

export { clientConsoleTool };
