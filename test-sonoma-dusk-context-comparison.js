// Test to compare Sonoma Dusk behavior across different contexts:
// 1. Worker (AgenticForge) - FAILS
// 2. Node.js direct call - WORKS?
// 3. Curl command - WORKS

console.log('🔬 COMPREHENSIVE SONOMA DUSK CONTEXT COMPARISON\n');

// ============================================================================
// 1. WORKER CONTEXT (AgenticForge) - What FAILS
// ============================================================================

console.log('📊 1. WORKER CONTEXT (AgenticForge) - CURRENTLY FAILING\n');

const workerMessages = [
  {
    role: 'system',
    parts: [{ text: 'You are AgenticForge, an AI assistant with access to various tools and capabilities. You must use the available tools to accomplish tasks effectively. Always provide clear, actionable responses and use tools when appropriate.' }]
  },
  {
    role: 'user',
    parts: [{ text: 'Hello, can you help me analyze some data?' }]
  }
];

// Worker context request (from logs - this is what FAILS)
const workerRequest = {
  messages: [
    {
      content: 'You are AgenticForge, an AI assistant with access to various tools and capabilities. You must use the available tools to accomplish tasks effectively. Always provide clear, actionable responses and use tools when appropriate.',
      role: 'system'
    },
    {
      content: 'Hello, can you help me analyze some data?',
      role: 'user'
    }
  ],
  model: 'openrouter/sonoma-dusk-alpha',
  temperature: 0.3,
  max_tokens: 2048,
  top_p: 0.7,
  frequency_penalty: 0.1,
  presence_penalty: 0.1
};

const workerHeaders = {
  'Authorization': 'Bearer sk-or-v1-xxx',
  'Content-Type': 'application/json',
  'HTTP-Referer': 'http://localhost:3001',
  'X-Title': 'AgenticForge'
};

console.log('❌ FAILING REQUEST (Worker context):');
console.log('Headers:', JSON.stringify(workerHeaders, null, 2));
console.log('Body:', JSON.stringify(workerRequest, null, 2));
console.log('Result: Empty content ""');

// ============================================================================
// 2. NODE.JS DIRECT CALL - What WORKS?
// ============================================================================

console.log('\n📊 2. NODE.JS DIRECT CALL - SHOULD WORK\n');

const nodeMessages = [
  {
    role: 'user',
    parts: [{ text: 'Hello, can you help me analyze some data?' }]
  }
];

const nodeRequest = {
  messages: [
    {
      role: 'user',
      content: 'Hello, can you help me analyze some data?'
    }
  ],
  model: 'openrouter/sonoma-dusk-alpha'
};

const nodeHeaders = {
  'Authorization': 'Bearer sk-or-v1-xxx',
  'Content-Type': 'application/json'
};

console.log('✅ WORKING REQUEST (Node.js direct):');
console.log('Headers:', JSON.stringify(nodeHeaders, null, 2));
console.log('Body:', JSON.stringify(nodeRequest, null, 2));
console.log('Expected: Normal response');

// ============================================================================
// 3. CURL COMMAND - What WORKS
// ============================================================================

console.log('\n📊 3. CURL COMMAND - WORKS\n');

const curlRequest = {
  messages: [
    {
      role: 'user',
      content: 'Hello, can you help me analyze some data?'
    }
  ],
  model: 'openrouter/sonoma-dusk-alpha'
};

const curlHeaders = {
  'Authorization': 'Bearer sk-or-v1-xxx',
  'Content-Type': 'application/json'
};

console.log('✅ WORKING REQUEST (Curl):');
console.log('Headers:', JSON.stringify(curlHeaders, null, 2));
console.log('Body:', JSON.stringify(curlRequest, null, 2));

console.log('\n📋 Curl command:');
console.log(`curl -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer sk-or-v1-xxx" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(curlRequest)}'`);

console.log('Expected: Normal response');

// ============================================================================
// ANALYSIS
// ============================================================================

console.log('\n🔍 ROOT CAUSE ANALYSIS\n');

console.log('⚠️ KEY DIFFERENCES IDENTIFIED:');
console.log('1. ❌ System message present in worker (not in curl/node)');
console.log('2. ❌ Extra headers: HTTP-Referer, X-Title (worker only)');
console.log('3. ❌ Specific parameters: temperature, max_tokens, top_p, etc. (worker only)');
console.log('4. ❌ Complex message processing (worker only)');

console.log('\n💡 HYPOTHESIS: Sonoma Dusk fails because:');
console.log('• System message might confuse/conflict with Sonoma Dusk');
console.log('• Extra headers might trigger filtering/blocking');
console.log('• Specific parameters might not be supported');
console.log('• Complex message structure might cause parsing issues');

console.log('\n🧪 TEST STRATEGY:');
console.log('1. Test worker without system message');
console.log('2. Test worker without extra headers');
console.log('3. Test worker with minimal parameters');
console.log('4. Test worker with simple message format');
console.log('5. Compare responses at each step');

console.log('\n🎯 CONCLUSION:');
console.log('The issue is NOT with Sonoma Dusk itself, but with how');
console.log('AgenticForge processes and sends requests to it.');
console.log('Sonoma Dusk works fine with simple requests, but fails');
console.log('with the complex request structure used by the worker.');