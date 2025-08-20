// Test script to verify enhanced tools are working
import { enhancedTodoListTool, projectPlanningTool } from './enhancedTools.ts';

console.log('Testing enhanced tools...');

// Test that tools are properly exported
console.log('enhancedTodoListTool:', enhancedTodoListTool?.name || 'Not found');
console.log('projectPlanningTool:', projectPlanningTool?.name || 'Not found');

// Verify tool properties
if (enhancedTodoListTool) {
  console.log('\nEnhanced Todo List Tool:');
  console.log('- Name:', enhancedTodoListTool.name);
  console.log('- Description:', enhancedTodoListTool.description?.substring(0, 100) + '...');
}

if (projectPlanningTool) {
  console.log('\nProject Planning Tool:');
  console.log('- Name:', projectPlanningTool.name);
  console.log('- Description:', projectPlanningTool.description?.substring(0, 100) + '...');
}

console.log('\n✅ Enhanced tools test completed');