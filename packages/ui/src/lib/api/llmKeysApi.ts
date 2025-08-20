// API utilitaires pour la gestion des clés LLM avec Redis
import { clientConfig } from '../../config';

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
  'google-flash': {
    pattern: 'llm:keys:google-flash:*',
    description: 'Google Gemini Flash API keys',
    example: 'llm:keys:google-flash:key_789'
  },
  'google-pro': {
    pattern: 'llm:keys:google-pro:*',
    description: 'Google Gemini Pro API keys',
    example: 'llm:keys:google-pro:key_789'
  },
  google: {
    pattern: 'llm:keys:google:*',
    description: 'Google Gemini API keys (legacy)',
    example: 'llm:keys:google:key_789'
  },
  xai: {
    pattern: 'llm:keys:xai:*',
    description: 'xAI Grok API keys',
    example: 'llm:keys:xai:key_abc'
  },
  qwen: {
    pattern: 'llm:keys:qwen:*',
    description: 'Qwen3 Coder API keys',
    example: 'llm:keys:qwen:key_def'
  },
  openrouter: {
    pattern: 'llm:keys:openrouter:*',
    description: 'OpenRouter API keys',
    example: 'llm:keys:openrouter:key_ghi'
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

  // Get authentication headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Try to get JWT from cookie
    const cookieName = 'agenticforge_jwt=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(cookieName) === 0) {
        const jwtToken = c.substring(cookieName.length, c.length);
        if (jwtToken) {
          headers['Authorization'] = 'Bearer ' + jwtToken;
        }
        break;
      }
    }

    // Try to get token from localStorage as fallback
    if (!headers['Authorization']) {
      const localStorageToken = localStorage.getItem('backendAuthToken');
      if (localStorageToken) {
        headers['Authorization'] = 'Bearer ' + localStorageToken;
      }
    }

    // Fallback to env AUTH_TOKEN
    if (!headers['Authorization']) {
      const envToken = clientConfig.AUTH_TOKEN;
      headers['Authorization'] = 'Bearer ' + envToken;
    }

    return headers;
  }

  // Fetch all keys from Redis
  async fetchKeysFromRedis(): Promise<RedisLLMKey[]> {
    const response = await fetch(`${this.baseUrl}/redis/keys`, {
      method: 'GET',
      headers: this.getAuthHeaders()
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
      headers: this.getAuthHeaders(),
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
    try {
      const response = await fetch(`${this.baseUrl}/redis/info`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get Redis info: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // Return default disconnected state if the endpoint is not available
      return {
        connected: false,
        keyCount: 0,
        memory: '0K'
      };
    }
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

  // Key hierarchy operations
  async getKeyHierarchy(): Promise<{[key: string]: number}> {
    const response = await fetch(`${this.baseUrl}/hierarchy`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get key hierarchy: ${response.statusText}`);
    }

    return response.json();
  }

  async setKeyHierarchy(hierarchy: {[key: string]: number}): Promise<void> {
    const response = await fetch(`${this.baseUrl}/hierarchy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(hierarchy)
    });

    if (!response.ok) {
      throw new Error(`Failed to set key hierarchy: ${response.statusText}`);
    }
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
      'google-flash': /^AI[a-zA-Z0-9\-_]{35,}$/,
      'google-pro': /^AI[a-zA-Z0-9\-_]{35,}$/,
      google: /^AI[a-zA-Z0-9\-_]{35,}$/,
      xai: /^xai-[a-zA-Z0-9\-_]{20,}$/,
      qwen: /^[a-zA-Z0-9\-_]{20,}$/,
      openrouter: /^sk-or-[a-zA-Z0-9\-_]{10,}$/
    };

    const pattern = patterns[provider];
    return pattern ? pattern.test(keyValue) : keyValue.length > 10;
  }
}

// Export singleton instance
export const llmKeysApi = new LLMKeysApi();