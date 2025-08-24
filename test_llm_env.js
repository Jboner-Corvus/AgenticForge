require('dotenv').config({ path: './.env' });

const https = require('https');

// Read configuration from environment variables
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME || 'qwen3-coder-plus';
const QWEN_API_BASE_URL = 'https://portal.qwen.ai/v1/chat/completions';

console.log('=== LLM Connection Test ===');
console.log(`LLM Model: ${LLM_MODEL_NAME}`);
console.log(`API Key configured: ${!!LLM_API_KEY ? 'YES' : 'NO'}`);

if (!LLM_API_KEY) {
  console.error('❌ No API key configured');
  process.exit(1);
}

// Test simple prompt
const testMessages = [
  {
    role: 'user',
    content: 'Hello, this is a test message. Please respond with a short greeting.'
  }
];

const requestBody = {
  model: LLM_MODEL_NAME,
  messages: testMessages,
  max_tokens: 100
};

const body = JSON.stringify(requestBody);

console.log('\nSending test request...');

const options = {
  hostname: 'portal.qwen.ai',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LLM_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        const content = response.choices?.[0]?.message?.content;
        console.log('✅ LLM Connection: SUCCESS');
        console.log(`Response: ${content ? content.substring(0, 100) : 'No content'}...`);
      } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
        console.error('Raw response:', data.substring(0, 200));
      }
    } else {
      console.error('❌ LLM Connection: FAILED');
      console.error(`Status: ${res.statusCode}`);
      console.error(`Response: ${data.substring(0, 200)}`);
      
      // Check for common issues
      if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - Check if your API key is valid');
        console.log('  - Verify the API key has not expired');
        console.log('  - Ensure the API key has access to the requested model');
      } else if (res.statusCode === 429) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - You may have exceeded your API quota');
        console.log('  - Check your Qwen account for usage limits');
      } else if (res.statusCode === 504) {
        console.log('\n🔧 Troubleshooting tips:');
        console.log('  - Network connectivity issues');
        console.log('  - Qwen API may be temporarily unavailable');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ LLM Connection: FAILED');
  console.error('Error:', error.message);
});

req.write(body);
req.end();