import { getLlmProvider } from './packages/core/dist/utils/llmProvider.js';

async function testOpenRouterDusk() {
  console.log('🧪 Testing OpenRouter Dusk Provider...');

  try {
    // Get the OpenRouter provider (should use dusk for sonoma-dusk-alpha)
    const provider = getLlmProvider('openrouter-dusk');
    console.log('✅ Provider initialized:', provider.constructor.name);

    // Test with a simple message
    const messages = [
      {
        role: 'user',
        parts: [{ text: 'Hello, can you help me with a simple task?' }]
      }
    ];

    console.log('📤 Sending test message...');
    const response = await provider.getLlmResponse(messages, undefined, undefined, 'openrouter/sonoma-dusk-alpha');

    console.log('📥 Response received:');
    console.log('Length:', response.length);
    console.log('Content preview:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));

    if (response && response.trim().length > 0) {
      console.log('✅ SUCCESS: OpenRouter Dusk returned valid content');
    } else {
      console.log('❌ FAILURE: OpenRouter Dusk returned empty content');
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testOpenRouterDusk().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 Test failed:', error);
  process.exit(1);
});