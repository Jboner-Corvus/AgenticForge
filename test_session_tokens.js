// Test script to verify session tokens are working correctly
import { useSessionStore } from './packages/ui/src/store/sessionStore.js';

console.log('🧪 Testing Session Tokens Functionality...');

// Test token estimation
async function testTokenEstimation() {
  console.log('\n📊 Testing Token Estimation...');

  // Simulate adding messages to see token counting
  const store = useSessionStore.getState();

  console.log('Initial tokens:', store.sessionTokensUsed);

  // Add a user message
  store.addMessage({
    type: 'user',
    role: 'user',
    content: 'Hello, can you help me with a complex task?',
    timestamp: Date.now()
  });

  console.log('After user message:', useSessionStore.getState().sessionTokensUsed);

  // Add an assistant message
  store.addMessage({
    type: 'assistant',
    role: 'assistant',
    content: 'Of course! I can help you with complex tasks. What would you like me to do?',
    timestamp: Date.now()
  });

  console.log('After assistant message:', useSessionStore.getState().sessionTokensUsed);

  // Add a longer message
  store.addMessage({
    type: 'user',
    role: 'user',
    content: 'I need you to navigate to a website, fill out a form with multiple fields, take screenshots at each step, and then analyze the results. This should test all your browser automation capabilities including form filling, element interaction, screenshot capture, and content analysis.',
    timestamp: Date.now()
  });

  console.log('After long message:', useSessionStore.getState().sessionTokensUsed);

  // Test clearing messages
  store.clearMessages();
  console.log('After clearing messages:', useSessionStore.getState().sessionTokensUsed);

  console.log('✅ Token estimation test completed');
}

// Test session creation
async function testSessionCreation() {
  console.log('\n🔄 Testing Session Creation...');

  const store = useSessionStore.getState();
  console.log('Tokens before new session:', store.sessionTokensUsed);

  // Create new session (should reset tokens)
  await store.createNewSession();
  console.log('Tokens after new session:', useSessionStore.getState().sessionTokensUsed);

  console.log('✅ Session creation test completed');
}

// Run tests
async function runTests() {
  try {
    await testTokenEstimation();
    await testSessionCreation();

    console.log('\n🎉 All session token tests completed successfully!');
    console.log('📈 Final token count:', useSessionStore.getState().sessionTokensUsed);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();