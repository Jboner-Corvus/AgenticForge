/**
 * Enhanced Working Context System for AgenticForge Agent
 * Inspired by Claude Code's context management approach
 *
 * 🚀 Features:
 * - Real-time token optimization
 * - Smart auto-compaction
 * - Semantic memory preservation
 * - Model-specific optimization
 */

import { TokenOptimizer, TokenOptimizationResult } from '../context/tokenOptimizer.js';
import { Message } from '../../types.ts';

export interface TaskItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[];
  createdAt: number;
  updatedAt: number;
  activeForm?: string; // What the agent is currently doing for this task
}

export interface WorkingMemory {
  keyTopics: string[];
  importantDecisions: Array<{
    decision: string;
    reasoning: string;
    timestamp: number;
    context?: string;
  }>;
  codePatterns: Array<{
    pattern: string;
    file: string;
    context: string;
    timestamp: number;
  }>;
  userPreferences: Record<string, any>;
  recentInsights: string[];
}

export interface IntentContext {
  userGoal?: string;
  currentPhase?: 'understanding' | 'planning' | 'implementing' | 'testing' | 'finalizing' | 'debugging';
  expectedOutcome?: string;
  constraints?: string[];
  progressPercentage?: number;
  nextMilestone?: string;
}

export interface ToolUsageHistory {
  toolName: string;
  count: number;
  lastUsed: number;
  successRate: number;
  averageExecutionTime?: number;
  lastResult?: 'success' | 'error' | 'partial';
}

export interface FileContext {
  currentFile?: string;
  recentFiles: Array<{
    path: string;
    lastAccessed: number;
    purpose: string;
    modifications: number;
  }>;
  projectStructure?: Record<string, any>;
  workingDirectory?: string;
}

export interface EnhancedWorkingContext {
  // Task Management (like Claude Code's todo system)
  todos: TaskItem[];
  currentFocus?: string; // ID of the task currently being worked on
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };

  // Intent & Goal Awareness
  intent: IntentContext;

  // Working Memory (semantic memory)
  memory: WorkingMemory;

  // File & Project Context
  files: FileContext;

  // Tool Usage Tracking
  toolUsage: Map<string, ToolUsageHistory>;

  // Agent State
  currentState: {
    isProcessing: boolean;
    lastAction?: string;
    lastActionResult?: 'success' | 'error' | 'partial';
    currentStrategy?: string;
    iterationCount: number;
    confidenceLevel: number; // 0-100
  };

  // Learning & Adaptation
  learningPatterns: {
    successfulApproaches: Array<{
      pattern: string;
      context: string;
      successCount: number;
    }>;
    avoidPatterns: Array<{
      pattern: string;
      reason: string;
      occurrenceCount: number;
    }>;
  };

  // Temporal Context
  temporal: {
    sessionStartTime: number;
    lastUserInteraction: number;
    timeOnCurrentTask: number;
    estimatedTimeRemaining?: number;
  };

  // 🚀 Token Optimization
  tokenOptimization: {
    tokenOptimizer: TokenOptimizer;
    lastOptimization: number;
    optimizationHistory: TokenOptimizationResult[];
    currentModel: string;
  };
}

export class EnhancedWorkingContextManager {
  private context: EnhancedWorkingContext;

  constructor(initialSessionId: string) {
    this.context = this.initializeContext(initialSessionId);
  }

  private initializeContext(sessionId: string): EnhancedWorkingContext {
    const tokenOptimizer = new TokenOptimizer();

    return {
      todos: [],
      taskStats: { total: 0, completed: 0, inProgress: 0, blocked: 0 },
      intent: { currentPhase: 'understanding' },
      memory: {
        keyTopics: [],
        importantDecisions: [],
        codePatterns: [],
        userPreferences: {},
        recentInsights: []
      },
      files: { recentFiles: [] },
      toolUsage: new Map(),
      currentState: {
        isProcessing: false,
        iterationCount: 0,
        confidenceLevel: 50
      },
      learningPatterns: {
        successfulApproaches: [],
        avoidPatterns: []
      },
      temporal: {
        sessionStartTime: Date.now(),
        lastUserInteraction: Date.now(),
        timeOnCurrentTask: 0
      },
      tokenOptimization: {
        tokenOptimizer,
        lastOptimization: Date.now(),
        optimizationHistory: [],
        currentModel: 'default'
      }
    };
  }

