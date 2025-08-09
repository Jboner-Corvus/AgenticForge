import { getTools } from './packages/core/dist/utils/toolLoader.js';

// Set the TOOLS_PATH environment variable
process.env.TOOLS_PATH = './packages/core/dist/modules/tools/definitions';

async function testTools() {
  try {
    console.log('Loading tools...');
    const tools = await getTools();
    console.log(`Loaded ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.error('Error loading tools:', error);
  }
}

testTools();