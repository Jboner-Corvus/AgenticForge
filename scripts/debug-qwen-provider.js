#!/usr/bin/env node

/**
 * Simple debug utility for the Qwen provider
 * This script helps diagnose common Qwen provider issues
 */

const fs = require('fs');
const path = require('path');

// Simple function to check if .env file exists and has Qwen config
function checkEnvConfig() {
  const envPath = path.join(__dirname, '..', '.env');
  console.log('🔍 Checking .env configuration...');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  const requiredKeys = ['LLM_PROVIDER', 'LLM_API_KEY', 'LLM_MODEL_NAME'];
  const foundKeys = {};
  
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      if (requiredKeys.includes(key.trim())) {
        foundKeys[key.trim()] = value ? value.trim() : '';
      }
    }
  });
  
  let allFound = true;
  requiredKeys.forEach(key => {
    if (!foundKeys[key]) {
      console.log(`❌ Missing ${key} in .env`);
      allFound = false;
    } else {
      console.log(`✅ Found ${key}: ${key === 'LLM_API_KEY' ? foundKeys[key].substring(0, 10) + '...' : foundKeys[key]}`);
    }
  });
  
  // Check if Qwen is configured
  if (foundKeys['LLM_PROVIDER'] && foundKeys['LLM_PROVIDER'].toLowerCase() === 'qwen') {
    console.log('✅ Qwen provider is configured');
  } else {
    console.log('⚠️  Qwen provider is not configured as default LLM_PROVIDER');
  }
  
  return allFound;
}

// Simple network test function
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing network connectivity to Qwen endpoints...');
  
  const endpoints = [
    'https://dashscope.aliyuncs.com',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    'https://qwen.aliyuncs.com'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing ${endpoint}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`  ✅ ${endpoint} is reachable (status: ${response.status})`);
    } catch (error) {
      console.log(`  ❌ ${endpoint} is unreachable: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  console.log('🔧 Qwen Provider Debug Utility');
  console.log('==============================\n');
  
  // Check environment configuration
  const envOk = checkEnvConfig();
  
  // Test network connectivity
  await testNetworkConnectivity();
  
  console.log('\n✨ Debug utility completed');
  console.log('\n💡 For more detailed diagnostics, run:');
  console.log('   ts-node scripts/diagnose-qwen-connection.ts');
}

// Run the debug utility
main().catch(console.error);