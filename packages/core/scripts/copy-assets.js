import { copyFileSync, cpSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Copy system.prompt.md to dist directory
const sourcePath = resolve('./src/modules/agent/system.prompt.md');
const destPath = resolve('./dist/system.prompt.md');

copyFileSync(sourcePath, destPath);
console.log('Copied system.prompt.md to dist directory');

// Copy tools definitions to dist directory
const toolsSourcePath = resolve('./src/modules/tools/definitions');
const toolsDestPath = resolve('./dist/modules/tools/definitions');

try {
  // Create the destination directory if it doesn't exist
  mkdirSync(resolve('./dist/modules'), { recursive: true });
  mkdirSync(resolve('./dist/modules/tools'), { recursive: true });
  
  // Copy the entire definitions directory
  cpSync(toolsSourcePath, toolsDestPath, { recursive: true });
  console.log('Copied tools definitions to dist directory');
} catch (error) {
  console.error('Error copying tools definitions:', error);
}