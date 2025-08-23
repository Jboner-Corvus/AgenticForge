#!/usr/bin/env ts-node

/**
 * Utility script to validate Qwen API keys
 * Usage: ts-node validate-qwen-key.ts [api-key]
 */

async function validateQwenKey(apiKey: string) {
  console.log('Validating Qwen API Key...');
  
  try {
    // Test endpoint for Qwen API key validation (using the correct Qwen Portal endpoint)
    const response = await fetch('https://portal.qwen.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message to validate the API key.'
          }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      console.log('✅ API Key is valid');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API Key validation failed:');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ API Key validation failed with exception:');
    console.error(error);
    return false;
  }
}

// Get API key from command line argument or environment variable
const apiKey = process.argv[2] || process.env.LLM_API_KEY;

if (!apiKey) {
  console.log('Usage: ts-node validate-qwen-key.ts [api-key]');
  console.log('Or set LLM_API_KEY environment variable');
  process.exit(1);
}

validateQwenKey(apiKey).then(isValid => {
  process.exit(isValid ? 0 : 1);
});