/**
 * Utility functions for key management and masking
 */

/**
 * Masks an API key by showing only the first few and last few characters
 * @param key - The API key to mask
 * @param visibleStart - Number of characters to show at the start (default: 3)
 * @param visibleEnd - Number of characters to show at the end (default: 4)
 * @returns The masked key string
 */
export function maskApiKey(key: string, visibleStart: number = 3, visibleEnd: number = 4): string {
  if (!key || key.length <= visibleStart + visibleEnd) {
    return key ? `${key.charAt(0)}...${key.charAt(key.length - 1)}` : "";
  }
  const start = key.substring(0, visibleStart);
  const end = key.substring(key.length - visibleEnd);
  return `${start}...${end}`;
}

/**
 * Enhanced key masking for different key types
 * @param key - The API key to mask
 * @param keyType - The type of key (affects masking pattern)
 * @returns The masked key string
 */
export function maskKeyByType(key: string, keyType: string = 'default'): string {
  if (!key) return '';
  
  switch (keyType) {
    case 'openai':
      // OpenAI keys: sk-proj-... or sk-...
      if (key.startsWith('sk-proj-')) {
        return maskApiKey(key, 8, 4);
      }
      return maskApiKey(key, 8, 4);
      
    case 'anthropic':
      // Anthropic keys are longer
      return maskApiKey(key, 6, 6);
      
    case 'google':
    case 'gemini':
      // Google API keys
      return maskApiKey(key, 6, 4);
      
    case 'xai':
      // xAI keys
      return maskApiKey(key, 4, 4);
      
    case 'openrouter':
      // OpenRouter keys
      return maskApiKey(key, 6, 4);
      
    default:
      return maskApiKey(key, 4, 4);
  }
}

/**
 * Validates if a string looks like a valid API key
 * @param key - The key to validate
 * @param provider - The provider type
 * @returns True if the key format looks valid
 */
export function validateKeyFormat(key: string, provider: string): boolean {
  if (!key) return false;
  
  switch (provider) {
    case 'openai':
      return key.startsWith('sk-') && key.length >= 40;
      
    case 'anthropic':
      return key.startsWith('sk-ant-') && key.length >= 40;
      
    case 'google':
    case 'gemini':
      return key.length >= 30 && /^[A-Za-z0-9_-]+$/.test(key);
      
    case 'xai':
      return key.startsWith('xai-') && key.length >= 30;
      
    case 'openrouter':
      return key.startsWith('sk-or-') && key.length >= 40;
      
    default:
      return key.length >= 20;
  }
}

/**
 * Extracts the key type from the key format
 * @param key - The API key
 * @returns The detected key type
 */
export function detectKeyType(key: string): string {
  if (!key) return 'unknown';
  
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-proj-')) return 'openai';
  if (key.startsWith('sk-')) return 'openai';
  if (key.startsWith('xai-')) return 'xai';
  if (key.startsWith('sk-or-')) return 'openrouter';
  
  // For Google/Gemini, they don't have a clear prefix pattern
  if (key.length >= 30 && /^[A-Za-z0-9_-]+$/.test(key)) {
    return 'google';
  }
  
  return 'unknown';
}

/**
 * Generates a safe display name for a key
 * @param keyName - The original key name
 * @param provider - The provider name
 * @param index - Optional index for uniqueness
 * @returns A safe display name
 */
export function generateKeyDisplayName(keyName: string, provider: string, index?: number): string {
  if (!keyName || keyName.trim() === '') {
    const baseName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Key`;
    return index !== undefined ? `${baseName} ${index + 1}` : baseName;
  }
  return keyName;
}

/**
 * Calculates key strength based on various factors
 * @param key - The API key
 * @param provider - The provider type
 * @param usageStats - Usage statistics (optional)
 * @returns A strength score from 0-100
 */
export function calculateKeyStrength(
  key: string, 
  provider: string, 
  usageStats?: { successfulRequests: number; totalRequests: number; errorRate: number }
): number {
  let score = 0;
  
  // Base score for key format validation
  if (validateKeyFormat(key, provider)) {
    score += 40;
  } else {
    score += 10; // Partial credit for having a key
  }
  
  // Bonus points for key length
  if (key.length >= 60) score += 20;
  else if (key.length >= 40) score += 15;
  else if (key.length >= 30) score += 10;
  
  // Usage statistics bonus
  if (usageStats) {
    const successRate = usageStats.totalRequests > 0 
      ? usageStats.successfulRequests / usageStats.totalRequests 
      : 0;
    
    // High success rate = higher score
    if (successRate >= 0.95) score += 20;
    else if (successRate >= 0.90) score += 15;
    else if (successRate >= 0.80) score += 10;
    else if (successRate >= 0.70) score += 5;
    
    // Low error rate = bonus points
    if (usageStats.errorRate < 0.05) score += 10;
    else if (usageStats.errorRate < 0.10) score += 5;
    
    // Usage volume bonus (keys that work get used more)
    if (usageStats.totalRequests >= 100) score += 10;
    else if (usageStats.totalRequests >= 50) score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
}