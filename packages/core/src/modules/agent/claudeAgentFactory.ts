import { Agent } from './agent.js';
import { ClaudeEnhancedAgent } from './ClaudeEnhancedAgent.js';
import type { SessionData, Job } from '../../types.ts';
import { Logger } from '../../logger.ts';
import { getConfig } from '../../config.ts';

export class ClaudeAgentFactory {
  private static isClaudeEnhanced(): boolean {
    return process.env.CLAUDE_ENHANCED_MODE === 'true';
  }

  private static shouldUseEnhancedAgent(prompt: string): boolean {
    if (!this.isClaudeEnhanced()) {
      return false;
    }

    // Use enhanced agent for complex tasks
    const complexIndicators = [
      'analyze', 'architecture', 'design', 'optimize',
      'review', 'audit', 'implement', 'develop',
      'create', 'build', 'system', 'complex',
      'security', 'performance', 'scalable'
    ];

    const lowerPrompt = prompt.toLowerCase();
    return complexIndicators.some(indicator => lowerPrompt.includes(indicator));
  }

  private static getReasoningDepth(prompt: string): number {
    const depth = parseInt(process.env.CLAUDE_REASONING_DEPTH || '5') || 5;

    // Adjust depth based on prompt complexity
    if (prompt.includes('comprehensive') || prompt.includes('detailed')) {
      return Math.min(depth + 2, 10);
    }

    if (prompt.includes('quick') || prompt.includes('simple')) {
      return Math.max(depth - 2, 1);
    }

    return depth;
  }

  static createAgent(
    job: Job<any>,
    session: SessionData,
    tools: any[],
    taskQueue: any,
    log: Logger,
    activeLlmProvider: string,
    sessionManager: any,
    apiKey?: string,
    llmModelName?: string,
    llmApiKey?: string
  ): Agent {
    const prompt = job.data.prompt as string;

    // Determine if we should use the enhanced agent
    if (this.shouldUseEnhancedAgent(prompt)) {
      log.info('🧠 Creating Claude Enhanced Agent for complex task');

      const enhancedAgent = new ClaudeEnhancedAgent(
        job, 
        session, 
        tools, 
        taskQueue, 
        activeLlmProvider,
        sessionManager,
        apiKey,
        llmModelName,
        llmApiKey
      );

      // Configure reasoning depth based on task complexity
      const reasoningDepth = this.getReasoningDepth(prompt);
      if ('setReasoningDepth' in enhancedAgent) {
        (enhancedAgent as any).setReasoningDepth(reasoningDepth);
      }

      return enhancedAgent;
    }

    // Use standard agent for simple tasks
    log.info('🤖 Creating standard Agent for simple task');
    return new Agent(
      job, 
      session, 
      taskQueue, 
      tools, 
      activeLlmProvider, 
      sessionManager, 
      apiKey, 
      llmModelName, 
      llmApiKey
    );
  }

  static async executeWithClaudeEnhancement(
    agent: Agent,
    prompt: string
  ): Promise<string> {
    // Check if this is an enhanced agent
    if (agent instanceof ClaudeEnhancedAgent) {
      return agent.executeWithEnhancement();
    }

    // Standard execution for regular agents
    return agent.run();
  }

  static getPerformanceMetrics(): any {
    return {
      enhancedMode: this.isClaudeEnhanced(),
      reasoningDepth: parseInt(process.env.CLAUDE_REASONING_DEPTH || '5') || 5,
      adaptiveLearning: process.env.CLAUDE_ADAPTIVE_LEARNING === 'true',
      predictivePlanning: process.env.CLAUDE_PREDICTIVE_PLANNING === 'true',
      qualityAssurance: process.env.CLAUDE_QUALITY_ASSURANCE === 'true',
      optimizationLevel: process.env.CLAUDE_OPTIMIZATION_LEVEL || 'medium'
    };
  }

  static updateClaudeConfiguration(config: any): void {
    // Dynamic configuration updates for Claude enhancements
    Object.entries(config).forEach(([key, value]) => {
      process.env[`CLAUDE_${key.toUpperCase()}`] = String(value);
    });
  }
}

export default ClaudeAgentFactory;
