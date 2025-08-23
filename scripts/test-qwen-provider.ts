#!/usr/bin/env ts-node

import { QwenProvider } from '../packages/core/src/modules/llm/qwenProvider.ts';
import { LLMContent } from '../packages/core/src/modules/llm/llm-types.ts';

async function testQwenProvider() {
  console.log('Testing Qwen Provider Improvements...');
  
  const provider = new QwenProvider();
  
  // Test messages
  const messages: LLMContent[] = [
    {
      role: 'user',
      parts: [{ text: 'Hello, this is a test message. Please respond with a short greeting.' }]
    }
  ];
  
  try {
    console.log('Sending test request to Qwen provider...');
    const response = await provider.getLlmResponse(messages);
    console.log('Response received:');
    console.log(response);
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
  }
}

// Run the test
testQwenProvider().catch(console.error);