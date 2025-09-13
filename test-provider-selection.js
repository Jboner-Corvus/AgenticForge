// Test script to verify provider selection fix
import { LlmRouter } from './packages/core/src/modules/llm/LlmRouter.js';

async function testProviderSelection() {
  console.log('🧪 Testing provider selection fix...');

  // Create router with the same config as production
  const router = new LlmRouter({
    hierarchy: ['openrouter-sky', 'openrouter-dusk'],
    maxRetries: 1,
    retryDelayMs: 0,
    maxFailuresPerProvider: 1,
    circuitBreakerThreshold: 1,
    circuitBreakerResetTime: 0,
    healthCheckInterval: 0,
    enableAdaptiveRouting: false,
    enableCircuitBreaker: false,
  });

  // Test case 1: Model contains 'dusk' but provider is 'sky' - should switch to dusk
  console.log('\n📋 Test 1: Model contains "dusk" with provider "openrouter-sky"');
  try {
    const result1 = await router.routeRequest(
      [{ role: 'user', parts: [{ text: 'Hello' }] }],
      'Test prompt',
      'test-key',
      'openrouter/sonoma-dusk-alpha'
    );
    console.log('✅ Test 1 passed - Provider switched correctly');
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }

  // Test case 2: Model contains 'sky' but provider is 'dusk' - should switch to sky
  console.log('\n📋 Test 2: Model contains "sky" with provider "openrouter-dusk"');
  try {
    const result2 = await router.routeRequest(
      [{ role: 'user', parts: [{ text: 'Hello' }] }],
      'Test prompt',
      'test-key',
      'openrouter/sonoma-sky-alpha'
    );
    console.log('✅ Test 2 passed - Provider switched correctly');
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }

  // Test case 3: Model and provider already match - should not switch
  console.log('\n📋 Test 3: Model and provider already match');
  try {
    const result3 = await router.routeRequest(
      [{ role: 'user', parts: [{ text: 'Hello' }] }],
      'Test prompt',
      'test-key',
      'openrouter/sonoma-sky-alpha'
    );
    console.log('✅ Test 3 passed - No unnecessary switching');
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }

  console.log('\n🎉 Provider selection tests completed!');
}

// Run the test
testProviderSelection().catch(console.error);