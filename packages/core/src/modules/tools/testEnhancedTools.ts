// Test script to verify enhanced tools are working
import { projectPlanningTool, delegateTaskTool } from './enhancedTools.ts';

console.log('Testing enhanced tools...');

// Test that tools are properly exported
console.log('delegateTaskTool:', delegateTaskTool?.name || 'Not found');
console.log('projectPlanningTool:', projectPlanningTool?.name || 'Not found');

// Verify tool properties
if (delegateTaskTool) {
  console.log('\nDelegate Task Tool:');
  console.log('- Name:', delegateTaskTool.name);
  console.log(
    '- Description:',
    delegateTaskTool.description?.substring(0, 100) + '...',
  );
}

if (projectPlanningTool) {
  console.log('\nProject Planning Tool:');
  console.log('- Name:', projectPlanningTool.name);
  console.log(
    '- Description:',
    projectPlanningTool.description?.substring(0, 100) + '...',
  );
}

console.log('\n✅ Enhanced tools test completed');
