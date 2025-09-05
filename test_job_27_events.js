// Test WebSocket client to monitor job 27 events (Playwright advanced tools)
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3002/ws';
const JOB_ID = '37'; // Job ID from the API call

console.log(`🔌 Connecting to WebSocket server to monitor job ${JOB_ID} (Playwright advanced tools)...`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');

  // Subscribe to job events
  const subscribeMessage = {
    type: 'subscribe_job_events',
    data: { jobId: JOB_ID },
    timestamp: Date.now()
  };

  ws.send(JSON.stringify(subscribeMessage));
  console.log(`📤 Sent subscription message for job ${JOB_ID}:`, subscribeMessage);

  // Set session
  const sessionMessage = {
    type: 'set_session',
    data: { sessionId: 'test-playwright-advanced' },
    timestamp: Date.now()
  };

  ws.send(JSON.stringify(sessionMessage));
  console.log('📤 Sent session message:', sessionMessage);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`📨 [${new Date().toISOString()}] Received message:`, message.type);

    if (message.type === 'connection_established') {
      console.log('✅ Connection established:', message.data);
    } else if (message.type === 'subscribed') {
      console.log('✅ Subscribed to job events:', message.data);
    } else if (message.type === 'browser.navigating') {
      console.log('🌐 Browser navigating:', message.data);
    } else if (message.type === 'browser.page.loaded') {
      console.log('📄 Page loaded:', message.data);
    } else if (message.type === 'browser.content.extracting') {
      console.log('📝 Content extracting:', message.data);
    } else if (message.type === 'browser.content.extracted') {
      console.log('📝 Content extracted:', message.data);
    } else if (message.type === 'browser.screenshot.capturing') {
      console.log('📸 Screenshot capturing:', message.data);
    } else if (message.type === 'browser.screenshot.captured') {
      console.log('📸 Screenshot captured:', message.data);
    } else if (message.type === 'browser.element.click') {
      console.log('🖱️ Element click:', message.data);
    } else if (message.type === 'browser.element.type') {
      console.log('⌨️ Element type:', message.data);
    } else if (message.type === 'browser.javascript.evaluating') {
      console.log('⚡ JavaScript evaluating:', message.data);
    } else if (message.type === 'browser.error') {
      console.log('❌ Browser error:', message.data);
    } else if (message.type === 'completed') {
      console.log('✅ Job completed:', message.data);
    } else if (message.type === 'error') {
      console.log('❌ Job error:', message.data);
    } else {
      console.log('📨 Other message:', message);
    }
  } catch (error) {
    console.log('📨 Received raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket closed:', code, reason.toString());
});

// Keep the connection alive for 2 minutes to monitor the job
setTimeout(() => {
  console.log('⏰ Closing test connection...');
  ws.close();
}, 120000);