import { copyFileSync } from 'fs';
import { resolve } from 'path';

// Copy system.prompt.md to dist directory
const sourcePath = resolve('./src/modules/agent/system.prompt.md');
const destPath = resolve('./dist/system.prompt.md');

copyFileSync(sourcePath, destPath);
console.log('Copied system.prompt.md to dist directory');