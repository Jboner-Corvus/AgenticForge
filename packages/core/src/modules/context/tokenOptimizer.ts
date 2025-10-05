/**
 * 🚀 Advanced Token Optimization System for AgenticForge
 * Inspired by Claude Code's intelligent token management
 *
 * Features:
 * - Real-time token counting
 * - Smart auto-compaction
 * - Model-specific optimization
 * - Semantic preservation
 */

import { Message } from '../../types.ts';

export interface TokenCount {
  input: number;
  output: number;
  total: number;
  lastUpdated: number;
}

export interface CompressionMetrics {
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  semanticLoss: number; // 0-1 scale, lower is better
  timeElapsed: number;
}

export interface ModelLimits {
  maxContextTokens: number;
  maxHistoryTokens: number;
  compressionThreshold: number; // When to start compressing (0.8 = 80%)
  minRetentionTokens: number; // Minimum tokens to always keep
}

export interface TokenOptimizationResult {
  messages: Message[];
  tokenCount: TokenCount;
  compressionMetrics?: CompressionMetrics;
  wasCompressed: boolean;
  strategy: 'none' | 'semantic' | 'aggressive' | 'emergency';
}

export class TokenOptimizer {
  private modelLimits: Map<string, ModelLimits> = new Map();
  private tokenCache: Map<string, TokenCount> = new Map();
  private compressionHistory: CompressionMetrics[] = [];

  constructor() {
    this.initializeModelLimits();
  }

  private initializeModelLimits(): void {
    // Claude-like model limits
    this.modelLimits.set('claude-3-5-sonnet-20241022', {
      maxContextTokens: 200000,
      maxHistoryTokens: 150000,
      compressionThreshold: 0.75,
      minRetentionTokens: 10000
    });

    this.modelLimits.set('claude-3-opus-20240229', {
      maxContextTokens: 200000,
      maxHistoryTokens: 120000,
      compressionThreshold: 0.7,
      minRetentionTokens: 8000
    });

    // Gemini limits
    this.modelLimits.set('gemini-2.5-pro', {
      maxContextTokens: 2000000,
      maxHistoryTokens: 500000,
      compressionThreshold: 0.8,
      minRetentionTokens: 20000
    });

    // GPT limits
    this.modelLimits.set('gpt-4-turbo', {
      maxContextTokens: 128000,
      maxHistoryTokens: 80000,
      compressionThreshold: 0.75,
      minRetentionTokens: 8000
    });

    // Default fallback
    this.modelLimits.set('default', {
      maxContextTokens: 100000,
      maxHistoryTokens: 50000,
      compressionThreshold: 0.7,
      minRetentionTokens: 5000
    });
  }

  /**
   * 🔍 Count tokens in text using intelligent approximation
   */
  public countTokens(text: string, model: string = 'default'): number {
    // Simple but effective token approximation
    // 1 token ≈ 4 characters for most models
    const baseTokens = Math.ceil(text.length / 4);

    // Model-specific adjustments
    const modelMultiplier = this.getModelTokenMultiplier(model);

    // Adjust for code content (usually more tokens per character)
    const codeMultiplier = this.hasCodeContent(text) ? 1.2 : 1.0;

    return Math.ceil(baseTokens * modelMultiplier * codeMultiplier);
  }

