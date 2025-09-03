// Complex test script to simulate a multi-step agent workflow
// This test combines browser automation, todo management, and WebSocket monitoring
import Redis from 'ioredis';
import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3002/ws';
const JOB_ID = 'complex-test-' + Date.now();
const SESSION_ID = 'complex-session-' + Date.now();

console.log(`🚀 Starting complex agent workflow test for job ${JOB_ID}...`);

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

      // Subscribe to job events
      const subscribeMessage = {
        type: 'subscribe_job_events',
        data: { jobId: JOB_ID },
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(subscribeMessage));
      console.log(`📤 Sent subscription message for job ${JOB_ID}`);

      // Set session
      const sessionMessage = {
        type: 'set_session',
        data: { sessionId: SESSION_ID },
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(sessionMessage));
      console.log('📤 Sent session message');

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
        } else if (message.type === 'browser.navigating') {
          console.log('🌐 Browser navigating:', message.data.url);
        } else if (message.type === 'browser.page.loaded') {
          console.log('📄 Page loaded:', message.data.url);
        } else if (message.type === 'browser.element.click') {
          console.log('🖱️ Element clicked:', message.data.selector);
        } else if (message.type === 'browser.element.type') {
          console.log('⌨️ Text typed into:', message.data.selector);
        } else if (message.type === 'browser.screenshot.captured') {
          console.log('📸 Screenshot captured');
        } else if (message.type === 'completed') {
          console.log('✅ Job completed');
        } else if (message.type === 'error') {
          console.log('❌ Error:', message.data);
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

async function publishEvent(type, data) {
  const channel = `job:${JOB_ID}:events`;
  const event = JSON.stringify({
    type,
    data: { ...data, jobId: JOB_ID, sessionId: SESSION_ID },
    timestamp: Date.now()
  });

  await redis.publish(channel, event);
  console.log(`📤 Published ${type} to ${channel}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
}

async function simulateComplexWorkflow() {
  try {
    console.log('📋 Starting complex workflow simulation...');

    // Step 1: Initialize workflow
    await publishEvent('workflow.started', {
      description: 'Complex multi-step browser automation workflow',
      steps: ['navigate', 'interact', 'capture', 'analyze', 'complete']
    });

    // Step 2: Simulate navigation
    await publishEvent('browser.navigating', {
      url: 'https://httpbin.org/forms/post',
      action: 'Load form page for testing'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await publishEvent('browser.page.loaded', {
      url: 'https://httpbin.org/forms/post',
      title: 'HTTPBin Form Test Page',
      loadTime: 1500
    });

    // Step 3: Simulate element interactions
    await publishEvent('browser.element.click', {
      selector: 'input[name="custname"]',
      button: 'left',
      action: 'Focus on name field'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await publishEvent('browser.element.type', {
      selector: 'input[name="custname"]',
      text: 'Test User Agent',
      cleared: true,
      action: 'Enter customer name'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await publishEvent('browser.element.type', {
      selector: 'input[name="custtel"]',
      text: '+1-555-TEST-123',
      cleared: false,
      action: 'Enter phone number'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await publishEvent('browser.element.type', {
      selector: 'input[name="custemail"]',
      text: 'test.agent@example.com',
      cleared: false,
      action: 'Enter email address'
    });

    // Step 4: Simulate form submission
    await publishEvent('browser.element.click', {
      selector: 'button[type="submit"]',
      button: 'left',
      action: 'Submit the form'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Simulate screenshot capture
    await publishEvent('browser.screenshot.capturing', {
      fullPage: true,
      action: 'Capture full page after form submission'
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    await publishEvent('browser.screenshot.captured', {
      fullPage: true,
      format: 'png',
      size: 245760,
      action: 'Screenshot captured successfully'
    });

    // Step 6: Simulate content extraction
    await publishEvent('browser.content.extracting', {
      selector: 'pre',
      property: 'textContent',
      action: 'Extract response data'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await publishEvent('browser.content.extracted', {
      length: 512,
      selector: 'pre',
      property: 'textContent',
      action: 'Response data extracted'
    });

    // Step 7: Simulate todo creation and management
    await publishEvent('todo.created', {
      id: 'analyze-response',
      title: 'Analyze form submission response',
      description: 'Parse and validate the JSON response from the form submission',
      priority: 'high'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    await publishEvent('todo.created', {
      id: 'generate-report',
      title: 'Generate workflow report',
      description: 'Create a summary report of the entire workflow execution',
      priority: 'medium'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    await publishEvent('todo.updated', {
      id: 'analyze-response',
      status: 'in_progress',
      progress: 50
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await publishEvent('todo.completed', {
      id: 'analyze-response',
      status: 'completed',
      result: 'Response analysis complete - all fields validated'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    await publishEvent('todo.updated', {
      id: 'generate-report',
      status: 'in_progress',
      progress: 75
    });

    // Step 8: Simulate error handling
    await publishEvent('browser.error', {
      message: 'Simulated network timeout during report generation',
      code: 'NETWORK_TIMEOUT',
      retryable: true
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await publishEvent('workflow.retry', {
      step: 'generate-report',
      attempt: 2,
      maxAttempts: 3
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    await publishEvent('todo.completed', {
      id: 'generate-report',
      status: 'completed',
      result: 'Report generated successfully after retry'
    });

    // Step 9: Finalize workflow
    await publishEvent('workflow.completed', {
      totalSteps: 9,
      duration: 15000,
      success: true,
      summary: 'Complex workflow completed with error recovery'
    });

    await publishEvent('completed', {
      jobId: JOB_ID,
      sessionId: SESSION_ID,
      result: 'All workflow steps completed successfully'
    });

    console.log('✅ Complex workflow simulation completed');

  } catch (error) {
    console.error('❌ Workflow simulation failed:', error);
    await publishEvent('error', {
      message: `Workflow failed: ${error.message}`,
      stack: error.stack
    });
  }
}

async function runComplexTest() {
  try {
    // Setup WebSocket monitoring
    await setupWebSocket();

    // Wait for WebSocket to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run the complex workflow simulation
    await simulateComplexWorkflow();

    // Keep connections alive for a bit to see final events
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Complex test failed:', error);
  } finally {
    // Cleanup
    if (ws) {
      ws.close();
    }
    redis.disconnect();
    console.log('🔌 Test connections closed');
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  if (ws) ws.close();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  if (ws) ws.close();
  redis.disconnect();
  process.exit(0);
});

// Run the test
runComplexTest().catch(console.error);