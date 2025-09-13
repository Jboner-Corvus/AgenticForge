#!/usr/bin/env node

/**
 * NVIDIA Technical Analysis Script for AgenticForge
 * Performs comprehensive technical analysis with indicators, support/resistance levels,
 * and trading opportunities with leverage
 */

const AUTH_TOKEN = 'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0';
const API_BASE_URL = 'http://localhost:3002';
const API_ENDPOINT = '/api/test-chat';

interface ApiResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

async function performDetailedNvidiaAnalysis(): Promise<void> {
  console.log('🚀 Starting Detailed NVIDIA Technical Analysis...\\n');
  
  const prompt = `Effectue une analyse technique complète de l'action NVIDIA (NVDA) avec les éléments suivants :

1. **Indicateurs techniques** :
   - RSI (14 périodes)
   - MACD (12,26,9)
   - SMA 20, 50, 200
   - EMA 12, 26
   - Bollinger Bands (20 périodes, 2 écarts-types)
   - Stochastic Oscillator (14,3,3)
   - Volume Weighted Average Price (VWAP)
   - Ichimoku Cloud

2. **Niveaux de support et résistance** :
   - Identifier les 3 derniers supports significatifs
   - Identifier les 3 dernières résistances significatives
   - Niveau psychologique important

3. **Opportunités de trading** :
   - Signaux d'achat (long) avec justification
   - Signaux de vente (short) avec justification
   - Leverage recommandé (1x à 10x) selon le niveau de confiance
   - Stop-loss et take-profit suggérés

4. **Affichage** :
   - Présente les résultats dans un format HTML avec Tailwind CSS
   - Utilise des graphiques interactifs si possible
   - Code JavaScript pour l'interactivité
   - Design moderne et professionnel

Utilise les outils financiers Alpha Vantage pour obtenir les données en temps réel.`;
  
  try {
    // Send request to AgenticForge API
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        sessionName: 'Detailed NVIDIA Technical Analysis',
        systemPrompt: 'trader'
      }),
    });

    const data: ApiResponse = await response.json();
    
    if (data.success && data.jobId) {
      console.log(`✅ Detailed analysis job submitted successfully! Job ID: ${data.jobId}`);
      console.log('\\n📋 To view the results, check the worker.log or use the streaming endpoint:');
      console.log(`   tail -f worker.log | grep \"${data.jobId}\"`);
      console.log(`\\n🔗 Streaming endpoint (once implemented):`);
      console.log(`   ${API_BASE_URL}/api/chat/stream/${data.jobId}?auth=${AUTH_TOKEN}&sessionId=nvidia-analysis-${Date.now()}`);
    } else {
      console.error('❌ Failed to submit analysis job:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error submitting analysis job:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the analysis
performDetailedNvidiaAnalysis().catch(console.error);