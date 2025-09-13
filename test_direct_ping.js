// Test direct du ping Alpha Vantage
import { pingTool } from './packages/core/dist/modules/tools/definitions/alpha-vantage/ping.tool.js';

async function testPing() {
  console.log('🏓 Test direct du ping Alpha Vantage...');

  try {
    const result = await pingTool.execute({}, { log: console.log });
    console.log('✅ Ping result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erreur ping:', error.message);
  }
}

testPing();
