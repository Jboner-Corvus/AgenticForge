import { createServer } from 'http';
import { URL } from 'url';

let requestCount = 0;

createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  
  requestCount++;
  const shouldError = pathname === '/api/data' && requestCount <= 2;
  
  if (shouldError) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
    console.log(`Request ${requestCount}: Simulated 500 error`);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', data: 'Sample data' }));
    console.log(`Request ${requestCount}: Returned success`);
  }
}).listen(3000, () => {
  requestCount = 0; // Reset on start
  console.log('Mock API server running on port 3000 (simulates 2x 500 then success)');
});
