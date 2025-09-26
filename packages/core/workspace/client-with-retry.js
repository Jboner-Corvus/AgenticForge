const API_URL = 'http://localhost:3000/api/data';

// Retry configuration
let maxRetries = 3;
const initialDelay = 1000; // 1 second

async function makeRequestWithRetry(retries = 0) {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 500 && retries < maxRetries) {
      const delay = initialDelay * Math.pow(2, retries); // Exponential backoff
      console.log(`Retry ${retries + 1} after ${delay}ms delay (Status: ${response.status})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(retries + 1);
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    if (retries < maxRetries) {
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retry ${retries + 1} after ${delay}ms delay due to error`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(retries + 1);
    }
    throw error;
  }
}

// Run the test
makeRequestWithRetry().then(result => {
  console.log('Success:', result);
}).catch(err => {
  console.error('Final error:', err.message);
});

// Note: Assumes mock server with errorMode = true to simulate 500 errors initially