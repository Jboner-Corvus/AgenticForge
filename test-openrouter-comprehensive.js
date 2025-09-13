#!/usr/bin/env node

/**
 * Comprehensive OpenRouter Test Script - Advanced Diagnostics
 * Tests OpenRouter models with various input sizes and patterns
 * Specifically designed to diagnose sonoma-dusk-alpha limitations
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

function logSubHeader(message) {
  log(colors.bold + colors.yellow, `\n${'-'.repeat(60)}`);
  log(colors.bold + colors.yellow, ` ${message}`);
  log(colors.bold + colors.yellow, `${'-'.repeat(60)}`);
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

function logWarning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// Generate test content of specific sizes
function generateTestContent(tokenCount, contentType = 'mixed') {
  const basePrompts = {
    simple: "Hello! Please respond with exactly: 'Test successful'",
    medium: "You are a helpful AI assistant. Please analyze this text and provide a brief summary. The text contains information about artificial intelligence and its applications in modern technology.",
    complex: "As an advanced AI language model, you need to demonstrate comprehensive understanding of multiple domains including computer science, mathematics, philosophy, and practical applications. Please provide detailed analysis covering theoretical foundations, implementation strategies, ethical considerations, and future implications."
  };

  let content = basePrompts[contentType] || basePrompts.simple;

  // Add conversation history to simulate worker patterns
  if (tokenCount > 1000) {
    content += "\n\nPrevious conversation context:\n";
    for (let i = 0; i < Math.min(20, Math.floor(tokenCount / 200)); i++) {
      content += `- User: Can you help me with ${['coding', 'analysis', 'research', 'design', 'optimization'][i % 5]}?\n`;
      content += `- Assistant: Yes, I'd be happy to help you with ${['coding', 'analysis', 'research', 'design', 'optimization'][i % 5]}. What specific aspects would you like me to focus on?\n`;
    }
  }

  // Add tool/function calling context (common in worker)
  if (tokenCount > 2000) {
    content += "\n\nAvailable tools and functions:\n";
    const tools = [
      'file_manager', 'readFile', 'writeFile', 'executeShellCommand',
      'web_automation', 'canvas_console_feedback', 'project_planning',
      'ai_summarize', 'alpha_intelligence', 'company_overview'
    ];

    tools.forEach((tool, index) => {
      content += `${index + 1}. ${tool}: A tool for ${tool.replace(/_/g, ' ')}\n`;
    });

    content += "\nSystem instructions: You have access to various tools. Use them when appropriate to complete user requests effectively.\n";
  }

  // Add complex reasoning context
  if (tokenCount > 5000) {
    content += "\n\nComplex reasoning requirements:\n";
    content += "When responding to user queries, you should:\n";
    content += "1. Analyze the request thoroughly\n";
    content += "2. Consider multiple approaches and solutions\n";
    content += "3. Evaluate potential risks and limitations\n";
    content += "4. Provide detailed explanations with examples\n";
    content += "5. Suggest follow-up actions or improvements\n";
    content += "6. Maintain context awareness throughout the conversation\n";
    content += "7. Use appropriate tools when they would enhance the response\n";
    content += "8. Ensure responses are comprehensive yet concise\n";
    content += "9. Consider edge cases and error handling\n";
    content += "10. Provide actionable recommendations\n";
  }

  // Pad content to reach target token count (rough estimation)
  const targetLength = tokenCount * 4; // Rough token to character ratio
  while (content.length < targetLength) {
    content += " This is additional context to increase the prompt size for testing purposes. ";
    content += "The model needs to handle various types of input including technical documentation, ";
    content += "code examples, configuration settings, and conversational context. ";
    content += "Understanding the full scope of user requirements is crucial for providing ";
    content += "accurate and helpful responses in complex scenarios. ";
  }

  return content.substring(0, targetLength);
}

async function testModelWithInputSize(modelName, targetTokenCount, contentType = 'mixed') {
  logTest(`Testing ${modelName} with ~${targetTokenCount} tokens (${contentType} content)`);

  const apiKey = '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';
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  // Generate test content
  const userContent = generateTestContent(targetTokenCount, contentType);

  const requestBody = {
    model: modelName,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Always respond clearly and concisely, even with complex inputs.'
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    temperature: 0.3, // Lower temperature for consistency
    max_tokens: 2048, // Reasonable response limit
    top_p: 0.7
  };

  try {
    log(colors.dim, `  📤 Sending request with ${userContent.length} characters...`);

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

    // Analyze response
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    logInfo(`  📊 Token usage: ${promptTokens} prompt + ${completionTokens} completion = ${promptTokens + completionTokens} total`);

    // Check for empty content
    if (!content || content.trim() === '') {
      logWarning(`  🚫 Empty response detected!`);
      log(colors.dim, `  📄 Response structure: ${JSON.stringify(data, null, 2)}`);
      return {
        success: false,
        error: 'Empty content',
        tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
        responseTime: endTime - startTime
      };
    }

    // Check response quality
    const responseLength = content.length;
    const isTooShort = responseLength < 10;
    const isTooLong = responseLength > 5000;

    if (isTooShort) {
      logWarning(`  ⚠️  Response seems too short: ${responseLength} characters`);
    } else if (isTooLong) {
      logWarning(`  ⚠️  Response seems too long: ${responseLength} characters`);
    } else {
      logSuccess(`  📝 Response length: ${responseLength} characters`);
    }

    // Show preview of response
    const preview = content.substring(0, 150);
    log(colors.dim, `  💬 Preview: "${preview}${content.length > 150 ? '...' : ''}"`);

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

async function runComprehensiveTests() {
  logHeader('🚀 COMPREHENSIVE OPENROUTER MODEL DIAGNOSTICS');

  // Focus on Sonoma models with various input sizes
  const testScenarios = [
    // Small inputs (should work)
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 100, type: 'simple' },
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 500, type: 'medium' },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 100, type: 'simple' },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 500, type: 'medium' },

    // Medium inputs (potential issues)
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 2000, type: 'complex' },
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 5000, type: 'mixed' },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 2000, type: 'complex' },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 5000, type: 'mixed' },

    // Large inputs (worker-like, likely to fail)
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 10000, type: 'mixed' },
    { model: 'openrouter/sonoma-dusk-alpha', tokens: 11840, type: 'mixed' }, // Exact worker size
    { model: 'openrouter/sonoma-sky-alpha', tokens: 10000, type: 'mixed' },
    { model: 'openrouter/sonoma-sky-alpha', tokens: 11840, type: 'mixed' }, // Exact worker size

    // Compare with other models
    { model: 'openrouter/gpt-4o-mini', tokens: 11840, type: 'mixed' },
    { model: 'openrouter/claude-3-haiku', tokens: 11840, type: 'mixed' },
  ];

  const results = {
    total: testScenarios.length,
    passed: 0,
    failed: 0,
    sonomaResults: [],
    otherResults: []
  };

  // Group results by model type
  for (const scenario of testScenarios) {
    const isSonoma = scenario.model.includes('sonoma');
    const result = await testModelWithInputSize(scenario.model, scenario.tokens, scenario.type);

    if (result.success) {
      results.passed++;
      if (isSonoma) results.sonomaResults.push({ ...scenario, result });
      else results.otherResults.push({ ...scenario, result });
    } else {
      results.failed++;
      if (isSonoma) results.sonomaResults.push({ ...scenario, result });
      else results.otherResults.push({ ...scenario, result });
    }

    // Delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Analysis and Summary
  logHeader('📊 COMPREHENSIVE ANALYSIS RESULTS');

  // Sonoma models analysis
  logSubHeader('🌙 SONOMA MODELS PERFORMANCE ANALYSIS');
  const sonomaPassed = results.sonomaResults.filter(r => r.result.success).length;
  const sonomaFailed = results.sonomaResults.filter(r => !r.result.success).length;

  log(colors.green, `✅ Sonoma Passed: ${sonomaPassed}`);
  log(colors.red, `❌ Sonoma Failed: ${sonomaFailed}`);

  // Analyze failure patterns
  const sonomaFailures = results.sonomaResults.filter(r => !r.result.success);
  if (sonomaFailures.length > 0) {
    logSubHeader('🔍 SONOMA FAILURE ANALYSIS');

    // Group by token size
    const failuresBySize = {};
    sonomaFailures.forEach(failure => {
      const size = failure.tokens;
      if (!failuresBySize[size]) failuresBySize[size] = [];
      failuresBySize[size].push(failure);
    });

    Object.keys(failuresBySize).sort((a, b) => parseInt(a) - parseInt(b)).forEach(size => {
      const count = failuresBySize[size].length;
      logWarning(`  ${size} tokens: ${count} failure(s)`);
    });

    // Find the breaking point
    const sortedSizes = Object.keys(failuresBySize).map(s => parseInt(s)).sort((a, b) => a - b);
    if (sortedSizes.length > 0) {
      const breakingPoint = sortedSizes[0];
      logError(`  🚨 Breaking point: ~${breakingPoint} tokens`);
    }
  }

  // Compare with other models
  logSubHeader('🔄 CROSS-MODEL COMPARISON');
  const otherPassed = results.otherResults.filter(r => r.result.success).length;
  const otherFailed = results.otherResults.filter(r => !r.result.success).length;

  log(colors.green, `✅ Other Models Passed: ${otherPassed}`);
  log(colors.red, `❌ Other Models Failed: ${otherFailed}`);

  // Overall summary
  logHeader('🏆 FINAL SUMMARY');

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(colors.bold + (results.failed === 0 ? colors.green : colors.yellow),
    `📈 Overall Success Rate: ${successRate}% (${results.passed}/${results.total})`);

  if (sonomaFailed > 0) {
    log(colors.bold + colors.red, '\n🚨 SONOMA MODEL LIMITATIONS DETECTED:');
    log(colors.red, '   • Models fail with large/complex prompts');
    log(colors.red, '   • Worker-like inputs (11K+ tokens) consistently fail');
    log(colors.red, '   • Simple inputs work fine, complex ones don\'t');
    log(colors.yellow, '\n💡 RECOMMENDATION: Use fallback mechanisms for Sonoma models');
  }

  if (results.failed === 0) {
    log(colors.bold + colors.green, '\n🎉 ALL TESTS PASSED! OpenRouter API is fully functional.');
  }

  return results.failed === 0;
}

// Run comprehensive tests
runComprehensiveTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });