// Test script to verify automatic screenshots are working
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

console.log('🧪 Testing automatic screenshots...');

async function testAutoScreenshots() {
  try {
    // Create a test job
    const jobData = {
      message:
        'Navigate to httpbin.org/html, wait for an element, extract some content, and evaluate JavaScript. This should trigger automatic screenshots for each action.',
      sessionId: 'auto-screenshot-test-' + Date.now(),
    };

    console.log('📤 Creating test job...');
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0',
      },
      body: JSON.stringify({
        prompt: jobData.message,
        sessionId: jobData.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Test job created:', data.id);

    // Monitor for screenshot events
    const jobId = data.id;
    console.log('👀 Monitoring for automatic screenshots...');

    // Listen for browser events on Redis
    const subscriber = new Redis({
      host: 'localhost',
      port: 6379,
    });

    subscriber.subscribe(`job:${jobId}:events`, (err, count) => {
      if (err) {
        console.error('❌ Redis subscription error:', err);
        return;
      }
      console.log(`📡 Subscribed to ${count} channel(s)`);
    });

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        if (
          event.type === 'browser.screenshot.realtime' &&
          event.data.automatic
        ) {
          console.log(`📸 Automatic screenshot captured: ${event.data.action}`);
          console.log(`   📊 Size: ${event.data.imageData?.length || 0} chars`);
          console.log(`   🎯 Selector: ${event.data.selector || 'N/A'}`);
          console.log(
            `   ⏰ Timestamp: ${new Date(event.timestamp).toLocaleTimeString()}`,
          );
        } else if (event.type === 'browser.screenshot.error') {
          console.log(`❌ Screenshot error: ${event.data.message}`);
        } else if (event.type?.startsWith('browser.')) {
          console.log(`🌐 Browser event: ${event.type}`);
        }
      } catch (error) {
        console.log('📨 Raw message:', message.substring(0, 100) + '...');
      }
    });

    // Wait for the job to complete
    setTimeout(() => {
      console.log(
        '⏰ Test completed. Check the logs above for automatic screenshots.',
      );
      subscriber.disconnect();
      redis.disconnect();
      process.exit(0);
    }, 60000); // 1 minute timeout
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    redis.disconnect();
    process.exit(1);
  }
}

testAutoScreenshots();
