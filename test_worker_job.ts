import { Queue } from './packages/core/node_modules/bullmq/dist/cjs/index.js';
import pkg from './packages/core/node_modules/ioredis/built/index.js';
const { createClient } = pkg;

async function sendTestJob() {
  console.log('=== Sending Test Job to Worker ===');

  try {
    const redisConnection = createClient({
      host: 'localhost',
      port: 6379,
    });

    const jobQueue = new Queue('tasks', { connection: redisConnection });

    // Create a test job
    const job = await jobQueue.add('process-message', {
      message: 'Hello, this is a test message for the worker.',
      sessionId: 'test-session-' + Date.now(),
      llmProvider: 'gemini',
      llmModelName: 'gemini-2.5-pro',
    });

    console.log(`✅ Job queued successfully with ID: ${job.id}`);

    await jobQueue.close();
    await redisConnection.quit();

    console.log('Job sent to worker. Check the worker logs to see the result.');
  } catch (error) {
    console.error(
      '❌ Job failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

sendTestJob().catch(console.error);
