// Test WebSocket client to verify connection and message reception
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3002/ws';

console.log('🔌 Connecting to WebSocket server...');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');

  // Subscribe to job events
  const subscribeMessage = {
    type: 'subscribe_job_events',
    data: { jobId: '23' },
    timestamp: Date.now()
  };

  ws.send(JSON.stringify(subscribeMessage));
  console.log('📤 Sent subscription message:', subscribeMessage);

  // Set session
  const sessionMessage = {
    type: 'set_session',
    data: { sessionId: 'test-session-123' },
    timestamp: Date.now()
  };

  ws.send(JSON.stringify(sessionMessage));
  console.log('📤 Sent session message:', sessionMessage);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received message:', message.type, message.data);
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

// Keep the connection alive for 30 seconds
setTimeout(() => {
  console.log('⏰ Closing test connection...');
  ws.close();
}, 30000);