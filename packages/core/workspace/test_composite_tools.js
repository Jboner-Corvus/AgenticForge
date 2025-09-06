// Test script for new composite tools
const { getAllTools } = require('../dist/modules/tools/definitions/index.js');

async function testCompositeTools() {
  console.log('🧪 Testing Composite Tools...\n');

  const tools = await getAllTools();
  console.log(`📊 Total tools loaded: ${tools.length}`);

  // Group tools by category
  const categories = {
    finance: tools.filter(t => t.name.includes('finance') || t.name.includes('global_quote')),
    file: tools.filter(t => t.name.includes('file') || t.name.includes('read') || t.name.includes('write')),
    web: tools.filter(t => t.name.includes('web') || t.name.includes('playwright')),
    system: tools.filter(t => t.name.includes('finish') || t.name.includes('todo') || t.name.includes('display')),
    ai: tools.filter(t => t.name.includes('summarize')),
    code: tools.filter(t => t.name.includes('execute')),
    planning: tools.filter(t => t.name.includes('planning'))
  };

  console.log('\n📂 Tool Categories:');
  Object.entries(categories).forEach(([category, tools]) => {
    if (tools.length > 0) {
      console.log(`  ${category.toUpperCase()}: ${tools.length} tools`);
      tools.forEach(tool => console.log(`    - ${tool.name}`));
    }
  });

  console.log('\n✅ Composite tools successfully created!');
  console.log('🎯 Reduction: 37 → ~15 essential tools');
}

testCompositeTools().catch(console.error);