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

async function performNvidiaAnalysis(): Promise<void> {
  console.log('🚀 Starting NVIDIA Technical Analysis...\\n');
  
  const prompt = `1 test 
fait moi une grosse analyse technique sur l action Nvidia, passe plusieurs indicateur , affiche les support et resistance, trouve des oppurtinité de long ou de short avec levier, affiche le resultat dans le canvas en format html+tailwand+js`;
  
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
        sessionName: 'NVIDIA Technical Analysis',
        systemPrompt: 'trader'
      }),
    });

    const data: ApiResponse = await response.json();
    
    if (data.success && data.jobId) {
      console.log(`✅ Analysis job submitted successfully! Job ID: ${data.jobId}`);
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
performNvidiaAnalysis().catch(console.error);