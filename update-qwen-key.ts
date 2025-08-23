import { getRedisClientInstance } from './packages/core/src/modules/redis/redisClient.ts';
import { LlmApiKey } from './packages/core/src/modules/llm/LlmKeyManager.ts';

async function updateQwenKey() {
  try {
    const redisClient = getRedisClientInstance();
    
    // Get all LLM API keys
    const keysJson = await redisClient.lrange('llmApiKeys', 0, -1);
    const keys: LlmApiKey[] = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Find the Qwen key without baseUrl
    const qwenKeyIndex = keys.findIndex(
      (key) => key.apiProvider === 'qwen' && 
               key.apiKey === '_trPxyNaN47_vdVlnVTBu3RkqdaccB6g0YzjaCc3kxjw7f6O7omPJKQZhQRcCCDxOJ5mZ8CeODz17v0t-fKRUw' &&
               !key.baseUrl
    );
    
    if (qwenKeyIndex !== -1) {
      // Update the key with the correct baseUrl
      keys[qwenKeyIndex].baseUrl = 'https://portal.qwen.ai/v1';
      console.log(`Updated Qwen key with baseUrl: ${keys[qwenKeyIndex].baseUrl}`);
      
      // Save the updated keys back to Redis
      await redisClient.del('llmApiKeys');
      if (keys.length > 0) {
        await redisClient.rpush(
          'llmApiKeys',
          ...keys.map((key) => JSON.stringify(key))
        );
      }
      console.log('Successfully updated Qwen key with baseUrl');
    } else {
      console.log('Qwen key with missing baseUrl not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating Qwen key:', error);
    process.exit(1);
  }
}

updateQwenKey();