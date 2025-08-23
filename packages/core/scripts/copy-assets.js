import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Ensure dist directory exists
const distDir = resolve('./dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Copy system.prompt.md to dist directory
const sourcePath = resolve('./src/modules/agent/system.prompt.md');
const destPath = resolve('./dist/system.prompt.md');

try {
  copyFileSync(sourcePath, destPath);
  console.log('Copied system.prompt.md to dist directory');
} catch (error) {
  console.error('Error copying system.prompt.md:', error);
}

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