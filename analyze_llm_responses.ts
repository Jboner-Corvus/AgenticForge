import { readFileSync } from 'fs';
import { join } from 'path';

// Read the worker log file
const logPath = join(__dirname, 'worker.log');
const logContent = readFileSync(logPath, 'utf-8');

// Parse log entries
const logLines = logContent.split('\n').filter(line => line.trim());
const llmResponses: any[] = [];
const parsingErrors: any[] = [];

console.log('=== LLM Response Analysis ===\n');

// Extract LLM responses and parsing errors
logLines.forEach(line => {
  try {
    const logEntry = JSON.parse(line);
    
    // Collect LLM responses
    if (logEntry.msg === 'Raw LLM response') {
      llmResponses.push({
        timestamp: new Date(logEntry.time).toISOString(),
        response: logEntry.llmResponse,
        provider: logEntry.provider,
        jobId: logEntry.jobId
      });
    }
    
    // Collect parsing errors
    if (logEntry.msg === 'Failed to parse LLM response') {
      parsingErrors.push({
        timestamp: new Date(logEntry.time).toISOString(),
        response: logEntry.llmResponse,
        provider: logEntry.provider,
        jobId: logEntry.jobId
      });
    }
  } catch (e) {
    // Skip non-JSON lines
  }
});

console.log(`Found ${llmResponses.length} LLM responses`);
console.log(`Found ${parsingErrors.length} parsing errors\n`);

// Analyze parsing errors
if (parsingErrors.length > 0) {
  console.log('=== Parsing Error Analysis ===\n');
  
  parsingErrors.forEach((error, index) => {
    console.log(`Error ${index + 1}:`);
    console.log(`  Job ID: ${error.jobId}`);
    console.log(`  Timestamp: ${error.timestamp}`);
    console.log(`  Provider: ${error.provider}`);
    
    // Check if response is truncated
    const response = error.response || '';
    const isTruncated = response.endsWith('\\') || 
                       response.endsWith('{') || 
                       response.endsWith('[') ||
                       response.length > 10000; // Very long responses might be truncated
    
    console.log(`  Truncated response: ${isTruncated ? 'YES' : 'NO'}`);
    
    // Show last 200 characters of response
    const preview = response.length > 200 ? 
      '...' + response.substring(response.length - 200) : 
      response;
    console.log(`  Response preview: "${preview}"`);
    console.log('');
  });
}

// Check for repetitive patterns
console.log('=== Repetitive Behavior Analysis ===\n');

const toolCalls: {[key: string]: number} = {};
const thoughts: {[key: string]: number} = {};

logLines.forEach(line => {
  try {
    const logEntry = JSON.parse(line);
    
    // Count tool calls
    if (logEntry.msg === 'Executing tool:' && logEntry['toolName']) {
      const toolName = logEntry['toolName'];
      toolCalls[toolName] = (toolCalls[toolName] || 0) + 1;
    }
    
    // Count repeated thoughts
    if (logEntry.msg === 'Agent thought' && logEntry.thought) {
      const thought = logEntry.thought;
      thoughts[thought] = (thoughts[thought] || 0) + 1;
    }
  } catch (e) {
    // Skip non-JSON lines
  }
});

// Show most frequently called tools
console.log('Most frequently called tools:');
Object.entries(toolCalls)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([tool, count]) => {
    console.log(`  ${tool}: ${count} times`);
  });

console.log('');

// Show repeated thoughts
console.log('Repeated thoughts (appearing more than once):');
Object.entries(thoughts)
  .filter(([,count]) => count > 1)
  .sort(([,a], [,b]) => b - a)
  .forEach(([thought, count]) => {
    console.log(`  "${thought}": ${count} times`);
  });

console.log('\n=== Recommendations ===');
console.log('1. LLM responses appear to be truncated, which causes parsing failures');
console.log('2. The agent is stuck in a repetitive loop creating the same todo lists');
console.log('3. Consider:');
console.log('   - Checking network connectivity to the LLM provider');
console.log('   - Verifying the LLM API key is valid');
console.log('   - Reducing the size/complexity of prompts');
console.log('   - Adding timeouts to prevent infinite loops');
console.log('   - Implementing better error handling for truncated responses');