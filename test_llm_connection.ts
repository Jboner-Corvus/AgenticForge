import { config } from './packages/core/dist/config.js';
import { QwenProvider } from './packages/core/dist/modules/llm/qwenProvider.js';

async function testLlmConnection() {
  console.log('=== LLM Connection Test ===');
  
  try {
    const provider = new QwenProvider();
    
    console.log(`LLM Provider: ${config.LLM_PROVIDER}`);
    console.log(`LLM Model: ${config.LLM_MODEL_NAME}`);
    console.log(`API Key configured: ${!!config.LLM_API_KEY ? 'YES' : 'NO'}`);
    
    if (!config.LLM_API_KEY) {
      console.error('❌ No API key configured');
      return;
    }
    
    // Test simple prompt
    const testMessages = [
      {
        parts: [{ text: 'Hello, this is a test message.' }],
        role: 'user' as const,
      }
    ];
    
    console.log('\nSending test request...');
    
    const response = await provider.getLlmResponse(
      testMessages,
      'You are a helpful assistant. Please respond with a short greeting.',
      config.LLM_API_KEY,
      config.LLM_MODEL_NAME
    );
    
    console.log('✅ LLM Connection: SUCCESS');
    console.log(`Response: ${response.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ LLM Connection: FAILED');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    
    // Check for common issues
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - Check if your API key is valid');
        console.log('  - Verify the API key has not expired');
        console.log('  - Ensure the API key has access to the requested model');
      } else if (error.message.includes('429')) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - You may have exceeded your API quota');
        console.log('  - Check your Qwen account for usage limits');
      } else if (error.message.includes('504') || error.message.includes('timeout')) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - Network connectivity issues');
        console.log('  - Qwen API may be temporarily unavailable');
        console.log('  - Try using a different provider in the hierarchy');
      }
    }
  }
}

testLlmConnection().catch(console.error);