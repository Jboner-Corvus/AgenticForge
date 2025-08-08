import { copyFileSync, cpSync } from 'fs';
import { resolve } from 'path';

// Copy system.prompt.md to dist directory
const sourcePath = resolve('./src/modules/agent/system.prompt.md');
const destPath = resolve('./dist/system.prompt.md');

copyFileSync(sourcePath, destPath);
console.log('Copied system.prompt.md to dist directory');

// Copy tools directory to dist directory
const toolsSourcePath = resolve('./src/tools');
const toolsDestPath = resolve('./dist/tools');

cpSync(toolsSourcePath, toolsDestPath, { recursive: true });
console.log('Copied tools directory to dist directory');