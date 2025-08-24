const redis = require('redis');

async function resetDisabledKeys() {
  let redisClient = null;
  
  try {
    // Create Redis client
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_HOST_PORT || process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined
    });
    
    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    // Connect to Redis
    await redisClient.connect();
    console.log('Connected to Redis');
    
    // Get all LLM API keys
    const keysJson = await redisClient.lRange('llmApiKeys', 0, -1);
    console.log(`Found ${keysJson.length} API keys in Redis`);
    
    if (keysJson.length === 0) {
      console.log('No keys found in Redis');
      await redisClient.quit();
      return;
    }
    
    // Parse the keys
    const keys = keysJson.map((key) => JSON.parse(key));
    
    // Count disabled keys
    const disabledKeys = keys.filter(
      (key) => key.isPermanentlyDisabled || (key.isDisabledUntil && key.isDisabledUntil > Date.now())
    );
    
    console.log(`Found ${disabledKeys.length} disabled keys`);
    
    // Reset the disabled status for all keys
    let updatedCount = 0;
    for (const key of keys) {
      if (key.isPermanentlyDisabled || (key.isDisabledUntil && key.isDisabledUntil > Date.now())) {
        key.isPermanentlyDisabled = false;
        key.errorCount = 0;
        key.isDisabledUntil = undefined;
        console.log(`Reset key: ${key.apiProvider} - ${key.apiKey.substring(0, 10)}...`);
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      // Save the updated keys back to Redis
      await redisClient.del('llmApiKeys');
      if (keys.length > 0) {
        const keyStrings = keys.map((key) => JSON.stringify(key));
        await redisClient.rPush('llmApiKeys', ...keyStrings);
      }
      console.log(`Successfully reset ${updatedCount} disabled keys`);
    } else {
      console.log('No disabled keys found to reset');
    }
    
    // Close Redis connection
    await redisClient.quit();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error resetting disabled keys:', error);
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

// Run the function
resetDisabledKeys().catch(console.error);