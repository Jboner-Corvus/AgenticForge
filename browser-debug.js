// AgenticForge API Test Script
// Copy and paste this into your browser's developer console

console.log('=== AgenticForge API Test Script ===');

// Function to test API endpoints
async function testAPI(endpoint, options = {}) {
 const baseUrl = '/api'; // Adjust if your API is hosted elsewhere
 const url = `${baseUrl}${endpoint}`;
 
 console.log(`\n--- Testing: ${url} ---`);
 
 try {
   // Set default options
   const defaultOptions = {
     method: 'GET',
     headers: {
       'Content-Type': 'application/json',
     },
     ...options
   };
   
   // Get current session ID from cookies if available
   const sessionId = document.cookie
     .split('; ')
     .find(row => row.startsWith('agenticforge_session_id='))
     ?.split('=')[1];
   
   if (sessionId) {
     defaultOptions.headers['X-Session-ID'] = sessionId;
     console.log(`Using Session ID: ${sessionId}`);
   }
   
   console.log('Request:', {
     url,
     method: defaultOptions.method,
     headers: defaultOptions.headers,
     body: defaultOptions.body
   });
   
   // Make the API request
   const response = await fetch(url, defaultOptions);
   
   console.log('Response Status:', response.status);
   console.log('Response Headers:', [...response.headers.entries()]);
   
   // Try to parse response
   let data;
   try {
     const text = await response.text();
     data = text ? JSON.parse(text) : {};
   } catch (e) {
     console.log('Response Text (non-JSON):', data);
     return { status: response.status, data: text };
   }
   
   console.log('Response Data:', data);
   
   if (!response.ok) {
     console.error(`ERROR ${response.status}:`, response.statusText);
   }
   
   return { status: response.status, data };
   
 } catch (error) {
   console.error('Request failed:', error);
   return { status: 0, error: error.message };
 }
}

// Test common endpoints
async function runAllTests() {
 console.log('=== Running API Tests ===');
 
 // 1. Health check
 await testAPI('/health');
 
 // 2. Test session initialization (if applicable)
 // This might be automatic on page load, but we can try to trigger it
 await testAPI('/session', { method: 'POST' });
 
 // 3. Test a general endpoint (you can modify this based on your API)
 // await testAPI('/agents', { method: 'GET' });
 
 console.log('\n=== Tests Completed ===');
}

// Test a specific endpoint with custom data
async function testCustomEndpoint(endpoint, method = 'GET', data = null) {
 const options = { method };
 
 if (data) {
   options.body = JSON.stringify(data);
   options.headers = {
     'Content-Type': 'application/json',
   };
 }
 
 return await testAPI(endpoint, options);
}

// Utility function to get current session info
function getSessionInfo() {
 const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
   const [name, value] = cookie.split('=');
   acc[name] = value;
   return acc;
 }, {});
 
 console.log('Current Session Info:', {
   sessionId: cookies.agenticforge_session_id,
   allCookies: cookies
 });
 
 return cookies;
}

// Watch for network activity
function watchNetwork() {
 console.log('=== Network Activity Watcher Started ===');
 console.log('This will log fetch requests made by the application.');
 
 // Save original fetch
 const originalFetch = window.fetch;
 
 window.fetch = async function(...args) {
   const [resource, options = {}] = args;
   console.group(`🔄 Network Request: ${options.method || 'GET'} ${resource}`);
   console.log('Request Details:', { resource, options });
   
   try {
     const response = await originalFetch(...args);
     
     // Log response info
     console.log('Response Status:', response.status);
     console.log('Response Headers:', [...response.headers.entries()]);
     
     // Create a clone to avoid consuming the stream
     const responseClone = response.clone();
     
     // Try to log response body (be careful with large responses)
     responseClone.text().then(text => {
       try {
         const jsonData = JSON.parse(text);
         console.log('Response Body (JSON):', jsonData);
       } catch {
         console.log('Response Body (Text):', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
       }
     }).catch(err => {
       console.log('Could not read response body:', err);
     });
     
     console.groupEnd();
     return response;
   } catch (error) {
     console.error('Network Request Failed:', error);
     console.groupEnd();
     throw error;
   }
 };
 
 console.log('Network watcher installed. All fetch requests will be logged.');
}

// Export functions to global scope for easy access
window.agenticTest = {
 testAPI,
 runAllTests,
 testCustomEndpoint,
 getSessionInfo,
 watchNetwork
};

console.log('\n=== Available Functions ===');
console.log('agenticTest.runAllTests() - Run common API tests');
console.log('agenticTest.testAPI(endpoint) - Test a specific endpoint');
console.log('agenticTest.testCustomEndpoint(endpoint, method, data) - Test with custom method/data');
console.log('agenticTest.getSessionInfo() - Show current session info');
console.log('agenticTest.watchNetwork() - Watch all network requests');
console.log('===========================\n');

// Auto-run health check
console.log('Running initial health check...');
testAPI('/health');