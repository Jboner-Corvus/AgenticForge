import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function fixQwenKeys() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    let keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Find all Qwen keys with our API key
    const qwenKeys = keys.filter(
      (key) => key.apiProvider === 'qwen' && 
               key.apiKey === '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw'
    );
    
    console.log(`Found ${qwenKeys.length} Qwen keys with the target API key`);
    
    // Remove all Qwen keys with our API key
    keys = keys.filter(
      (key) => !(key.apiProvider === 'qwen' && 
                key.apiKey === '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw')
    );
    
    // Add back a single correct entry without baseUrl (since we're hardcoding it)
    keys.push({
      apiKey: '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw',
      apiModel: 'qwen3-coder-plus',
      apiProvider: 'qwen',
      errorCount: 0,
      isPermanentlyDisabled: false,
      isDisabledUntil: undefined
    });
    
    console.log('Fixed Qwen key entries');
    
    // Save the updated keys back to Redis
    await redisClient.del('llmApiKeys');
    if (keys.length > 0) {
      await redisClient.rpush(
        'llmApiKeys',
        ...keys.map((key) => JSON.stringify(key))
      );
    }
    console.log('Successfully updated Qwen keys in Redis');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing Qwen keys:', error);
    process.exit(1);
  }
}

fixQwenKeys();