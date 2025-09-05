// Test script to verify session synchronization between frontend and worker
import Redis from 'ioredis';
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3002/ws';
const JOB_ID = 'session-sync-test-' + Date.now();
const OLD_SESSION_ID = 'old-session-' + Date.now();
const NEW_SESSION_ID = 'new-session-' + Date.now();

console.log('🧪 Testing session synchronization...');

// Redis client for publishing events
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// WebSocket client for monitoring
let ws;

async function setupWebSocket() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      console.log('✅ Connected to WebSocket server');

      // Set initial session
      const sessionMessage = {
        type: 'set_session',
        data: { sessionId: OLD_SESSION_ID },
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(sessionMessage));
      console.log('📤 Set initial session:', OLD_SESSION_ID);

      resolve();
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 [${new Date().toISOString()}] Received: ${message.type}`);

        if (message.type === 'connection_established') {
          console.log('✅ Connection established');
        } else if (message.type === 'subscribed') {
          console.log('✅ Subscribed to job events');
        } else if (message.type?.startsWith('browser.')) {
          console.log(`🌐 Browser event: ${message.type}`);
        }
      } catch (error) {
        console.log('📨 Raw message:', data.toString());
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      reject(error);
    });

    ws.on('close', (code, reason) => {
      console.log('🔌 WebSocket closed:', code, reason.toString());
    });
  });
}

async function publishEvent(type, data, sessionId) {
  const channel = `job:${JOB_ID}:events`;
  const event = JSON.stringify({
    type,
    data: { ...data, jobId: JOB_ID, sessionId },
    timestamp: Date.now()
  });

  await redis.publish(channel, event);
  console.log(`📤 Published ${type} to ${channel} (session: ${sessionId})`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function testSessionSync() {
  try {
    console.log('🔄 Testing session synchronization...');

    // Step 1: Subscribe to job events with old session
    const subscribeMessage = {
      type: 'subscribe_job_events',
      data: { jobId: JOB_ID },
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(subscribeMessage));
    console.log('📡 Subscribed to job events');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Send some events with old session
    console.log('📤 Sending events with OLD session...');
    await publishEvent('browser.navigating', { url: 'https://example.com' }, OLD_SESSION_ID);
    await publishEvent('browser.page.loaded', { url: 'https://example.com' }, OLD_SESSION_ID);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Change session (simulate clicking "New Session")
    console.log('🔄 Changing to NEW session...');
    const newSessionMessage = {
      type: 'set_session',
      data: { sessionId: NEW_SESSION_ID },
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(newSessionMessage));
    console.log('📤 Changed session to:', NEW_SESSION_ID);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Send events with new session
    console.log('📤 Sending events with NEW session...');
    await publishEvent('browser.navigating', { url: 'https://httpbin.org' }, NEW_SESSION_ID);
    await publishEvent('browser.page.loaded', { url: 'https://httpbin.org' }, NEW_SESSION_ID);
    await publishEvent('browser.element.click', { selector: 'button' }, NEW_SESSION_ID);

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Session synchronization test completed');
    console.log('🔍 Check that events switched from old to new session properly');

  } catch (error) {
    console.error('❌ Session sync test failed:', error);
  } finally {
    if (ws) {
      ws.close();
    }
    redis.disconnect();
  }
}

async function runTest() {
  try {
    await setupWebSocket();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testSessionSync();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  if (ws) ws.close();
  redis.disconnect();
  process.exit(0);
});

runTest();