  // Todo Management (like Claude Code)
  addTodo(content: string, priority: 'low' | 'medium' | 'high' = 'medium'): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const todo: TaskItem = {
      id,
      content,
      status: 'pending',
      priority,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.context.todos.push(todo);
    this.updateTaskStats();
    return id;
  }

  updateTodoStatus(id: string, status: TaskItem['status'], activeForm?: string): boolean {
    const todo = this.context.todos.find(t => t.id === id);
    if (!todo) return false;

    todo.status = status;
    todo.updatedAt = Date.now();
    if (activeForm) todo.activeForm = activeForm;

    // If starting a task, set current focus
    if (status === 'in_progress') {
      this.context.currentFocus = id;
      this.context.temporal.timeOnCurrentTask = Date.now();
    }

    // If completing a task, record learning
    if (status === 'completed') {
      this.recordSuccessfulPattern(todo.content);
      this.context.currentFocus = undefined;
    }

    this.updateTaskStats();
    return true;
  }

  getCurrentTask(): TaskItem | undefined {
    if (!this.context.currentFocus) return undefined;
    return this.context.todos.find(t => t.id === this.context.currentFocus);
  }

  getNextTask(): TaskItem | undefined {
    // Get highest priority pending task
    const pendingTasks = this.context.todos
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return pendingTasks[0];
  }

  // Intent Management
  updateIntent(intent: Partial<IntentContext>): void {
    this.context.intent = { ...this.context.intent, ...intent };
    this.context.temporal.lastUserInteraction = Date.now();
  }

  // Memory Management
  addImportantDecision(decision: string, reasoning: string, context?: string): void {
    this.context.memory.importantDecisions.push({
      decision,
      reasoning,
      context,
      timestamp: Date.now()
    });

    // Keep only last 20 decisions
    if (this.context.memory.importantDecisions.length > 20) {
      this.context.memory.importantDecisions = this.context.memory.importantDecisions.slice(-20);
    }
  }

  addCodePattern(pattern: string, file: string, context: string): void {
    this.context.memory.codePatterns.push({
      pattern,
      file,
      context,
      timestamp: Date.now()
    });

    // Keep only last 50 patterns
    if (this.context.memory.codePatterns.length > 50) {
      this.context.memory.codePatterns = this.context.memory.codePatterns.slice(-50);
    }
  }

  addKeyTopic(topic: string): void {
    if (!this.context.memory.keyTopics.includes(topic)) {
      this.context.memory.keyTopics.push(topic);
    }
  }

  // Tool Usage Tracking
  recordToolUsage(toolName: string, success: boolean, executionTime?: number): void {
    const existing = this.context.toolUsage.get(toolName);
    if (existing) {
      existing.count++;
      existing.lastUsed = Date.now();
      existing.successRate = (existing.successRate * (existing.count - 1) + (success ? 1 : 0)) / existing.count;
      if (executionTime) {
        existing.averageExecutionTime = existing.averageExecutionTime
          ? (existing.averageExecutionTime + executionTime) / 2
          : executionTime;
      }
      existing.lastResult = success ? 'success' : 'error';
    } else {
      this.context.toolUsage.set(toolName, {
        toolName,
        count: 1,
        lastUsed: Date.now(),
        successRate: success ? 1 : 0,
        averageExecutionTime: executionTime,
        lastResult: success ? 'success' : 'error'
      });
    }
  }

