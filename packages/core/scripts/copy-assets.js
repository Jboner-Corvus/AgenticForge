import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Ensure dist directory exists
const distDir = resolve('./dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Copy all system.prompt.*.md files to dist directory
import { readdirSync } from 'fs';

const agentDestDir = resolve('./dist/modules/agent');
mkdirSync(agentDestDir, { recursive: true });

const sourceDir = resolve('./src/modules/agent');
const allFiles = readdirSync(sourceDir);
const promptFiles = allFiles.filter(file => file.startsWith('system.prompt.') && file.endsWith('.md'));
console.log(`Found ${promptFiles.length} system prompt files to copy`);

for (const fileName of promptFiles) {
  const sourcePath = resolve(sourceDir, fileName);
  const destPath = resolve(agentDestDir, fileName);
  try {
    copyFileSync(sourcePath, destPath);
    console.log(`Copied ${fileName} to dist directory`);
  } catch (error) {
    console.error(`Error copying ${fileName}:`, error);
  }
}

// Also copy the main system.prompt.md to root of dist for backward compatibility
const sourcePath = resolve('./src/modules/agent/system.prompt.md');
const destPath = resolve('./dist/system.prompt.md');

try {
  copyFileSync(sourcePath, destPath);
  console.log('Copied system.prompt.md to dist directory (backward compatibility)');
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
