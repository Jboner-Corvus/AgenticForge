import { getLlmProvider } from './packages/core/dist/chunk-LHUCLKLS.js';
import { getConfig } from './packages/core/dist/chunk-7WLI2CKS.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testOpenRouterProvider() {
  console.log('🧪 Testing OpenRouter Provider...');

  try {
    // Get configuration
    const config = getConfig();
    console.log('📋 Configuration loaded:');
    console.log('- Provider Hierarchy:', config.LLM_PROVIDER_HIERARCHY);
    console.log('- Model Name:', config.LLM_MODEL_NAME);
    console.log('- OpenRouter Sky Model:', config.LLM_MODEL_NAME_OPENROUTER_SKY);
    console.log('- OpenRouter Dusk Model:', config.LLM_MODEL_NAME_OPENROUTER_DUSK);

    // Get the OpenRouter provider
    const provider = getLlmProvider('openrouter-sky');
    console.log('🔧 Provider initialized:', provider.constructor.name);

    // Create test messages
    const messages = [
      {
        role: 'user',
        parts: [{ text: 'Hello! Please respond with a simple greeting and tell me what model you are.' }]
      }
    ];

    // Make the LLM call
    console.log('🚀 Making LLM call...');
    const startTime = Date.now();

    const response = await provider.getLlmResponse(
      messages,
      'You are a helpful AI assistant.',
      undefined, // Use API key from config
      'openrouter/sonoma-sky-alpha'
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ LLM call successful!');
    console.log('⏱️  Response time:', duration + 'ms');
    console.log('📝 Response:', response);

    if (response && response.trim().length > 0) {
      console.log('🎉 Test PASSED: OpenRouter provider is working correctly!');
    } else {
      console.log('❌ Test FAILED: Empty response received');
    }

  } catch (error) {
    console.error('❌ Test FAILED: Error occurred');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testOpenRouterProvider().catch(console.error);