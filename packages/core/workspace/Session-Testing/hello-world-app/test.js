const assert = require('assert');
const { execSync } = require('child_process');

try {
  const output = execSync('node ../../Session-Developpement/hello-world-app/index.js').toString().trim();
  assert.strictEqual(output, 'Hello from Session-Developpement!');
  console.log('Test passed for Session-Testing!');
} catch (error) {
  console.error('Test failed for Session-Testing:', error.message);
  process.exit(1);
}