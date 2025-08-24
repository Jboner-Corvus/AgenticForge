import { createClient } from 'redis';

async function resetQwenKeys() {
  let redisClient: any = null;
  
  try {
    // Create Redis client
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined
    });
    
    // Connect to Redis
    await redisClient.connect();
    console.log('Connected to Redis');
    
    // Get all LLM API keys
    const keysJson = await redisClient.lRange('llmApiKeys', 0, -1);
    const keys = keysJson.map((key: string) => JSON.parse(key));
    
    console.log(`Found ${keys.length} API keys in Redis`);
    
    // Filter for Qwen keys that are permanently disabled
    const disabledQwenKeys = keys.filter(
      (key: any) => key.apiProvider === 'qwen' && key.isPermanentlyDisabled
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
        const keyStrings = keys.map((key: any) => JSON.stringify(key));
        await redisClient.rPush('llmApiKeys', ...keyStrings);
      }
      console.log(`Successfully reset ${updatedCount} Qwen keys`);
    } else {
      console.log('No disabled Qwen keys found to reset');
    }
    
    // Close Redis connection
    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting Qwen keys:', error);
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (quitError) {
        console.error('Error closing Redis connection:', quitError);
      }
    }
    process.exit(1);
  }
}

resetQwenKeys();