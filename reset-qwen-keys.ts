import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function resetQwenKeys() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    const keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Filter for Qwen keys that are permanently disabled
    const disabledQwenKeys = keys.filter(
      (key) => key.apiProvider === 'qwen' && key.isPermanentlyDisabled
    );
    
    console.log(`Found ${disabledQwenKeys.length} disabled Qwen keys`);
    
    // Reset the disabled status for all Qwen keys
    let updatedCount = 0;
    for (const key of keys) {
      if (key.apiProvider === 'qwen' && key.isPermanentlyDisabled) {
        key.isPermanentlyDisabled = false;
        key.errorCount = 0;
        key.isDisabledUntil = undefined;
        console.log(`Reset key: ${key.apiKey.substring(0, 10)}...`);
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      // Save the updated keys back to Redis
      await redisClient.del('llmApiKeys');
      if (keys.length > 0) {
        await redisClient.rpush(
          'llmApiKeys',
          ...keys.map((key) => JSON.stringify(key))
        );
      }
      console.log(`Successfully reset ${updatedCount} Qwen keys`);
    } else {
      console.log('No disabled Qwen keys found to reset');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting Qwen keys:', error);
    process.exit(1);
  }
}

resetQwenKeys();