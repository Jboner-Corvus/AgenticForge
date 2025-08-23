import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function cleanupQwenKeys() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    let keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Count Qwen keys before cleanup
    const qwenKeysBefore = keys.filter(key => key.apiProvider === 'qwen');
    console.log(`Found ${qwenKeysBefore.length} Qwen keys before cleanup`);
    
    // Remove all Qwen keys
    keys = keys.filter(key => key.apiProvider !== 'qwen');
    
    // Add back only our valid Qwen key with correct baseUrl
    keys.push({
      apiKey: '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw',
      apiModel: 'qwen3-coder-plus',
      apiProvider: 'qwen',
      baseUrl: 'https://portal.qwen.ai/v1',
      errorCount: 0,
      isPermanentlyDisabled: false,
      isDisabledUntil: undefined
    });
    
    console.log('Cleaned up Qwen keys - kept only the valid one with correct baseUrl');
    
    // Save the updated keys back to Redis
    await redisClient.del('llmApiKeys');
    if (keys.length > 0) {
      await redisClient.rpush(
        'llmApiKeys',
        ...keys.map((key) => JSON.stringify(key))
      );
    }
    console.log('Successfully updated keys in Redis');
    
    // Verify the cleanup
    const updatedKeysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    const updatedKeys: LlmApiKey[] = updatedKeysJson.map((key: string) => JSON.parse(key));
    const qwenKeysAfter = updatedKeys.filter(key => key.apiProvider === 'qwen');
    
    console.log(`Found ${qwenKeysAfter.length} Qwen keys after cleanup`);
    if (qwenKeysAfter.length > 0) {
      const ourKey = qwenKeysAfter[0];
      console.log('Verification - Key properties:');
      console.log(`  apiKey: ${ourKey.apiKey.substring(0, 10)}...`);
      console.log(`  baseUrl: ${ourKey.baseUrl}`);
      console.log(`  isPermanentlyDisabled: ${ourKey.isPermanentlyDisabled}`);
      console.log(`  errorCount: ${ourKey.errorCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up Qwen keys:', error);
    process.exit(1);
  }
}

cleanupQwenKeys();