#!/usr/bin/env node

/**
 * Simple OpenRouter Test Script
 * Tests OpenRouter provider functionality directly
 */

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(colors.bold + colors.blue, `\n${'='.repeat(60)}`);
  log(colors.bold + colors.blue, ` ${message}`);
  log(colors.bold + colors.blue, `${'='.repeat(60)}`);
}

function logTest(message) {
  log(colors.yellow, `🧪 ${message}`);
}

function logSuccess(message) {
  log(colors.green, `✅ ${message}`);
}

function logError(message) {
  log(colors.red, `❌ ${message}`);
}

async function testOpenRouterDirect(modelName, testName) {
  logTest(`Testing OpenRouter API directly with model ${modelName} - ${testName}`);

  const apiKey = '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';
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Keep responses concise and follow instructions exactly.'
      },
      {
        role: 'user',
        content: 'Hello! Please respond with exactly: "OpenRouter test successful - ' + modelName + '"'
      }
    ]
  };

  try {
    log(colors.blue, `  📤 Sending direct API request to OpenRouter...`);

    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AgenticForge',
      },
      body: JSON.stringify(requestBody)
    });
    const endTime = Date.now();

    log(colors.blue, `  📥 Response received in ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Check for empty content
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim() === '') {
      log(colors.yellow, `  ⚠️  Empty content detected!`);
      log(colors.blue, `  📄 Full response: ${JSON.stringify(data, null, 2)}`);
      throw new Error('Empty content in response');
    }

    if (content.length < 10) {
      log(colors.yellow, `  ⚠️  Response seems too short: "${content}"`);
    }

    logSuccess(`Response: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
    return true;

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

async function runSimpleTests() {
  logHeader('🚀 SIMPLE OPENROUTER DIRECT API TEST');

  const tests = [
    { model: 'openrouter/sonoma-dusk-alpha', name: 'Sonoma Dusk Alpha (Primary)' },
    { model: 'openrouter/sonoma-sky-alpha', name: 'Sonoma Sky Alpha (Secondary)' },
    { model: 'openrouter/gpt-4o-mini', name: 'GPT-4o Mini (Fallback)' },
    { model: 'openrouter/claude-3-haiku', name: 'Claude 3 Haiku (Alternative)' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testOpenRouterDirect(test.model, test.name);
    if (success) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  logHeader('📊 TEST RESULTS SUMMARY');
  log(colors.green, `✅ Passed: ${passed}`);
  log(colors.red, `❌ Failed: ${failed}`);
  log(colors.blue, `📈 Total: ${passed + failed}`);

  if (failed === 0) {
    log(colors.bold + colors.green, '\n🎉 ALL TESTS PASSED! OpenRouter API is working correctly.');
  } else {
    log(colors.bold + colors.red, `\n⚠️  ${failed} test(s) failed. OpenRouter API may have issues.`);
  }

  return failed === 0;
}

// Run tests
runSimpleTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });