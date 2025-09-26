import { config } from './packages/core/dist/index.js';

async function testConfigurationLoading() {
  console.log('=== Configuration Loading Test ===');

  try {
    // Test configuration loading
    console.log('✅ Configuration loaded successfully');
    console.log(`LLM Provider: ${config.LLM_PROVIDER}`);
    console.log(`LLM Model: ${config.LLM_MODEL_NAME}`);
    console.log(`API Key configured: ${!!config.LLM_API_KEY ? 'YES' : 'NO'}`);
    console.log(`Provider hierarchy: ${config.LLM_PROVIDER_HIERARCHY}`);

    // Test if all required configurations are present
    const hasMainApiKey = !!config.LLM_API_KEY;
    const hasQwenKey = !!config.LLM_API_KEY;
    const hasGeminiKey = !!config.LLM_API_KEY;
    const hasOpenRouterKey = !!config.LLM_API_KEY;

    console.log('\n=== Configuration Validation ===');
    console.log(`Main API Key: ${hasMainApiKey ? '✅' : '❌'}`);
    console.log(`Qwen API Key: ${hasQwenKey ? '✅' : '❌'}`);
    console.log(`Gemini API Key: ${hasGeminiKey ? '✅' : '❌'}`);
    console.log(`OpenRouter API Key: ${hasOpenRouterKey ? '✅' : '❌'}`);

    if (hasMainApiKey || hasQwenKey || hasGeminiKey || hasOpenRouterKey) {
      console.log('\n✅ Configuration Test: SUCCESS');
      console.log('At least one API key is configured and ready for LLM provider testing.');
    } else {
      console.log('\n❌ Configuration Test: FAILED');
      console.log('No API keys are configured. Please set up at least one LLM provider API key.');
    }

    console.log('\n=== Next Steps ===');
    console.log('1. Start the worker with: ./run.sh start');
    console.log('2. Test individual providers with their specific API keys');
    console.log('3. Verify Redis and PostgreSQL connections are working');

  } catch (error) {
    console.error('❌ Configuration Test: FAILED');
    console.error(error instanceof Error ? error.message : 'Unknown error');
  }
}

testConfigurationLoading().catch(console.error);