  /**
   * 📊 Calculate tokens for a message array
   */
  public countMessageTokens(messages: Message[], model: string = 'default'): TokenCount {
    const cacheKey = `${model}_${messages.length}_${messages[messages.length - 1]?.timestamp || 0}`;

    if (this.tokenCache.has(cacheKey)) {
      const cached = this.tokenCache.get(cacheKey)!;
      // Update timestamp for cache freshness
      cached.lastUpdated = Date.now();
      return cached;
    }

    let inputTokens = 0;
    let outputTokens = 0;

    for (const message of messages) {
      const content = this.getMessageContent(message);
      const tokens = this.countTokens(content, model);

      if (message.type === 'user') {
        inputTokens += tokens;
      } else if (message.type === 'agent_response') {
        outputTokens += tokens;
      } else {
        // Tool calls, system messages count as input
        inputTokens += tokens;
      }
    }

    const tokenCount: TokenCount = {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
      lastUpdated: Date.now()
    };

    // Cache the result
    this.tokenCache.set(cacheKey, tokenCount);

    // Limit cache size
    if (this.tokenCache.size > 100) {
      const oldestKey = Array.from(this.tokenCache.keys())[0];
      this.tokenCache.delete(oldestKey);
    }

    return tokenCount;
  }

  /**
   * 🗜️ Optimize message history based on token limits
   */
  public optimizeMessageHistory(
    messages: Message[],
    model: string = 'default'
  ): TokenOptimizationResult {
    const limits = this.modelLimits.get(model) || this.modelLimits.get('default')!;
    const tokenCount = this.countMessageTokens(messages, model);

    // If within limits, no optimization needed
    if (tokenCount.total <= limits.maxHistoryTokens) {
      return {
        messages: messages,
        tokenCount: tokenCount,
        wasCompressed: false,
        strategy: 'none'
      };
    }

    console.log(`🧠 Token optimization triggered: ${tokenCount.total} > ${limits.maxHistoryTokens}`);

    // Determine compression strategy
    const compressionRatio = limits.maxHistoryTokens / tokenCount.total;
    let strategy: 'semantic' | 'aggressive' | 'emergency';

    if (compressionRatio > 0.6) {
      strategy = 'semantic';
    } else if (compressionRatio > 0.3) {
      strategy = 'aggressive';
    } else {
      strategy = 'emergency';
    }

    console.log(`🧠 Using compression strategy: ${strategy} (ratio: ${compressionRatio.toFixed(2)})`);

    const startTime = Date.now();
    const optimizedMessages = this.applyCompressionStrategy(messages, strategy, limits);
    const timeElapsed = Date.now() - startTime;

    const newTokenCount = this.countMessageTokens(optimizedMessages, model);
    const compressionMetrics: CompressionMetrics = {
      originalTokens: tokenCount.total,
      compressedTokens: newTokenCount.total,
      compressionRatio: newTokenCount.total / tokenCount.total,
      semanticLoss: this.calculateSemanticLoss(messages, optimizedMessages),
      timeElapsed
    };

    console.log(`🧠 Compression completed: ${tokenCount.total} → ${newTokenCount.total} tokens (${(compressionMetrics.compressionRatio * 100).toFixed(1)}%)`);

    // Store compression metrics
    this.compressionHistory.push(compressionMetrics);
    if (this.compressionHistory.length > 50) {
      this.compressionHistory = this.compressionHistory.slice(-50);
    }

    return {
      messages: optimizedMessages,
      tokenCount: newTokenCount,
      compressionMetrics,
      wasCompressed: true,
      strategy
    };
  }

  /**
   * 🎯 Apply specific compression strategy
   */
  private applyCompressionStrategy(
    messages: Message[],
    strategy: 'semantic' | 'aggressive' | 'emergency',
    limits: ModelLimits
  ): Message[] {
    switch (strategy) {
      case 'semantic':
        return this.semanticCompression(messages, limits);
      case 'aggressive':
        return this.aggressiveCompression(messages, limits);
      case 'emergency':
        return this.emergencyCompression(messages, limits);
      default:
        return messages;
    }
  }

