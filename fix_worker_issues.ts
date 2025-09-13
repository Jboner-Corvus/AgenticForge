#!/usr/bin/env node
// Comprehensive fix script for AgenticForge worker issues

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function checkDockerServices() {
  console.log('🐳 Checking Docker services...');
  
  try {
    const { stdout } = await execAsync('docker compose ps --format json');
    const services = stdout.trim() ? JSON.parse(`[${stdout.trim().replace(/\n/g, ',')}]`) : [];
    
    const runningServices = services.filter((s: any) => s.Status.includes('Up'));
    const stoppedServices = services.filter((s: any) => !s.Status.includes('Up'));
    
    console.log(`✅ Running services: ${runningServices.length}`);
    console.log(`❌ Stopped services: ${stoppedServices.length}`);
    
    for (const service of stoppedServices) {
      console.log(`   - ${service.Service}: ${service.Status}`);
    }
    
    return runningServices.length > 0;
  } catch (error) {
    console.error('❌ Failed to check Docker services:', (error as Error).message);
    return false;
  }
}

async function restartDockerServices() {
  console.log('🔄 Restarting Docker services...');
  
  try {
    console.log('🛑 Stopping services...');
    await execAsync('docker compose down');
    
    console.log('🚀 Starting services...');
    await execAsync('docker compose up -d');
    
    console.log('⏳ Waiting for services to be ready...');
    // Wait a bit for services to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to restart Docker services:', (error as Error).message);
    return false;
  }
}

async function checkRedisConnection() {
  console.log('🔍 Checking Redis connection...');
  
  try {
    // Simple Redis ping using redis-cli in Docker
    const { stdout } = await execAsync('docker exec g_forge_redis redis-cli ping');
    if (stdout.trim() === 'PONG') {
      console.log('✅ Redis is responding');
      return true;
    } else {
      console.log('❌ Redis is not responding properly');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', (error as Error).message);
    return false;
  }
}

async function checkPostgresConnection() {
  console.log('🔍 Checking PostgreSQL connection...');
  
  try {
    // Simple PostgreSQL check using pg_isready in Docker
    await execAsync('docker exec g_forge_postgres pg_isready -U user -d gforge');
    console.log('✅ PostgreSQL is ready');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL is not ready:', (error as Error).message);
    return false;
  }
}

async function killWorkerProcesses() {
  console.log('🔪 Killing existing worker processes...');
  
  try {
    // Kill any existing worker processes
    await execAsync('pkill -f "node dist/worker.js" || true');
    await execAsync('pkill -9 -f "node dist/worker.js" || true');
    
    // Remove PID file if it exists
    const pidFile = path.resolve(process.cwd(), 'worker.pid');
    try {
      await fs.unlink(pidFile);
      console.log('✅ Removed worker PID file');
    } catch (error) {
      // PID file doesn't exist, that's fine
    }
    
    console.log('✅ Worker processes killed');
    return true;
  } catch (error) {
    console.error('❌ Failed to kill worker processes:', (error as Error).message);
    return false;
  }
}

async function startWorker() {
  console.log('👷 Starting worker process...');
  
  try {
    const coreDir = path.resolve(process.cwd(), 'packages/core');
    process.chdir(coreDir);
    
    // Build if needed
    const distDir = path.resolve(coreDir, 'dist');
    try {
      await fs.access(distDir);
      console.log('✅ Core package already built');
    } catch {
      console.log('📦 Building core package...');
      await execAsync('pnpm run build');
      console.log('✅ Core package built');
    }
    
    // Start worker
    const workerLog = path.resolve(process.cwd(), '../../worker.log');
    const workerPid = path.resolve(process.cwd(), '../../worker.pid');
    
    // Clear old log
    try {
      await fs.writeFile(workerLog, '');
    } catch (error) {
      // Ignore if log file doesn't exist
    }
    
    // Start worker in background
    const workerProcess = exec(
      'node dist/worker.js',
      { env: { ...process.env, STARTED_FROM_RUN_SCRIPT: 'true' } },
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Worker process error:', error.message);
        }
        if (stderr) {
          console.error('❌ Worker stderr:', stderr);
        }
      }
    );
    
    // Write PID file
    await fs.writeFile(workerPid, workerProcess.pid?.toString() || '');
    
    console.log(`✅ Worker started with PID: ${workerProcess.pid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to start worker:', (error as Error).message);
    return false;
  }
}

async function main() {
  console.log('🔧 AgenticForge Worker Fix Script\n');
  
  // Check if Docker services are running
  const dockerRunning = await checkDockerServices();
  
  if (!dockerRunning) {
    console.log('🔄 Docker services are not running, restarting...');
    await restartDockerServices();
  }
  
  // Check Redis connection
  const redisOk = await checkRedisConnection();
  if (!redisOk) {
    console.log('🔄 Redis is not responding, restarting services...');
    await restartDockerServices();
  }
  
  // Check PostgreSQL connection
  const postgresOk = await checkPostgresConnection();
  if (!postgresOk) {
    console.log('🔄 PostgreSQL is not ready, restarting services...');
    await restartDockerServices();
  }
  
  // Kill existing worker processes
  await killWorkerProcesses();
  
  // Wait a moment for services to stabilize
  console.log('⏳ Waiting for services to stabilize...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Start new worker
  const workerStarted = await startWorker();
  
  if (workerStarted) {
    console.log('\n🎉 Fix process completed successfully!');
    console.log('📝 Worker logs will be available in worker.log');
    console.log('💡 Monitor the worker with: tail -f worker.log');
  } else {
    console.log('\n❌ Fix process failed!');
    console.log('💡 Check the logs and try running this script again');
  }
}

// Run the fix script
main().catch(console.error);