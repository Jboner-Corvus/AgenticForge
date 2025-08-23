import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function fixQwenKey() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    let keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Remove all Qwen keys with our API key
    keys = keys.filter(
      (key) => !(key.apiProvider === 'qwen' && 
                key.apiKey === '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw')
    );
    
    // Add back a single correct entry
    keys.push({
      apiKey: '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw',
      apiModel: 'qwen3-coder-plus',
      apiProvider: 'qwen',
      baseUrl: 'https://portal.qwen.ai/v1',
      errorCount: 0,
      isPermanentlyDisabled: false,
      isDisabledUntil: undefined
    });
    
    console.log('Fixed Qwen key entry');
    
    // Save the updated keys back to Redis
    await redisClient.del('llmApiKeys');
    if (keys.length > 0) {
      await redisClient.rpush(
        'llmApiKeys',
        ...keys.map((key) => JSON.stringify(key))
      );
    }
    console.log('Successfully updated Qwen key in Redis');
    
    // Verify the fix
    const updatedKeysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    const updatedKeys: LlmApiKey[] = updatedKeysJson.map((key: string) => JSON.parse(key));
    const ourKey = updatedKeys.find(
      (key) => key.apiProvider === 'qwen' && 
               key.apiKey === '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw'
    );
    
    if (ourKey) {
      console.log('Verification - Key properties:');
      console.log(`  baseUrl: ${ourKey.baseUrl}`);
      console.log(`  isPermanentlyDisabled: ${ourKey.isPermanentlyDisabled}`);
      console.log(`  errorCount: ${ourKey.errorCount}`);
    } else {
      console.log('Warning: Could not verify key after update');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing Qwen key:', error);
    process.exit(1);
  }
}

fixQwenKey();