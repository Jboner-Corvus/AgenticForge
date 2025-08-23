#!/usr/bin/env ts-node

/**
 * Diagnostic script to troubleshoot Qwen connection issues
 * Usage: ts-node diagnose-qwen-connection.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function diagnoseQwenConnection() {
  console.log('🔍 Diagnosing Qwen Connection Issues...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = ['LLM_API_KEY', 'LLM_PROVIDER', 'LLM_MODEL_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are present');
    console.log(`  LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
    console.log(`  LLM_MODEL_NAME: ${process.env.LLM_MODEL_NAME}`);
    console.log(`  LLM_API_KEY: ${process.env.LLM_API_KEY ? `${process.env.LLM_API_KEY.substring(0, 10)}...` : 'Not set'}`);
  }
  
  // Check Qwen-specific variables
  console.log('\n📋 Qwen-Specific Configuration:');
  const qwenVars = ['QWEN_API_BASE_URL'];
  qwenVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`  ${varName}: Not set (using defaults)`);
    }
  });
  
  // Test network connectivity
  console.log('\n🌐 Network Connectivity Test:');
  const testUrls = [
    'https://portal.qwen.ai', // Qwen Portal
    'https://portal.qwen.ai/v1/chat/completions', // Correct Qwen Portal API endpoint
    'https://dashscope.aliyuncs.com',
    'https://qwen.aliyuncs.com'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`  Testing ${url}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`  ✅ ${url} is reachable (status: ${response.status})`);
    } catch (error) {
      console.log(`  ❌ ${url} is unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Test API key if available
  if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER === 'qwen') {
    console.log('\n🔑 API Key Validation:');
    try {
      const testUrl = process.env.QWEN_API_BASE_URL || 
        'https://portal.qwen.ai/v1/chat/completions'; // Correct Qwen Portal API endpoint
      
      console.log(`  Testing API key with endpoint: ${testUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL_NAME || 'qwen3-coder-plus',
          messages: [
            {
              role: 'user',
              content: 'This is a test message to validate the API key.'
            }
          ],
          max_tokens: 10
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('  ✅ API key is valid');
      } else {
        const errorText = await response.text();
        console.log(`  ❌ API key validation failed (status: ${response.status})`);
        console.log(`     Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`  ❌ API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n✨ Diagnosis complete!');
  console.log('\n💡 Tips for resolving Qwen connection issues:');
  console.log('   1. Verify your API key is correct and active');
  console.log('   2. Check that you have access to the Qwen model in your Qwen Portal account');
  console.log('   3. Ensure your account has sufficient credits/balance');
  console.log('   4. Try using a different network connection');
  console.log('   5. Check the Qwen provider documentation for more troubleshooting steps');
}

// Run the diagnosis
diagnoseQwenConnection().catch(console.error);#!/usr/bin/env ts-node

/**
 * Diagnostic script to troubleshoot Qwen connection issues
 * Usage: ts-node diagnose-qwen-connection.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function diagnoseQwenConnection() {
  console.log('🔍 Diagnosing Qwen Connection Issues...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = ['LLM_API_KEY', 'LLM_PROVIDER', 'LLM_MODEL_NAME'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are present');
    console.log(`  LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
    console.log(`  LLM_MODEL_NAME: ${process.env.LLM_MODEL_NAME}`);
    console.log(`  LLM_API_KEY: ${process.env.LLM_API_KEY ? `${process.env.LLM_API_KEY.substring(0, 10)}...` : 'Not set'}`);
  }
  
  // Check Qwen-specific variables
  console.log('\n📋 Qwen-Specific Configuration:');
  const qwenVars = ['QWEN_API_BASE_URL'];
  qwenVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ${varName}: ${process.env[varName]}`);
    } else {
      console.log(`  ${varName}: Not set (using defaults)`);
    }
  });
  
  // Test network connectivity
  console.log('\n🌐 Network Connectivity Test:');
  const testUrls = [
    'https://dashscope.aliyuncs.com',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    'https://qwen.aliyuncs.com'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`  Testing ${url}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`  ✅ ${url} is reachable (status: ${response.status})`);
    } catch (error) {
      console.log(`  ❌ ${url} is unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Test API key if available
  if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER === 'qwen') {
    console.log('\n🔑 API Key Validation:');
    try {
      const testUrl = process.env.QWEN_API_BASE_URL || 
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
      
      console.log(`  Testing API key with endpoint: ${testUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL_NAME || 'qwen3-coder-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: 'This is a test message to validate the API key.'
              }
            ]
          },
          parameters: {
            max_tokens: 10
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('  ✅ API key is valid');
      } else {
        const errorText = await response.text();
        console.log(`  ❌ API key validation failed (status: ${response.status})`);
        console.log(`     Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`  ❌ API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n✨ Diagnosis complete!');
  console.log('\n💡 Tips for resolving Qwen connection issues:');
  console.log('   1. Verify your API key is correct and active');
  console.log('   2. Check that you have access to the Qwen model in your DashScope account');
  console.log('   3. Ensure your account has sufficient credits/balance');
  console.log('   4. Try using a different network connection');
  console.log('   5. Check the Qwen provider documentation for more troubleshooting steps');
}

// Run the diagnosis
diagnoseQwenConnection().catch(console.error);