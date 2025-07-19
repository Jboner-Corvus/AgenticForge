import { toolRegistry } from './dist/toolRegistry.js';

async function listAllTools() {
  try {
    const tools = toolRegistry.getAll();
    console.log("Available Tools:");
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.error("Error listing tools:", error);
  }
}

listAllTools();