// Test to compare our OpenRouterProvider request with a typical curl request
// This will help identify why Sonoma Dusk works with curl but fails in our implementation

console.log('🔍 Analyzing OpenRouterProvider request structure...\n');

// Simulate what our OpenRouterProvider creates
const testMessages = [
  {
    role: 'user',
    parts: [{ text: 'Hello, can you help me with a simple task?' }]
  }
];

const systemPrompt = 'You are a helpful AI assistant.';

console.log('📤 Our OpenRouterProvider request structure:');

// Process messages like our provider does
const openRouterMessages = testMessages.map((msg) => ({
  content: msg.parts.map((part) => part.text).join(''),
  role: msg.role === 'user' ? 'user' : 'assistant',
}));

if (systemPrompt) {
  openRouterMessages.unshift({ content: systemPrompt, role: 'system' });
}

// Our provider's request body
const ourRequestBody = {
  messages: openRouterMessages,
  model: 'openrouter/sonoma-dusk-alpha',
  temperature: 0.3,
  max_tokens: 2048,
  top_p: 0.7,
  frequency_penalty: 0.1,
  presence_penalty: 0.1,
};

// Our provider's headers
const ourHeaders = {
  'Authorization': 'Bearer sk-or-v1-xxx',
  'Content-Type': 'application/json',
  'HTTP-Referer': 'http://localhost:3001',
  'X-Title': 'AgenticForge',
};

console.log('Headers:', JSON.stringify(ourHeaders, null, 2));
console.log('Body:', JSON.stringify(ourRequestBody, null, 2));

console.log('\n📋 Equivalent curl command:');
console.log(`curl -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer sk-or-v1-xxx" \\
  -H "Content-Type: application/json" \\
  -H "HTTP-Referer: http://localhost:3001" \\
  -H "X-Title: AgenticForge" \\
  -d '${JSON.stringify(ourRequestBody)}'`);

console.log('\n🔍 What a SIMPLE curl request would look like:');

// Simple curl request (what typically works)
const simpleRequestBody = {
  messages: [
    {
      role: 'user',
      content: 'Hello, can you help me with a simple task?'
    }
  ],
  model: 'openrouter/sonoma-dusk-alpha'
};

const simpleHeaders = {
  'Authorization': 'Bearer sk-or-v1-xxx',
  'Content-Type': 'application/json'
};

console.log('Simple Headers:', JSON.stringify(simpleHeaders, null, 2));
console.log('Simple Body:', JSON.stringify(simpleRequestBody, null, 2));

console.log('\n📋 Simple curl command:');
console.log(`curl -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer sk-or-v1-xxx" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(simpleRequestBody)}'`);

console.log('\n⚠️ KEY DIFFERENCES THAT COULD CAUSE ISSUES:');
console.log('1. ❌ Extra headers: HTTP-Referer, X-Title (might be blocked/filtered)');
console.log('2. ❌ Complex message structure (system message + processed user message)');
console.log('3. ❌ Specific parameters: temperature, max_tokens, top_p, frequency_penalty, presence_penalty');
console.log('4. ❌ Model name format: openrouter/sonoma-dusk-alpha (might need just sonoma-dusk-alpha)');

console.log('\n💡 HYPOTHESIS: Sonoma Dusk fails because:');
console.log('- It might not support the specific parameters we send');
console.log('- The extra headers might trigger filtering or blocking');
console.log('- The model name format might be incorrect');
console.log('- Complex message processing might confuse the model');

console.log('\n🧪 TEST SUGGESTIONS:');
console.log('1. Try removing HTTP-Referer and X-Title headers');
console.log('2. Try simpler message format without system message');
console.log('3. Try removing temperature/max_tokens parameters');
console.log('4. Try different model name format (just "sonoma-dusk-alpha")');
console.log('5. Try with minimal request body like simple curl');