let callCount = 0;
const MAX_CALLS = 10; // Simulate exceeding demo limit

async function getQuote(symbol) {
  callCount++;
  console.log(`Call ${callCount} on primary (Alpha Vantage)...`);
  try {
    if (callCount > 5) { // Simulate exhaustion after 5 calls
      throw new Error('Simulated quota exhausted');
    }
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`);
    if (!response.ok) {
      throw new Error(`Quota exhausted: ${response.status}`);
    }
    const data = await response.json();
    if (data['Error Message'] || data['Note']) {
      throw new Error('Quota exceeded');
    }
    console.log('Primary success for this call.');
    if (callCount < MAX_CALLS) {
      return getQuote(symbol); // Continue to exhaust
    }
    return { provider: 'primary', data, calls: callCount };
  } catch (error) {
    console.log(`Primary failed after ${callCount} calls: ${error.message}. Switching to secondary...`);
    // Secondary: Yahoo Finance
    try {
      const yResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
      const yData = await yResponse.json();
      const price = yData.chart?.result?.[0]?.meta?.regularMarketPrice || 'N/A';
      console.log(`Secondary (Yahoo) success: ${price}`);
      return { provider: 'secondary', data: yData, calls: callCount };
    } catch (yError) {
      console.error(`Secondary failed: ${yError.message}`);
      throw new Error('Failover failed');
    }
  }
}

console.log('Starting failover simulation with multiple calls...');
getQuote('IBM').then(result => {
  console.log('Simulation complete:', result);
}).catch(error => console.error('Test failed:', error));