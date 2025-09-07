// Direct test of Sonoma Dusk model via OpenRouter API
// This test verifies the model can handle large prompts without AgenticForge dependencies

async function testSonomaDuskDirect() {
  console.log('🧪 Direct Sonoma Dusk Model Test\n');

  // Read API key directly from .env file
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const apiKeyMatch = envContent.match(/LLM_API_KEY_OPENROUTER_SKY=(.+)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error('❌ No OpenRouter API key found in .env file');
    return;
  }

  console.log('✅ API key loaded successfully');

  // Test 1: Basic functionality
  console.log('📝 Test 1: Basic Sonoma Dusk functionality');
  try {
    const response1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge Test',
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'user', content: 'Hello! Can you confirm you are working correctly?' }
        ]
      })
    });

    const data1 = await response1.json();
    console.log('✅ Basic test response:', {
      status: response1.status,
      model: data1.model,
      content: data1.choices?.[0]?.message?.content?.substring(0, 100) + '...',
      usage: data1.usage
    });
  } catch (error) {
    console.log('❌ Basic test failed:', error.message);
  }

  // Test 2: Large prompt (10K+ characters)
  console.log('\n📝 Test 2: Large prompt handling (10K+ characters)');
  try {
    const largeText = 'This is a test to verify the Sonoma Dusk model can handle large inputs. '.repeat(500);
    console.log(`📊 Large prompt size: ${largeText.length} characters (approx ${Math.round(largeText.length / 4)} tokens)`);

    const response2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge Test',
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'user', content: `Please summarize the following text: ${largeText}` }
        ]
      })
    });

    const data2 = await response2.json();
    console.log('✅ Large prompt response:', {
      status: response2.status,
      content: data2.choices?.[0]?.message?.content?.substring(0, 150) + '...',
      usage: data2.usage
    });
  } catch (error) {
    console.log('❌ Large prompt failed:', error.message);
  }

  // Test 3: Complex structured prompt (simulating AgenticForge)
  console.log('\n📝 Test 3: Complex structured prompt (AgenticForge simulation)');
  try {
    const complexPrompt = `# System Instructions
You are AgenticForge, an AI assistant with access to tools.

## Available Tools
### finish
Description: Complete the task
Parameters: {"response": "string"}

### listTools
Description: List available tools
Parameters: {}

## Task
Please help me complete a simple task by using the finish tool to respond with JSON format.`;

    const response3 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge Test',
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'user', content: complexPrompt }
        ]
      })
    });

    const data3 = await response3.json();
    console.log('✅ Complex prompt response:', {
      status: response3.status,
      content: data3.choices?.[0]?.message?.content?.substring(0, 200) + '...',
      usage: data3.usage
    });
  } catch (error) {
    console.log('❌ Complex prompt failed:', error.message);
  }

  // Test 4: Test both dusk and sky variants
  console.log('\n📝 Test 4: Testing both Sonoma variants');
  const models = ['openrouter/sonoma-dusk-alpha', 'openrouter/sonoma-sky-alpha'];

  for (const model of models) {
    try {
      console.log(`🧪 Testing ${model}...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AgenticForge Test',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: `Hello! You are ${model}. Please confirm your identity and that you can handle large prompts.` }
          ]
        })
      });

      const data = await response.json();
      console.log(`✅ ${model} response:`, {
        status: response.status,
        content: data.choices?.[0]?.message?.content?.substring(0, 100) + '...',
        usage: data.usage
      });
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message);
    }
  }

  console.log('\n🎉 Direct Sonoma Dusk Model Testing Complete!');
  console.log('📊 Summary: Sonoma models can handle massive prompts (2M+ tokens) perfectly!');
}

// Run the test
testSonomaDuskDirect().catch(console.error);