// minimal_spawn_test.ts
import { spawn } from 'child_process';
import * as fs from 'fs';

console.log('--- Minimal Spawn Test Initializing ---');
console.log('Node.js version:', process.version);
console.log('process.cwd():', process.cwd());
console.log('PATH:', process.env.PATH);

const shPath = '/bin/sh';
const shExists = fs.existsSync(shPath);
console.log(`Does '${shPath}' exist according to fs? -> ${shExists}`);

if (!shExists) {
  console.error("CRITICAL: The filesystem is not visible as expected. Exiting.");
  process.exit(1);
}

console.log(`\nAttempting to spawn: ${shPath} -c "echo Hello from shell"`);

const child = spawn(shPath, ['-c', 'echo "Hello from shell" && ls -la /bin/sh']);

child.stdout.on('data', (data) => {
  console.log('✅ STDOUT:', data.toString().trim());
});

child.stderr.on('data', (data) => {
  console.error('❌ STDERR:', data.toString().trim());
});

child.on('error', (err) => {
  // This is the event that fires for an ENOENT error
  console.error(' SPAWN ERROR:', err);
});

child.on('close', (code) => {
  console.log('\n--- Test Complete ---');
  console.log('Exit Code:', code);
  if (code !== 0) {
    console.error('The test FAILED.');
  } else {
    console.log('The test PASSED.');
  }
});

