import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary directory for tools
const tempToolsDir = path.resolve(__dirname, 'temp_tools_for_debugging');
console.log('Temporary tools directory:', tempToolsDir);

// Create the directory
await fs.mkdir(tempToolsDir, { recursive: true });

// Create a test tool file
const validToolContent = `
  import { z } from 'zod';
  export const myTestTool = {
    name: 'myTool',
    description: 'A test tool',
    parameters: z.object({ param1: z.string() }),
    execute: () => 'result',
  };
`;
const toolFilePath = path.join(tempToolsDir, 'valid.tool.ts');
await fs.writeFile(toolFilePath, validToolContent, 'utf-8');
console.log('Created tool file:', toolFilePath);

// Set the TOOLS_PATH environment variable
process.env.TOOLS_PATH = tempToolsDir;
console.log('Set TOOLS_PATH to:', process.env.TOOLS_PATH);

// Import and test the toolLoader
const { getTools, _resetTools, getToolsDir, fileExtension } = await import('./src/utils/toolLoader.js');

console.log('File extension used:', fileExtension);
console.log('Tools directory:', getToolsDir());

// Reset tools and try to load
_resetTools();
const tools = await getTools();
console.log('Loaded tools:', tools);

// Clean up
await fs.rm(tempToolsDir, { force: true, recursive: true });