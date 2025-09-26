async function makeApiCall(attempt) {
  try {
    const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo');
    const data = await response.json();
    console.log(`Attempt ${attempt}: Status ${response.status}, Response: ${JSON.stringify(data).substring(0, 100)}...`);
    if (response.status === 200) {
      setTimeout(() => makeApiCall(attempt + 1), 1000); // 1s delay to simulate rate limiting
    } else {
      console.log(`Quota exhaustion simulated at attempt ${attempt}. Status: ${response.status}. Switching to secondary provider...`);
    }
  } catch (error) {
    console.log(`Error on attempt ${attempt}: ${error.message}. Quota exhausted?`);
  }
}

console.log('Starting quota exhaustion simulation for primary provider (Alpha Vantage)...');
makeApiCall(1);