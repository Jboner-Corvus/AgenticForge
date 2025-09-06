import { globalQuoteTool } from './packages/core/src/modules/tools/definitions/alpha-vantage/global-quote.tool.ts';

async function testTeslaQuote() {
  try {
    const result = await globalQuoteTool.execute(
      { symbol: 'TSLA' },
      {
        log: {
          info: console.log,
          error: console.error,
          warn: console.warn,
          debug: console.debug
        }
      }
    );
    console.log('Tesla Quote Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testTeslaQuote();