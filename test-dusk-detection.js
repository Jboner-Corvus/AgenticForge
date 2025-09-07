import { getLlmProvider } from './packages/core/dist/utils/llmProvider.js';

async function testDuskDetection() {
  console.log('🧪 Testing Dusk Model Detection...');

  const testCases = [
    { provider: 'openrouter-sky', model: 'openrouter/custom-dusk-model' },
    { provider: 'openrouter', model: 'some-provider/dusk-variant' },
    { provider: 'openrouter-sky', model: 'openrouter/sonoma-dusk-alpha' }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing ${testCase.provider} with model ${testCase.model}`);
    
    try {
      const provider = getLlmProvider(testCase.provider);
      console.log('✅ Provider initialized:', provider.constructor.name);

      const messages = [
        {
          role: 'user',
          parts: [{ text: 'Test message for dusk detection' }]
        }
      ];

      console.log('📤 Sending test message...');
      const response = await provider.getLlmResponse(messages, undefined, undefined, testCase.model);

      console.log('📥 Response received:');
      console.log('Length:', response.length);
      console.log('Content preview:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));

      if (response && response.trim().length > 0) {
        console.log('✅ SUCCESS: Model returned valid content');
      } else {
        console.log('❌ FAILURE: Model returned empty content');
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
}

// Run the test
testDuskDetection().then(() => {
  console.log('\n🏁 All tests completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 Tests failed:', error);
  process.exit(1);
});