  // Learning Patterns
  public recordSuccessfulPattern(pattern: string): void {
    const existing = this.context.learningPatterns.successfulApproaches.find(p => p.pattern === pattern);
    if (existing) {
      existing.successCount++;
    } else {
      this.context.learningPatterns.successfulApproaches.push({
        pattern,
        context: this.context.intent.currentPhase || 'unknown',
        successCount: 1
      });
    }
  }

  recordAvoidPattern(pattern: string, reason: string): void {
    const existing = this.context.learningPatterns.avoidPatterns.find(p => p.pattern === pattern);
    if (existing) {
      existing.occurrenceCount++;
    } else {
      this.context.learningPatterns.avoidPatterns.push({
        pattern,
        reason,
        occurrenceCount: 1
      });
    }
  }

  // State Management
  updateAgentState(state: Partial<EnhancedWorkingContext['currentState']>): void {
    this.context.currentState = { ...this.context.currentState, ...state };
    if (state.iterationCount) {
      this.context.currentState.iterationCount = state.iterationCount;
    }
  }

  // File Context
  setCurrentFile(file: string, purpose: string): void {
    this.context.files.currentFile = file;

    const existing = this.context.files.recentFiles.find(f => f.path === file);
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.purpose = purpose;
      existing.modifications++;
    } else {
      this.context.files.recentFiles.push({
        path: file,
        lastAccessed: Date.now(),
        purpose,
        modifications: 1
      });
    }

