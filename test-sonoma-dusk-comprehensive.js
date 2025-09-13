// Test Sonoma Dusk Model with Large Prompts
// This test verifies that the Sonoma dusk model can handle massive prompts (up to 2M+ tokens)

import { getLlmProvider } from './packages/core/src/utils/llmProvider.ts';

async function testSonomaDuskLargePrompt() {
  console.log('🧪 Testing Sonoma Dusk Model with Large Prompts...\n');

  // Get the OpenRouter provider
  const provider = getLlmProvider('openrouter-sky');

  // Test 1: Basic functionality test
  console.log('📝 Test 1: Basic Sonoma Dusk functionality');
  try {
    const basicPrompt = [
      { role: 'user', parts: [{ text: 'Hello! Can you confirm you are the Sonoma Dusk model?' }] }
    ];
    const result1 = await provider.getLlmResponse(basicPrompt, '', undefined, 'openrouter/sonoma-dusk-alpha');
    console.log('✅ Basic test result:', result1.substring(0, 150) + '...');
  } catch (error) {
    console.log('❌ Basic test failed:', error.message);
  }

  // Test 2: Large prompt test (10K+ characters)
  console.log('\n📝 Test 2: Large prompt handling (10K+ characters)');
  try {
    const largeText = 'This is a test to verify the Sonoma Dusk model can handle large inputs. '.repeat(500);
    const largePrompt = [
      { role: 'user', parts: [{ text: `Please summarize the following text: ${largeText}` }] }
    ];
    console.log(`📊 Large prompt size: ${largeText.length} characters`);
    const result2 = await provider.getLlmResponse(largePrompt, '', undefined, 'openrouter/sonoma-dusk-alpha');
    console.log('✅ Large prompt result:', result2.substring(0, 150) + '...');
  } catch (error) {
    console.log('❌ Large prompt failed:', error.message);
  }

  // Test 3: Complex structured prompt (simulating AgenticForge)
  console.log('\n📝 Test 3: Complex structured prompt (AgenticForge simulation)');
  try {
    const complexPrompt = [
      {
        role: 'user',
        parts: [{
          text: `# System Instructions
You are AgenticForge, an AI assistant with access to tools.

## Available Tools
### finish
Description: Complete the task
Parameters: {"response": "string"}

### listTools
Description: List available tools
Parameters: {}

## Task
Please help me complete a simple task by using the finish tool to respond.`
        }]
      }
    ];
    const result3 = await provider.getLlmResponse(complexPrompt, '', undefined, 'openrouter/sonoma-dusk-alpha');
    console.log('✅ Complex prompt result:', result3.substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Complex prompt failed:', error.message);
  }

  // Test 4: Test both dusk and sky variants
  console.log('\n📝 Test 4: Testing both Sonoma variants');
  const models = ['openrouter/sonoma-dusk-alpha', 'openrouter/sonoma-sky-alpha'];

  for (const model of models) {
    try {
      console.log(`🧪 Testing ${model}...`);
      const testPrompt = [
        { role: 'user', parts: [{ text: `Hello! You are ${model}. Please confirm your identity.` }] }
      ];
      const result = await provider.getLlmResponse(testPrompt, '', undefined, model);
      console.log(`✅ ${model} confirmed:`, result.substring(0, 100) + '...');
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message);
    }
  }

  console.log('\n🎉 Sonoma Dusk Model Testing Complete!');
}

// Run the test
if (require.main === module) {
  testSonomaDuskLargePrompt().catch(console.error);
}

module.exports = { testSonomaDuskLargePrompt };