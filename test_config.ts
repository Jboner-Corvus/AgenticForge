import { getConfig } from './packages/core/src/config.ts';

async function testConfig() {
  const config = getConfig();
  console.log('ALPHA_VANTAGE_API_KEY exists:', !!config.ALPHA_VANTAGE_API_KEY);
  console.log(
    'ALPHA_VANTAGE_API_KEY length:',
    config.ALPHA_VANTAGE_API_KEY?.length,
  );
  console.log(
    'ALPHA_VANTAGE_API_KEY first 10 chars:',
    config.ALPHA_VANTAGE_API_KEY?.substring(0, 10),
  );
}

testConfig();
