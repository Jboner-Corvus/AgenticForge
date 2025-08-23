import { getAllTools } from './modules/tools/definitions/index.ts';

async function testTools() {
  try {
    console.log('Loading tools...');
    const tools = await getAllTools();
    console.log(`Found ${tools.length} tools:`);
    tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.error('Error loading tools:', error);
  }
}

testTools();