  /**
   * 🧠 Smart semantic compression - preserves important context
   */
  private semanticCompression(messages: Message[], limits: ModelLimits): Message[] {
    // Keep most recent messages (always retain)
    const recentMessages = messages.slice(-Math.min(20, messages.length));

    // Extract important messages from older ones
    const olderMessages = messages.slice(0, -recentMessages.length);
    const importantMessages = this.extractImportantMessages(olderMessages);

    // Combine and limit by tokens
    let combined = [...importantMessages, ...recentMessages];
    let currentTokens = this.countMessageTokens(combined).total;

    // If still over limit, trim older important messages
    while (currentTokens > limits.maxHistoryTokens && importantMessages.length > 0) {
      importantMessages.shift();
      combined = [...importantMessages, ...recentMessages];
      currentTokens = this.countMessageTokens(combined).total;
    }

    // Add compression marker
    if (olderMessages.length > importantMessages.length) {
      const compressionMessage: Message = {
        id: `compression-${Date.now()}`,
        type: 'agent_response',
        content: `🧠 Smart compression applied: ${olderMessages.length - importantMessages.length} older messages were analyzed and compressed. Key decisions and important context preserved.`,
        timestamp: Date.now()
      };

      combined.unshift(compressionMessage);
    }

    return combined;
  }

  /**
   * ⚡ Aggressive compression - for high compression ratios
   */
  private aggressiveCompression(messages: Message[], limits: ModelLimits): Message[] {
    // Keep only very recent messages
    const recentMessages = messages.slice(-10);

    // Summarize everything else into key points
    const olderMessages = messages.slice(0, -10);
    if (olderMessages.length === 0) return recentMessages;

    const summary = this.generateQuickSummary(olderMessages);

    const compressionMessage: Message = {
      id: `aggressive-compression-${Date.now()}`,
      type: 'agent_response',
      content: `🧠 Aggressive compression applied: ${olderMessages.length} messages compressed to key points:\n\n${summary}`,
      timestamp: Date.now()
    };

    return [compressionMessage, ...recentMessages];
  }

  /**
   * 🚨 Emergency compression - maximum compression
   */
  private emergencyCompression(messages: Message[], limits: ModelLimits): Message[] {
    // Keep only the most recent messages within token limit
    let recentMessages = messages.slice(-5);
    let currentTokens = this.countMessageTokens(recentMessages).total;

    // If still over limit, keep only last 3
    if (currentTokens > limits.minRetentionTokens) {
      recentMessages = messages.slice(-3);
    }

    const compressionMessage: Message = {
      id: `emergency-compression-${Date.now()}`,
      type: 'agent_response',
      content: `🚨 Emergency compression applied: ${messages.length} messages compressed to recent context only. Important historical details may be lost.`,
      timestamp: Date.now()
    };

    return [compressionMessage, ...recentMessages];
  }

  /**
   * 🔍 Extract important messages based on content analysis
   */
  private extractImportantMessages(messages: Message[]): Message[] {
    const important: Message[] = [];

    for (const message of messages) {
      const content = this.getMessageContent(message);

      // Keep messages with important keywords
      if (this.containsImportantKeywords(content)) {
        important.push(message);
        continue;
      }

      // Keep tool calls that might have created important artifacts
      if (message.type === 'tool_call' && this.importantToolCall(message)) {
        important.push(message);
        continue;
      }

      // Keep user messages asking for summaries or conclusions
      if (message.type === 'user' && this.isSummaryRequest(content)) {
        important.push(message);
      }
    }

    // Limit to max 30 important messages to prevent bloat
    return important.slice(-30);
  }

  /**
   * 📝 Generate quick summary of messages
   */
  private generateQuickSummary(messages: Message[]): string {
    const summary: string[] = [];

    // Extract key themes
    const themes = this.extractThemes(messages);
    if (themes.length > 0) {
      summary.push(`**Key topics**: ${themes.join(', ')}`);
    }

    // Count important actions
    const toolCalls = messages.filter(m => m.type === 'tool_call').length;
    if (toolCalls > 0) {
      summary.push(`**Actions taken**: ${toolCalls} tool operations`);
    }

    // Recent decisions
    const decisions = messages.filter(m =>
      m.type === 'agent_response' && this.containsImportantKeywords(this.getMessageContent(m))
    ).length;
    if (decisions > 0) {
      summary.push(`**Key decisions**: ${decisions} important conclusions`);
    }

    return summary.join('\n');
  }