    // Keep only last 20 files
    if (this.context.files.recentFiles.length > 20) {
      this.context.files.recentFiles = this.context.files.recentFiles
        .sort((a, b) => b.lastAccessed - a.lastAccessed)
        .slice(0, 20);
    }
  }

  // Context Summary for LLM
  getContextSummary(): string {
    const currentTask = this.getCurrentTask();
    const nextTask = this.getNextTask();

    return `
📋 TASK MANAGEMENT:
• Current Task: ${currentTask ? `${currentTask.content} (${currentTask.status})` : 'None'}
• Next Task: ${nextTask ? nextTask.content : 'None'}
• Progress: ${this.context.taskStats.completed}/${this.context.taskStats.total} tasks completed

🎯 INTENT & GOAL:
• User Goal: ${this.context.intent.userGoal || 'Not specified'}
• Current Phase: ${this.context.intent.currentPhase}
• Progress: ${this.context.intent.progressPercentage || 0}%

💭 WORKING MEMORY:
• Key Topics: ${this.context.memory.keyTopics.join(', ')}
• Recent Insights: ${this.context.memory.recentInsights.slice(-3).join('; ')}
• Important Decisions: ${this.context.memory.importantDecisions.length} recorded

📁 FILE CONTEXT:
• Current File: ${this.context.files.currentFile || 'None'}
• Recent Files: ${this.context.files.recentFiles.slice(0, 5).map(f => `${f.path} (${f.purpose})`).join(', ')}

🔧 TOOL USAGE:
• Recently Used: ${Array.from(this.context.toolUsage.values())
  .sort((a, b) => b.lastUsed - a.lastUsed)
  .slice(0, 5)
  .map(t => `${t.toolName} (${t.successRate.toFixed(1)}% success)`).join(', ')}

🎯 CURRENT STATE:
• Iteration: ${this.context.currentState.iterationCount}
• Confidence: ${this.context.currentState.confidenceLevel}%
• Current Strategy: ${this.context.currentState.currentStrategy || 'Adapting'}
    `.trim();
  }

  // Private helpers
  private updateTaskStats(): void {
    this.context.taskStats = {
      total: this.context.todos.length,
      completed: this.context.todos.filter(t => t.status === 'completed').length,
      inProgress: this.context.todos.filter(t => t.status === 'in_progress').length,
      blocked: this.context.todos.filter(t => t.status === 'blocked').length
    };
  }

  // Getters
  getContext(): EnhancedWorkingContext {
    return { ...this.context };
  }

  getTaskStats() {
    return this.context.taskStats;
  }

  getToolUsageHistory() {
    return Array.from(this.context.toolUsage.values());
  }

  // 🚀 TOKEN OPTIMIZATION METHODS

  /**
   * 🧠 Optimize message history with smart token management
   */
  public optimizeMessageHistory(messages: Message[], model: string = 'default'): TokenOptimizationResult {
    console.log(`🧠 Optimizing ${messages.length} messages for model: ${model}`);

    // Update current model
    this.context.tokenOptimization.currentModel = model;

    // Perform optimization
    const result = this.context.tokenOptimization.tokenOptimizer.optimizeMessageHistory(messages, model);

    // Store optimization result
    if (result.wasCompressed) {
      this.context.tokenOptimization.optimizationHistory.push(result);
      this.context.tokenOptimization.lastOptimization = Date.now();

      // Keep only last 20 optimizations in memory
      if (this.context.tokenOptimization.optimizationHistory.length > 20) {
        this.context.tokenOptimization.optimizationHistory =
          this.context.tokenOptimization.optimizationHistory.slice(-20);
      }

      console.log(`🧠 Optimization completed: ${result.strategy} strategy applied`);
    }

    return result;
  }

  /**
   * 📊 Get current token count for a message array
   */
  public getTokenCount(messages: Message[], model: string = 'default') {
    return this.context.tokenOptimization.tokenOptimizer.countMessageTokens(messages, model);
  }

  /**
   * 🎯 Set current model for optimization
   */
  public setCurrentModel(model: string): void {
    this.context.tokenOptimization.currentModel = model;
    console.log(`🧠 Token optimization model set to: ${model}`);
  }

  /**
   * 📈 Get optimization statistics
   */
  public getOptimizationStats() {
    const stats = this.context.tokenOptimization.tokenOptimizer.getOptimizationStats();
    const lastOptimization = this.context.tokenOptimization.lastOptimization;
    const currentModel = this.context.tokenOptimization.currentModel;

    return {
      ...stats,
      lastOptimization,
      currentModel,
      optimizationHistoryLength: this.context.tokenOptimization.optimizationHistory.length
    };
  }

  /**
   * 🔄 Force optimization check
   */
  public checkOptimizationNeeded(messages: Message[], model?: string): {
    needed: boolean;
    reason?: string;
    currentTokens: number;
    limit: number;
  } {
    const targetModel = model || this.context.tokenOptimization.currentModel;
    const tokenCount = this.getTokenCount(messages, targetModel);

    // Get model limits from optimizer
    const limits = this.context.tokenOptimization.tokenOptimizer['modelLimits']?.get(targetModel) ||
                   this.context.tokenOptimization.tokenOptimizer['modelLimits']?.get('default');

    if (!limits) {
      return {
        needed: false,
        currentTokens: tokenCount.total,
        limit: 100000
      };
    }

    const threshold = limits.maxHistoryTokens * limits.compressionThreshold;
    const needed = tokenCount.total > threshold;

    return {
      needed,
      reason: needed ? `Token count (${tokenCount.total}) exceeds threshold (${threshold})` : undefined,
      currentTokens: tokenCount.total,
      limit: limits.maxHistoryTokens
    };
  }

  /**
   * 🧠 Enhanced context summary with token info
   */
  public getContextSummaryWithTokens(): string {
    const basicSummary = this.getContextSummary();
    const stats = this.getOptimizationStats();

    const tokenInfo = `
🧠 TOKEN OPTIMIZATION:
• Current Model: ${stats.currentModel}
• Total Compressions: ${stats.totalCompressions}
• Avg Compression Ratio: ${(stats.avgCompressionRatio * 100).toFixed(1)}%
• Avg Semantic Loss: ${(stats.avgSemanticLoss * 100).toFixed(1)}%
• Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%
• Last Optimization: ${stats.lastOptimization ? new Date(stats.lastOptimization).toLocaleTimeString() : 'Never'}`;

    return basicSummary + tokenInfo;
  }
}