async function testBrowserLiveView() {
  try {
    console.log('🧪 Testing Browser Live View with Playwright tools...');

    // Create a job that uses Playwright tools
    const jobData = {
      message:
        "Navigate to google.ca, type 'Playwright automation test' in the search bar, and click the search button. Show me the live browser events.",
      tools: ['playwright_navigate', 'playwright_type', 'playwright_click'],
      sessionId: 'test-session-' + Date.now(),
    };

    console.log('📤 Sending job request...');
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
    console.log('✅ Job created:', data);
    console.log('🎯 Job ID:', data.id);

    // Monitor the job for a few minutes
    const jobId = data.id;
    console.log('👀 Monitoring job events for 2 minutes...');

    setTimeout(() => {
      console.log('⏰ Test completed. Check the Browser Live View in the UI.');
    }, 120000);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBrowserLiveView();
