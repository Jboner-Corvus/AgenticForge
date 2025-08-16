// SCRIPT COMPLET DE DIAGNOSTIC CHAT
// Colle tout ce script d'un coup dans la console (F12) puis tape: runDiagnostic()

console.log('🔧 DIAGNOSTIC COMPLET AGENTICFORGE CHAT');
console.log('=====================================');

// Function principale de diagnostic
async function runDiagnostic() {
  console.log('🚀 DÉMARRAGE DU DIAGNOSTIC COMPLET');
  console.log('==================================');
  
  // 1. Vérifier les éléments DOM
  console.log('\n📋 1. VÉRIFICATION DOM');
  const textarea = document.querySelector('textarea[name="user-input"]');
  const sendButton = document.querySelector('button[aria-label="Send message"]');
  
  console.log('- Textarea trouvée:', !!textarea);
  console.log('- Bouton Send trouvé:', !!sendButton);
  
  if (textarea) {
    console.log('- Textarea disabled:', textarea.disabled);
    console.log('- Textarea value:', textarea.value);
    textarea.style.border = '2px solid red'; // Highlight for debug
  }
  
  if (sendButton) {
    console.log('- Bouton disabled:', sendButton.disabled);
    sendButton.style.border = '2px solid blue'; // Highlight for debug
  }
  
  // 2. Vérifier l'auth et session
  console.log('\n🔐 2. VÉRIFICATION AUTH');
  const authToken = localStorage.getItem('agenticforge-ui-store') || 
                   localStorage.getItem('authToken') || 
                   'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
  const sessionId = localStorage.getItem('agenticForgeSessionId') || 
                    `test-${Date.now()}`;
  
  console.log('- Auth Token:', authToken ? authToken.substring(0, 20) + '...' : 'ABSENT');
  console.log('- Session ID:', sessionId);
  
  // 3. Test API sanity check
  console.log('\n🌐 3. TEST API RAPIDE');
  try {
    const healthResponse = await fetch('/api/health');
    console.log('- Health status:', healthResponse.status);
    
    const toolsResponse = await fetch('/api/tools', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Session-ID': sessionId
      }
    });
    console.log('- Tools status:', toolsResponse.status);
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log('- Tools count:', tools.length);
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
  
  // 4. Intercepter tous les fetch pour voir ce qui se passe
  console.log('\n🕵️ 4. SURVEILLANCE FETCH');
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🔍 FETCH INTERCEPTÉ:', args[0], args[1]);
    return originalFetch.apply(this, arguments).then(response => {
      console.log('📬 RÉPONSE FETCH:', response.status, response.url);
      return response;
    }).catch(error => {
      console.log('❌ ERREUR FETCH:', error);
      throw error;
    });
  };
  
  // 5. Fonction de test d'envoi de message
  console.log('\n💬 5. FONCTIONS DE TEST DISPONIBLES');
  console.log('- testSendMessage() : teste l\'envoi programmatique');
  console.log('- testChatAPI() : teste l\'API chat directement');
  console.log('- stopDiagnostic() : arrête la surveillance');
  
  console.log('\n✅ DIAGNOSTIC SETUP TERMINÉ!');
  console.log('🎯 Maintenant essaie d\'envoyer un message manuellement');
  console.log('🔍 Tous les appels réseau seront loggés');
}

// Test d'envoi programmatique
function testSendMessage() {
  console.log('🧪 TEST: Envoi programmatique');
  
  const textarea = document.querySelector('textarea[name="user-input"]');
  const sendButton = document.querySelector('button[aria-label="Send message"]');
  
  if (textarea && sendButton) {
    // Simuler la saisie
    textarea.value = 'test message from console';
    textarea.focus();
    
    // Déclencher les événements
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    
    textarea.dispatchEvent(inputEvent);
    textarea.dispatchEvent(changeEvent);
    
    console.log('✏️ Message saisi:', textarea.value);
    console.log('🖱️ Simulation du clic...');
    
    setTimeout(() => {
      sendButton.click();
      console.log('✅ Clic simulé !');
    }, 500);
  } else {
    console.log('❌ Éléments DOM manquants');
  }
}

// Test API direct
async function testChatAPI() {
  console.log('🚀 TEST API CHAT DIRECT');
  
  const authToken = localStorage.getItem('agenticforge-ui-store') || 
                   localStorage.getItem('authToken') || 
                   'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
  const sessionId = localStorage.getItem('agenticForgeSessionId') || 
                    `test-${Date.now()}`;
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        prompt: 'test direct API call'
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('✅ OK:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📋 Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('🚨 Exception:', error);
  }
}

// Test chat complet avec SSE
async function testFullChat() {
  console.log('🚀 TEST CHAT COMPLET AVEC SSE');
  
  const authToken = 'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';
  const sessionId = `test-${Date.now()}`;
  
  try {
    // 1. Envoyer le message
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        prompt: 'dis moi bonjour en français'
      })
    });
    
    const result = await response.json();
    console.log('✅ Message envoyé, jobId:', result.jobId);
    
    // 2. Écouter la réponse en SSE
    const streamUrl = `/api/chat/stream/${result.jobId}?auth=${encodeURIComponent(authToken)}&sessionId=${encodeURIComponent(sessionId)}`;
    console.log('🌐 Connexion SSE:', streamUrl);
    
    const eventSource = new EventSource(streamUrl);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connecté !');
    };
    
    eventSource.onmessage = (event) => {
      console.log('📨 MESSAGE REÇU:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'agent_response') {
          console.log('🤖 RÉPONSE AGENT:', data.content);
        } else if (data.type === 'close') {
          console.log('🔚 Stream fermé par le serveur');
          eventSource.close();
        }
      } catch (e) {
        // Message non-JSON (heartbeat)
      }
    };
    
    eventSource.onerror = (error) => {
      console.log('❌ Erreur SSE:', error);
      eventSource.close();
    };
    
    // Fermer après 30 secondes
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
        console.log('🔚 Test terminé après 30s');
      }
    }, 30000);
    
  } catch (error) {
    console.log('🚨 Exception:', error);
  }
}

// Arrêter la surveillance
function stopDiagnostic() {
  // Restaurer fetch original si il existe
  if (window.originalFetch) {
    window.fetch = window.originalFetch;
    console.log('🔄 Surveillance fetch arrêtée');
  }
}

// Event listeners pour détecter les clics
document.addEventListener('click', function(e) {
  if (e.target.matches('button[aria-label="Send message"]')) {
    console.log('🎯 CLIC DÉTECTÉ sur le bouton Send!');
    const textarea = document.querySelector('textarea[name="user-input"]');
    console.log('📝 Contenu textarea:', textarea ? textarea.value : 'non trouvée');
  }
}, true);

console.log('\n💡 SCRIPT CHARGÉ! Fonctions disponibles:');
console.log('📝 runDiagnostic() - diagnostic complet');
console.log('📝 testSendMessage() - test envoi programmatique');
console.log('📝 testChatAPI() - test API simple');
console.log('🎯 testFullChat() - TEST CHAT COMPLET AVEC RÉPONSE !');