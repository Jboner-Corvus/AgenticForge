import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function fixQwenKey() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    let keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Remove all Qwen keys
    keys = keys.filter(key => key.apiProvider !== 'qwen');
    
    // Add back only our valid Qwen key with correct baseUrl and not disabled
    keys.push({
      apiKey: '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw',
      apiModel: 'qwen3-coder-plus',
      apiProvider: 'qwen',
      baseUrl: 'https://portal.qwen.ai/v1',
      errorCount: 0,
      isPermanentlyDisabled: false,
      isDisabledUntil: undefined
    });
    
    console.log('Ensured only one Qwen key with correct baseUrl exists and is not disabled');
    
    // Save the updated keys back to Redis
    await redisClient.del('llmApiKeys');
    if (keys.length > 0) {
      await redisClient.rpush(
        'llmApiKeys',
        ...keys.map((key) => JSON.stringify(key))
      );
    }
    console.log('Successfully updated keys in Redis');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing Qwen key:', error);
    process.exit(1);
  }
}

fixQwenKey();