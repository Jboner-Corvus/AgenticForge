/**
 * Utility functions for estimating token usage in conversations
 */

/**
 * Estimates the number of tokens in a text string
 * This is a rough approximation based on common tokenization patterns
 * GPT models typically use ~4 characters per token for English text
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Clean the text
  const cleanText = text.trim();

  // Basic estimation: ~4 characters per token for English text
  // This is a rough approximation and may vary by model
  const baseTokens = Math.ceil(cleanText.length / 4);

  // Add tokens for punctuation and special characters
  const punctuationCount = (cleanText.match(/[.,!?;:()[\]{}"'\-—–]/g) || []).length;
  const whitespaceCount = (cleanText.match(/\s+/g) || []).length;

  // Add small overhead for punctuation and formatting
  const punctuationTokens = Math.ceil(punctuationCount * 0.5);
  const whitespaceTokens = Math.ceil(whitespaceCount * 0.2);

  const totalTokens = baseTokens + punctuationTokens + whitespaceTokens;

  return Math.max(1, totalTokens); // Minimum 1 token
}

/**
 * Estimates tokens for a conversation message
 * Takes into account message metadata and content
 *
 * @param message - The message object
 * @returns Estimated number of tokens for this message
 */
export function estimateMessageTokens(message: any): number {
  let totalTokens = 0;

  // Estimate tokens for the main content
  if (message.content) {
    if (typeof message.content === 'string') {
      totalTokens += estimateTokens(message.content);
    } else if (Array.isArray(message.content)) {
      // Handle array content (like tool calls)
      message.content.forEach((item: any) => {
        if (item.text) {
          totalTokens += estimateTokens(item.text);
        } else if (item.type === 'tool_use' && item.input) {
          // Estimate tokens for tool inputs
          totalTokens += estimateTokens(JSON.stringify(item.input));
        }
      });
    }
  }

  // Add tokens for message metadata (role, etc.)
  if (message.role) {
    totalTokens += 2; // Small overhead for role
  }

  // Add tokens for tool calls if present
  if (message.tool_calls) {
    message.tool_calls.forEach((toolCall: any) => {
      totalTokens += estimateTokens(JSON.stringify(toolCall));
    });
  }

  return totalTokens;
}

/**
 * Estimates total tokens for a conversation
 *
 * @param messages - Array of conversation messages
 * @returns Total estimated tokens for the conversation
 */
export function estimateConversationTokens(messages: any[]): number {
  return messages.reduce((total, message) => {
    return total + estimateMessageTokens(message);
  }, 0);
}

/**
 * Formats a token count for display
 *
 * @param count - The token count to format
 * @returns Formatted string
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}