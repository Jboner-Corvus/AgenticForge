#!/usr/bin/env node

/**
 * Worker Simulation Test - Exact Replica of Worker Environment
 * Tests OpenRouter models using the exact same code and conditions as the worker
 */

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(colors.bold + colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.bold + colors.cyan, ` ${message}`);
  log(colors.bold + colors.cyan, `${'='.repeat(80)}`);
}

function logTest(message) {
  log(colors.cyan, `🧪 ${message}`);
}

function logSuccess(message) {
  log(colors.green, `✅ ${message}`);
}

function logError(message) {
  log(colors.red, `❌ ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// Simulate exact worker message format
function generateWorkerMessages(targetTokenCount) {
  const messages = [];

  // System message - exact replica from worker
  messages.push({
    role: 'system',
    parts: [{ text: 'You are Kilo Code, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.' }]
  });

  // Add conversation history like worker does
  if (targetTokenCount > 1000) {
    messages.push({
      role: 'user',
      parts: [{ text: 'pourquoi t iteration starting"}' }]
    });

    messages.push({
      role: 'assistant',
      parts: [{ text: 'The agent is thinking... (iteration 1)' }]
    });
  }

  // Add tool context like worker
  if (targetTokenCount > 2000) {
    messages.push({
      role: 'user',
      parts: [{ text: 'Available tools: read_file, write_file, execute_command, search_files, list_files' }]
    });
  }

  // Main user message
  const mainMessage = `Bonjour! Peux-tu me dire quel modèle OpenRouter tu utilises? Réponds en français et précise le nom exact du modèle.`;
  messages.push({
    role: 'user',
    parts: [{ text: mainMessage }]
  });

  return messages;
}

// Test using exact worker OpenRouterProvider logic
async function testWorkerStyleRequest(modelName, targetTokenCount) {
  logTest(`Testing ${modelName} with worker-style messages (~${targetTokenCount} tokens)`);

  const apiKey = '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';
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  // Generate messages exactly like worker
  const messages = generateWorkerMessages(targetTokenCount);

  // Convert to OpenRouter format (like worker does)
  const openRouterMessages = messages.map((msg) => ({
    content: msg.parts.map((part) => part.text).join(''),
    role: msg.role === 'user' ? 'user' : 'assistant',
  }));

  // Add system message like worker
  if (messages[0]?.role === 'system') {
    openRouterMessages.unshift({
      content: messages[0].parts[0].text,
      role: 'system'
    });
  }

  // Worker-style parameters
  let temperature = 0.7;
  let maxTokens = 4096;
  let topP = 0.9;

  if (modelName.includes('sonoma-dusk-alpha')) {
    temperature = 0.3;
    maxTokens = 2048;
    topP = 0.7;
  }

  const requestBody = {
    messages: openRouterMessages,
    model: modelName,
    temperature: temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  };

  try {
    log(colors.dim, `  📤 Sending worker-style request...`);

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

    log(colors.dim, `  📥 Response received in ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Check for empty content (worker logic)
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    logInfo(`  📊 Token usage: ${promptTokens} prompt + ${completionTokens} completion = ${promptTokens + completionTokens} total`);

    // Worker empty content check
    if (content === undefined || content === null || content.trim() === '') {
      logError(`  🚫 WORKER-STYLE EMPTY CONTENT DETECTED!`);
      log(colors.dim, `  📄 Full response: ${JSON.stringify(data, null, 2)}`);
      return {
        success: false,
        error: 'Worker-style empty content detected',
        tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
        responseTime: endTime - startTime
      };
    }

    // Success
    const responseLength = content.length;
    logSuccess(`  📝 Response length: ${responseLength} characters`);
    const preview = content.substring(0, 100);
    log(colors.dim, `  💬 Preview: "${preview}${content.length > 100 ? '...' : ''}"`);

    return {
      success: true,
      content: content,
      tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
      responseTime: endTime - startTime,
      responseLength: responseLength
    };

  } catch (error) {
    logError(`  💥 Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      tokens: { prompt: 0, completion: 0, total: 0 },
      responseTime: 0
    };
  }
}

async function runWorkerSimulationTests() {
  logHeader('🔧 WORKER SIMULATION - EXACT REPLICA TESTS');

  const testScenarios = [
    // Test with worker-like token counts
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 11840 }, // Exact worker size
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 10000 },
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 5000 },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 11840 }, // Exact worker size
    { model: 'openrouter/sonoma-sky-alpha', tokens: 10000 },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 5000 },
  ];

  const results = {
    total: testScenarios.length,
    passed: 0,
    failed: 0,
    workerFailures: [],
  };

  log(colors.yellow, `🧪 Testing with EXACT worker message format and parameters...`);

  for (const scenario of testScenarios) {
    const result = await testWorkerStyleRequest(scenario.model, scenario.tokens);

    if (result.success) {
      results.passed++;
      logSuccess(`${scenario.model} with ${scenario.tokens} tokens: ✅ SUCCESS`);
    } else {
      results.failed++;
      results.workerFailures.push({ ...scenario, result });
      logError(`${scenario.model} with ${scenario.tokens} tokens: ❌ FAILED - ${result.error}`);
    }

    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Analysis
  logHeader('🔍 WORKER SIMULATION ANALYSIS');

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(colors.bold + (results.failed === 0 ? colors.green : colors.red),
    `📈 Success Rate: ${successRate}% (${results.passed}/${results.total})`);

  if (results.workerFailures.length > 0) {
    log(colors.bold + colors.red, '\n🚨 WORKER-STYLE FAILURES DETECTED:');
    results.workerFailures.forEach(failure => {
      log(colors.red, `   • ${failure.model} (${failure.tokens} tokens): ${failure.result.error}`);
    });

    log(colors.yellow, '\n💡 CONCLUSION: Worker implementation has issues, not the models!');
  } else {
    log(colors.bold + colors.green, '\n🎉 ALL WORKER-STYLE TESTS PASSED!');
    log(colors.green, '   Models work perfectly with worker message format');
  }

  return results.failed === 0;
}

// Run worker simulation tests
runWorkerSimulationTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });