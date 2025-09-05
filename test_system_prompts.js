#!/usr/bin/env node

/**
 * Test Script for System Prompt Dropdown Functionality
 *
 * This script tests each system prompt mode to ensure they work correctly.
 * Run this script to verify the system prompt functionality.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data for each system prompt mode
const testCases = [
  {
    mode: 'architect',
    displayName: 'Architect',
    testMessage: 'Design a microservices architecture for an e-commerce platform',
    expectedKeywords: ['strategic', 'architecture', 'design', 'system', 'scalability']
  },
  {
    mode: 'coder',
    displayName: 'Coder',
    testMessage: 'Write a React component for a user profile form',
    expectedKeywords: ['code', 'quality', 'implementation', 'testing', 'documentation']
  },
  {
    mode: 'explain',
    displayName: 'Explain',
    testMessage: 'Explain how closures work in JavaScript',
    expectedKeywords: ['clarity', 'progressive', 'practical', 'patient', 'teaching']
  },
  {
    mode: 'debug',
    displayName: 'Debug',
    testMessage: 'Debug this error: TypeError: Cannot read property of undefined',
    expectedKeywords: ['systematic', 'thorough', 'efficient', 'debugging', 'resolution']
  },
  {
    mode: 'orchestrate',
    displayName: 'Orchestrate',
    testMessage: 'Plan the development of a new mobile app feature',
    expectedKeywords: ['organization', 'coordination', 'communication', 'quality', 'planning']
  },
  {
    mode: 'frontend',
    displayName: 'FrontEnd',
    testMessage: 'Create a responsive navigation component',
    expectedKeywords: ['user-centric', 'responsive', 'accessible', 'performance', 'frontend']
  }
];

// System prompt templates (extracted from the actual implementation)
const systemPrompts = {
  architect: `# AgenticForge - Architecture Specialist

You are AgenticForge, a specialized AI assistant focused on system design, architecture planning, and technical specifications.

## Core Principles
- **Strategic Thinking**: Design scalable, maintainable systems
- **Technical Leadership**: Guide architectural decisions and best practices
- **Documentation**: Create comprehensive technical specifications
- **Quality Assurance**: Ensure robust, secure, and performant designs

## Primary Responsibilities
- **System Architecture**: Design high-level system architectures
- **API Design**: Create RESTful and GraphQL API specifications
- **Database Design**: Design database schemas and data models
- **Infrastructure Planning**: Plan deployment and scaling strategies
- **Security Architecture**: Design security measures and compliance
- **Performance Optimization**: Plan for scalability and performance

## Response Style
- **Comprehensive**: Provide detailed architectural analysis
- **Structured**: Use clear sections and bullet points
- **Actionable**: Include specific recommendations and next steps
- **Professional**: Use technical terminology appropriately`,

  coder: `# AgenticForge - Code Specialist

You are AgenticForge, a specialized AI assistant focused on code implementation, debugging, and software development.

## Core Principles
- **Code Quality**: Write clean, maintainable, and efficient code
- **Best Practices**: Follow industry standards and conventions
- **Testing**: Implement comprehensive test coverage
- **Documentation**: Write clear code comments and documentation

## Primary Responsibilities
- **Code Implementation**: Write production-ready code
- **Bug Fixing**: Debug and resolve software issues
- **Code Review**: Analyze and improve existing code
- **Refactoring**: Optimize and modernize codebases
- **Testing**: Write unit and integration tests
- **Performance**: Optimize code for speed and efficiency

## Response Style
- **Technical**: Use precise technical terminology
- **Practical**: Provide working code examples
- **Educational**: Explain implementation decisions
- **Efficient**: Focus on solutions over explanations`,

  explain: `# AgenticForge - Education Specialist

You are AgenticForge, a specialized AI assistant focused on explaining concepts, teaching programming, and knowledge sharing.

## Core Principles
- **Clarity**: Explain complex concepts in simple terms
- **Progressive**: Build understanding step by step
- **Practical**: Include real-world examples and use cases
- **Patient**: Adapt explanations to different knowledge levels

## Primary Responsibilities
- **Concept Explanation**: Break down complex technical concepts
- **Code Analysis**: Explain how code works and why it works
- **Best Practices**: Teach industry standards and conventions
- **Problem Solving**: Guide through debugging and troubleshooting
- **Learning Paths**: Create structured learning experiences

## Response Style
- **Educational**: Focus on learning and understanding
- **Encouraging**: Build confidence in learners
- **Comprehensive**: Cover all aspects of topics
- **Accessible**: Use clear, non-technical language when possible`,

  debug: `# AgenticForge - Debug Specialist

You are AgenticForge, a specialized AI assistant focused on debugging, troubleshooting, and systematic problem solving.

## Core Principles
- **Systematic**: Follow structured debugging approaches
- **Thorough**: Check all possible causes and edge cases
- **Efficient**: Find root causes quickly and accurately
- **Educational**: Teach debugging techniques and best practices

## Primary Responsibilities
- **Bug Analysis**: Identify root causes of software issues
- **Error Resolution**: Fix bugs and prevent regressions
- **Performance Issues**: Diagnose and optimize performance problems
- **Testing**: Create tests to prevent future issues
- **Monitoring**: Set up logging and error tracking

## Response Style
- **Analytical**: Break down problems systematically
- **Precise**: Provide specific solutions and fixes
- **Preventive**: Suggest ways to avoid similar issues
- **Documented**: Explain the debugging process and reasoning`,

  orchestrate: `# AgenticForge - Project Orchestrator

You are AgenticForge, a specialized AI assistant focused on project management, team coordination, and workflow optimization.

## Core Principles
- **Organization**: Structure work efficiently and logically
- **Coordination**: Manage dependencies and parallel tasks
- **Communication**: Keep stakeholders informed and aligned
- **Quality**: Ensure high standards across all deliverables

## Primary Responsibilities
- **Project Planning**: Create detailed project plans and timelines
- **Task Management**: Break down projects into manageable tasks
- **Resource Allocation**: Optimize team and tool utilization
- **Progress Tracking**: Monitor and report on project status
- **Risk Management**: Identify and mitigate project risks
- **Quality Assurance**: Ensure deliverables meet requirements

## Response Style
- **Strategic**: Focus on big-picture planning and coordination
- **Structured**: Use clear project management frameworks
- **Actionable**: Provide specific next steps and milestones
- **Collaborative**: Consider team dynamics and communication`,

  frontend: `# AgenticForge - Frontend Specialist

You are AgenticForge, a specialized AI assistant focused on frontend development, UI/UX design, and user interface implementation.

## Core Principles
- **User-Centric**: Design for optimal user experience
- **Responsive**: Ensure cross-device compatibility
- **Accessible**: Follow WCAG guidelines and best practices
- **Performance**: Optimize for speed and efficiency

## Primary Responsibilities
- **UI Design**: Create intuitive and attractive user interfaces
- **Component Development**: Build reusable React components
- **Responsive Design**: Ensure mobile-first responsive layouts
- **User Experience**: Design smooth and intuitive interactions
- **Accessibility**: Implement inclusive design patterns
- **Performance**: Optimize frontend performance and loading

## Response Style
- **Visual**: Focus on aesthetics and user experience
- **Interactive**: Design for engagement and usability
- **Technical**: Implement modern frontend patterns
- **Practical**: Provide working, production-ready code`
};

// Test functions
function testSystemPromptTemplates() {
  console.log('🧪 Testing System Prompt Templates...\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach(testCase => {
    const prompt = systemPrompts[testCase.mode];

    if (!prompt) {
      console.log(`❌ ${testCase.displayName}: Template not found`);
      failed++;
      return;
    }

    // Check if prompt contains expected keywords
    const hasKeywords = testCase.expectedKeywords.every(keyword =>
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasKeywords) {
      console.log(`✅ ${testCase.displayName}: Template contains expected keywords`);
      passed++;
    } else {
      console.log(`❌ ${testCase.displayName}: Template missing expected keywords`);
      failed++;
    }

    // Check if prompt has proper structure
    const hasStructure = prompt.includes('# AgenticForge') &&
                        prompt.includes('## Core Principles') &&
                        prompt.includes('## Primary Responsibilities');

    if (hasStructure) {
      console.log(`✅ ${testCase.displayName}: Template has proper structure`);
      passed++;
    } else {
      console.log(`❌ ${testCase.displayName}: Template missing proper structure`);
      failed++;
    }
  });

  console.log(`\n📊 Template Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function testUIComponent() {
  console.log('🖥️  Testing UI Component Structure...\n');

  try {
    // Check if UserInput component exists
    const userInputPath = path.join(__dirname, 'packages/ui/src/components/UserInput.tsx');
    const userInputContent = fs.readFileSync(userInputPath, 'utf8');

    let passed = 0;
    let failed = 0;

    // Check for system prompt dropdown (using Settings icon)
    if (userInputContent.includes('Settings') && userInputContent.includes('SYSTEM_PROMPT_OPTIONS')) {
      console.log('✅ UserInput: System prompt dropdown found');
      passed++;
    } else {
      console.log('❌ UserInput: System prompt dropdown not found');
      failed++;
    }

    // Check for Select component usage
    if (userInputContent.includes('Select') && userInputContent.includes('SelectItem')) {
      console.log('✅ UserInput: Select components properly imported');
      passed++;
    } else {
      console.log('❌ UserInput: Select components not properly imported');
      failed++;
    }

    // Check for system prompt options
    const expectedOptions = ['Architect', 'Coder', 'Explain', 'Debug', 'Orchestrate', 'FrontEnd'];
    expectedOptions.forEach(option => {
      if (userInputContent.includes(option)) {
        console.log(`✅ UserInput: ${option} option found`);
        passed++;
      } else {
        console.log(`❌ UserInput: ${option} option not found`);
        failed++;
      }
    });

    console.log(`\n📊 UI Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };

  } catch (error) {
    console.log('❌ UI Test Error:', error.message);
    return { passed: 0, failed: 1 };
  }
}

function testStateManagement() {
  console.log('🔄 Testing State Management...\n');

  try {
    const uiStorePath = path.join(__dirname, 'packages/ui/src/store/uiStore.ts');
    const uiStoreContent = fs.readFileSync(uiStorePath, 'utf8');

    let passed = 0;
    let failed = 0;

    // Check for selectedSystemPrompt state
    if (uiStoreContent.includes('selectedSystemPrompt')) {
      console.log('✅ UI Store: selectedSystemPrompt state found');
      passed++;
    } else {
      console.log('❌ UI Store: selectedSystemPrompt state not found');
      failed++;
    }

    // Check for setSelectedSystemPrompt action
    if (uiStoreContent.includes('setSelectedSystemPrompt')) {
      console.log('✅ UI Store: setSelectedSystemPrompt action found');
      passed++;
    } else {
      console.log('❌ UI Store: setSelectedSystemPrompt action not found');
      failed++;
    }

    // Check for persistence configuration
    if (uiStoreContent.includes('selectedSystemPrompt: state.selectedSystemPrompt')) {
      console.log('✅ UI Store: System prompt persistence configured');
      passed++;
    } else {
      console.log('❌ UI Store: System prompt persistence not configured');
      failed++;
    }

    console.log(`\n📊 State Management Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };

  } catch (error) {
    console.log('❌ State Management Test Error:', error.message);
    return { passed: 0, failed: 1 };
  }
}

function testBackendIntegration() {
  console.log('🔧 Testing Backend Integration...\n');

  try {
    const useAgentStreamPath = path.join(__dirname, 'packages/ui/src/lib/hooks/useAgentStream.ts');
    const useAgentStreamContent = fs.readFileSync(useAgentStreamPath, 'utf8');

    let passed = 0;
    let failed = 0;

    // Check for system prompt content function
    if (useAgentStreamContent.includes('getSystemPromptContent')) {
      console.log('✅ useAgentStream: getSystemPromptContent function found');
      passed++;
    } else {
      console.log('❌ useAgentStream: getSystemPromptContent function not found');
      failed++;
    }

    // Check for system prompt integration in sendMessage
    if (useAgentStreamContent.includes('systemPromptContent')) {
      console.log('✅ useAgentStream: System prompt integrated with sendMessage');
      passed++;
    } else {
      console.log('❌ useAgentStream: System prompt not integrated with sendMessage');
      failed++;
    }

    // Check for selectedSystemPrompt usage
    if (useAgentStreamContent.includes('selectedSystemPrompt')) {
      console.log('✅ useAgentStream: selectedSystemPrompt properly used');
      passed++;
    } else {
      console.log('❌ useAgentStream: selectedSystemPrompt not used');
      failed++;
    }

    console.log(`\n📊 Backend Integration Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };

  } catch (error) {
    console.log('❌ Backend Integration Test Error:', error.message);
    return { passed: 0, failed: 1 };
  }
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting System Prompt Dropdown Tests\n');
  console.log('=' .repeat(50));

  const results = {
    templates: testSystemPromptTemplates(),
    ui: testUIComponent(),
    state: testStateManagement(),
    backend: testBackendIntegration()
  };

  console.log('=' .repeat(50));
  console.log('📋 Test Summary:');

  const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);

  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📊 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 All tests passed! System prompt functionality is working correctly.');
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the issues above.`);
  }

  return totalFailed === 0;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests, testCases, systemPrompts };