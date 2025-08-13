// API utilitaires pour la gestion des clés LLM avec Redis
export interface RedisKeyPattern {
  pattern: string;
  description: string;
  example: string;
}

export interface RedisLLMKey {
  provider: string;
  keyId: string;
  encryptedKey: string;
  metadata: {
    name?: string;
    environment?: string;
    created: string;
    lastUsed?: string;
    usage_count?: number;
    rate_limit?: {
      requests_per_minute: number;
      tokens_per_minute: number;
    };
  };
}

// Patterns Redis pour les clés LLM
export const REDIS_KEY_PATTERNS: Record<string, RedisKeyPattern> = {
  openai: {
    pattern: 'llm:keys:openai:*',
    description: 'OpenAI API keys stored in Redis',
    example: 'llm:keys:openai:key_123'
  },
  anthropic: {
    pattern: 'llm:keys:anthropic:*', 
    description: 'Anthropic Claude API keys',
    example: 'llm:keys:anthropic:key_456'
  },
  google: {
    pattern: 'llm:keys:google:*',
    description: 'Google AI API keys',
    example: 'llm:keys:google:key_789'
  },
  cohere: {
    pattern: 'llm:keys:cohere:*',
    description: 'Cohere API keys',
    example: 'llm:keys:cohere:key_abc'
  },
  mistral: {
    pattern: 'llm:keys:mistral:*',
    description: 'Mistral AI API keys', 
    example: 'llm:keys:mistral:key_def'
  },
  global: {
    pattern: 'llm:keys:*',
    description: 'All LLM API keys',
    example: 'llm:keys:*:*'
  }
};

export class LLMKeysApi {
  private baseUrl: string;

  constructor(baseUrl = '/api/llm-keys') {
    this.baseUrl = baseUrl;
  }

  // Fetch all keys from Redis
  async fetchKeysFromRedis(): Promise<RedisLLMKey[]> {
    const response = await fetch(`${this.baseUrl}/redis/keys`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch keys from Redis: ${response.statusText}`);
    }

    return response.json();
  }

  // Scan Redis for keys by pattern
  async scanRedisKeys(pattern: string = 'llm:keys:*'): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/redis/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pattern })
    });

    if (!response.ok) {
      throw new Error(`Failed to scan Redis keys: ${response.statusText}`);
    }

    const result = await response.json();
    return result.keys || [];
  }

  // Get specific key from Redis
  async getRedisKey(keyPath: string): Promise<RedisLLMKey | null> {
    const response = await fetch(`${this.baseUrl}/redis/key/${encodeURIComponent(keyPath)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get Redis key: ${response.statusText}`);
    }

    return response.json();
  }

  // Set key in Redis
  async setRedisKey(keyPath: string, keyData: RedisLLMKey): Promise<void> {
    const response = await fetch(`${this.baseUrl}/redis/key/${encodeURIComponent(keyPath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(keyData)
    });

    if (!response.ok) {
      throw new Error(`Failed to set Redis key: ${response.statusText}`);
    }
  }

  // Delete key from Redis
  async deleteRedisKey(keyPath: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/redis/key/${encodeURIComponent(keyPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Redis key: ${response.statusText}`);
    }
  }

  // Test key validity
  async testKey(provider: string, keyValue: string): Promise<{ valid: boolean; error?: string }> {
    const response = await fetch(`${this.baseUrl}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ provider, keyValue })
    });

    if (!response.ok) {
      throw new Error(`Failed to test key: ${response.statusText}`);
    }

    return response.json();
  }

  // Get Redis info
  async getRedisInfo(): Promise<{ connected: boolean; keyCount: number; memory: string }> {
    const response = await fetch(`${this.baseUrl}/redis/info`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to get Redis info: ${response.statusText}`);
    }

    return response.json();
  }

  // Bulk operations
  async bulkImportFromRedis(patterns: string[]): Promise<{ imported: number; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/redis/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ patterns })
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk import: ${response.statusText}`);
    }

    return response.json();
  }

  async bulkExportToRedis(keys: RedisLLMKey[]): Promise<{ exported: number; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/redis/bulk-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keys })
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk export: ${response.statusText}`);
    }

    return response.json();
  }

  // Utilities
  static generateKeyPath(provider: string, keyId: string): string {
    return `llm:keys:${provider}:${keyId}`;
  }

  static parseKeyPath(keyPath: string): { provider: string; keyId: string } | null {
    const match = keyPath.match(/^llm:keys:([^:]+):(.+)$/);
    if (!match) return null;
    
    return {
      provider: match[1],
      keyId: match[2]
    };
  }

  static validateKeyFormat(provider: string, keyValue: string): boolean {
    const patterns: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9\-_]{10,}$/,
      google: /^AI[a-zA-Z0-9\-_]{35,}$/,
      cohere: /^[a-zA-Z0-9\-_]{40,}$/,
      mistral: /^[a-zA-Z0-9\-_]{32,}$/
    };

    const pattern = patterns[provider];
    return pattern ? pattern.test(keyValue) : keyValue.length > 10;
  }
}

// Export singleton instance
export const llmKeysApi = new LLMKeysApi();