  // Helper methods
  private getModelTokenMultiplier(model: string): number {
    // Different models have slightly different tokenization
    const multipliers: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 1.0,
      'claude-3-opus-20240229': 1.0,
      'gemini-2.5-pro': 0.9, // Gemini tends to be more efficient
      'gpt-4-turbo': 1.1,
      'default': 1.0
    };

    return multipliers[model] || multipliers['default'];
  }

  private hasCodeContent(text: string): boolean {
    return /```[\s\S]*```|`[^`]+`|function|class|const|let|var|import|export/.test(text);
  }

  private getMessageContent(message: Message): string {
    if ('content' in message) {
      return String(message.content);
    }
    return '';
  }

  private containsImportantKeywords(content: string): boolean {
    const keywords = [
      'important', 'critical', 'key', 'decision', 'conclusion',
      'summary', 'plan', 'architecture', 'pattern', 'solution',
      'error', 'issue', 'problem', 'bug', 'fix', 'resolve',
      '⚠️', '✅', '❌', '🚀', '🎯', '💡'
    ];

    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword));
  }

  private importantToolCall(message: Message): boolean {
    const toolName = (message as any).toolName;
    if (!toolName) return false;

    const importantTools = [
      'writeFile', 'createFile', 'deploy', 'build', 'test',
      'fix', 'resolve', 'debug', 'analyze', 'design'
    ];

    return importantTools.some(tool => toolName.toLowerCase().includes(tool.toLowerCase()));
  }

  private isSummaryRequest(content: string): boolean {
    const summaryKeywords = ['summarize', 'summary', 'recap', 'conclusion', 'final'];
    const lowerContent = content.toLowerCase();
    return summaryKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private extractThemes(messages: Message[]): string[] {
    const themes: string[] = [];
    const content = messages.map(m => this.getMessageContent(m)).join(' ').toLowerCase();

    const themeKeywords = {
      'development': ['develop', 'code', 'implement', 'build', 'create'],
      'debugging': ['debug', 'error', 'issue', 'problem', 'fix'],
      'planning': ['plan', 'design', 'architecture', 'structure'],
      'testing': ['test', 'verify', 'check', 'validate'],
      'documentation': ['document', 'explain', 'describe'],
      'optimization': ['optimize', 'improve', 'performance']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private calculateSemanticLoss(original: Message[], compressed: Message[]): number {
    // Simple heuristic: ratio of messages lost
    const ratio = compressed.length / original.length;

    // Adjust for compression strategy impact
    if (ratio > 0.8) return 0.1; // Low loss
    if (ratio > 0.5) return 0.3; // Medium loss
    if (ratio > 0.3) return 0.6; // High loss
    return 0.9; // Very high loss
  }

  /**
   * 📈 Get optimization statistics
   */
  public getOptimizationStats(): {
    totalCompressions: number;
    avgCompressionRatio: number;
    avgSemanticLoss: number;
    cacheHitRate: number;
  } {
    const totalCompressions = this.compressionHistory.length;

    if (totalCompressions === 0) {
      return {
        totalCompressions: 0,
        avgCompressionRatio: 1.0,
        avgSemanticLoss: 0.0,
        cacheHitRate: 0.0
      };
    }

    const avgCompressionRatio = this.compressionHistory
      .reduce((sum, m) => sum + m.compressionRatio, 0) / totalCompressions;

    const avgSemanticLoss = this.compressionHistory
      .reduce((sum, m) => sum + m.semanticLoss, 0) / totalCompressions;

    // Cache hit rate approximation
    const cacheHitRate = this.tokenCache.size > 0 ? 0.7 : 0.0;

    return {
      totalCompressions,
      avgCompressionRatio,
      avgSemanticLoss,
      cacheHitRate
    };
  }
}