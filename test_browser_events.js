// Test script to publish browser events to Redis
import Redis from 'ioredis';

async function testBrowserEvents() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  console.log('🔌 Connected to Redis');

  // Test events
  const testEvents = [
    {
      type: 'browser.navigating',
      data: { url: 'https://example.com', action: 'test' },
      timestamp: Date.now(),
    },
    {
      type: 'browser.page.loaded',
      data: { url: 'https://example.com', title: 'Test Page' },
      timestamp: Date.now(),
    },
    {
      type: 'browser.element.click',
      data: { selector: 'button#test', button: 'left' },
      timestamp: Date.now(),
    },
  ];

  // Publish events to job:23:events channel
  for (const event of testEvents) {
    const channel = 'job:23:events';
    const message = JSON.stringify(event);

    await redis.publish(channel, message);
    console.log(`📤 Published to ${channel}:`, event.type, event.data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
  }

  console.log('✅ Test events published');
  redis.disconnect();
}

testBrowserEvents().catch(console.error);
