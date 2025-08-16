// Test API depuis la console du navigateur
// Colle ce code dans la console (F12) pour tester l'API directement

async function testChatAPI() {
  console.log('🚀 TEST API CHAT depuis le navigateur');
  console.log('====================================');
  
  try {
    // Récupérer le token et session depuis le localStorage
    const authToken = localStorage.getItem('agenticforge-ui-store') || 
                     localStorage.getItem('authToken') || 
                     'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
    
    const sessionId = localStorage.getItem('agenticForgeSessionId') || 
                      `test-${Date.now()}`;
    
    console.log('🔑 Auth Token:', authToken ? authToken.substring(0, 20) + '...' : 'ABSENT');
    console.log('🆔 Session ID:', sessionId);
    
    // Test 1: Vérifier l'health check
    console.log('\n📡 Test 1: Health Check');
    const healthResponse = await fetch('/api/health');
    console.log('- Status:', healthResponse.status);
    console.log('- OK:', healthResponse.ok);
    
    // Test 2: Vérifier les tools
    console.log('\n🔧 Test 2: Tools');
    const toolsResponse = await fetch('/api/tools', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Session-ID': sessionId
      }
    });
    console.log('- Status:', toolsResponse.status);
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log('- Tools count:', tools.length);
    } else {
      console.log('- Error:', await toolsResponse.text());
    }
    
    // Test 3: Vérifier les clés LLM
    console.log('\n🔑 Test 3: LLM Keys');
    const keysResponse = await fetch('/api/llm-api-keys', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('- Status:', keysResponse.status);
    if (keysResponse.ok) {
      const keys = await keysResponse.json();
      console.log('- Keys count:', keys.length);
    } else {
      console.log('- Error:', await keysResponse.text());
    }
    
    // Test 4: Envoyer un message de chat
    console.log('\n💬 Test 4: Chat Message');
    const chatResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        prompt: 'test message from browser console'
      })
    });
    
    console.log('- Status:', chatResponse.status);
    console.log('- OK:', chatResponse.ok);
    
    if (chatResponse.ok) {
      const result = await chatResponse.json();
      console.log('- Response:', result);
      
      if (result.jobId) {
        console.log('✅ Message envoyé avec succès! Job ID:', result.jobId);
        
        // Test 5: Écouter le stream
        console.log('\n📡 Test 5: SSE Stream');
        const streamUrl = `/api/chat/stream/${result.jobId}?auth=${encodeURIComponent(authToken)}&sessionId=${encodeURIComponent(sessionId)}`;
        console.log('- Stream URL:', streamUrl);
        
        const eventSource = new EventSource(streamUrl);
        
        eventSource.onopen = () => {
          console.log('✅ Stream connecté!');
        };
        
        eventSource.onmessage = (event) => {
          console.log('📨 Message reçu:', event.data);
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'close') {
              console.log('🔚 Stream fermé par le serveur');
              eventSource.close();
            }
          } catch (e) {
            // Message non-JSON, probablement heartbeat
          }
        };
        
        eventSource.onerror = (error) => {
          console.log('❌ Erreur stream:', error);
          eventSource.close();
        };
        
        // Fermer automatiquement après 30 secondes
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('⏰ Fermeture automatique du stream après 30s');
            eventSource.close();
          }
        }, 30000);
      }
    } else {
      const errorText = await chatResponse.text();
      console.log('❌ Erreur chat:', errorText);
    }
    
  } catch (error) {
    console.log('🚨 ERREUR:', error);
  }
  
  console.log('\n====================================');
  console.log('✅ Test API terminé!');
}

// Auto-run
console.log('💡 Pour tester l\'API, tapez: testChatAPI()');