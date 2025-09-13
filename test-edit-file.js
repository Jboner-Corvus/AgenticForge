import { getLlmProvider } from './packages/core/dist/utils/llmProvider.js';
import { convertPlainTextToValidJson } from './packages/core/dist/modules/agent/agent.js';
import fs from 'fs';

async function testEditFileTask() {
  console.log('🧪 Testing editFile task with Dusk...');

  try {
    // Get the OpenRouter provider
    const provider = getLlmProvider('openrouter-dusk');
    console.log('✅ Provider initialized:', provider.constructor.name);

    // Test message for editFile task
    const messages = [
      {
        role: 'user',
        parts: [{ 
          text: 'Modify the test-complex.json file. Add a new field called "modification_test" with the value "Task 43 completed" without losing any existing content. Use the editFile tool to make this change.'
        }]
      }
    ];

    console.log('📤 Sending editFile task...');
    const response = await provider.getLlmResponse(messages, undefined, undefined, 'openrouter/sonoma-dusk-alpha');

    console.log('📥 Raw response:');
    console.log('Length:', response.length);
    console.log('Content:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));

    // Test the improved conversion function
    console.log('\n🔄 Testing text-to-JSON conversion...');
    const jsonResult = convertPlainTextToValidJson(response);
    
    console.log('JSON conversion result:');
    console.log('Type:', typeof jsonResult);
    console.log('Content:', JSON.stringify(jsonResult, null, 2));

    if (jsonResult && typeof jsonResult === 'object' && jsonResult.command) {
      console.log('✅ SUCCESS: Dusk response was converted to valid JSON command');
      console.log('Command name:', jsonResult.command.name);
      console.log('Parameters:', JSON.stringify(jsonResult.command.params, null, 2));
    } else {
      console.log('❌ FAILURE: Response was not converted to valid JSON command');
    }

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testEditFileTask().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.log('💥 Test failed:', error);
  process.exit(1);
});