// Test direct de l'outil Alpha Vantage pour Tesla
import {
  _internalLoadTools,
  getTools,
} from './packages/core/dist/utils/toolLoader.js';

async function testTeslaSupport() {
  console.log('🔧 Chargement des outils...');

  try {
    await _internalLoadTools();
    const tools = getTools();
    console.log(`✅ ${Object.keys(tools).length} outils chargés`);

    // Lister les outils Alpha Vantage disponibles
    const alphaVantageTools = Object.keys(tools).filter(
      (name) =>
        name.includes('alpha_vantage') ||
        name.includes('global_quote') ||
        name.includes('time_series'),
    );

    console.log('📊 Outils Alpha Vantage disponibles:');
    alphaVantageTools.forEach((tool) => console.log(`  - ${tool}`));

    // Test de l'API ping en premier
    if (tools.alpha_vantage_ping) {
      console.log('\n🏓 Test ping Alpha Vantage...');
      const pingResult = await tools.alpha_vantage_ping.execute(
        {},
        { log: console.log },
      );
      console.log('✅ Ping result:', pingResult);
    }

    // Test de global quote pour Tesla
    if (tools.global_quote) {
      console.log('\n📈 Test global quote pour Tesla (TSLA)...');
      const teslaQuote = await tools.global_quote.execute(
        {
          symbol: 'TSLA',
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
        },
        { log: console.log },
      );

      console.log('✅ Tesla Quote:', JSON.stringify(teslaQuote, null, 2));

      // Analyser le support technique
      if (teslaQuote && teslaQuote['Global Quote']) {
        const quote = teslaQuote['Global Quote'];
        const currentPrice = parseFloat(quote['05. price']);
        const dayLow = parseFloat(quote['04. low']);
        const dayHigh = parseFloat(quote['03. high']);

        console.log('\n📊 ANALYSE SUPPORT TESLA:');
        console.log(`Prix actuel: $${currentPrice}`);
        console.log(`Plus bas du jour: $${dayLow} (Support immédiat)`);
        console.log(`Plus haut du jour: $${dayHigh} (Résistance)`);

        const supportLevel = Math.round(dayLow * 0.995 * 100) / 100; // Support 0.5% sous le low
        console.log(`🎯 Niveau de support calculé: $${supportLevel}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

testTeslaSupport();
