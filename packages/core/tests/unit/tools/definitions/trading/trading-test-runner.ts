#!/usr/bin/env node

/**
 * Trading Tools Test Runner
 * Integration test for AgenticForge trading functionality
 */

import { execa } from 'execa';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function runTradingTests() {
  console.log('🚀 Starting Trading Tools Integration Tests...');
  
  try {
    // Path to our bash test script
    const testScriptPath = join(
      process.cwd(),
      'tests',
      'unit',
      'tools',
      'definitions',
      'trading',
      'trading-tools-test.sh'
    );
    
    // Run the bash test script
    const { stdout, stderr } = await execa('bash', [testScriptPath], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
    console.log('✅ Trading tools tests completed');
    
    // If we want to capture and process results
    if (stdout) {
      console.log('Output:', stdout);
    }
    
    if (stderr) {
      console.error('Errors:', stderr);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Trading tools tests failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTradingTests();