import { spawn } from 'child_process';

// Run the test with inherited stdio to see all output
const child = spawn('pnpm', ['test', 'src/utils/toolLoader.test.ts'], {
  cwd: '/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core',
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
});