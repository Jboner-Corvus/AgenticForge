// Script de diagnostic frontend à coller dans la console du navigateur
// Ouvre la console (F12) et colle ce code pour diagnostiquer

console.log('🔧 DIAGNOSTIC FRONTEND AGENTICFORGE');
console.log('=====================================');

// Test 1: Vérifier les stores Zustand
try {
  // Accéder aux stores directement depuis window (si exposés)
  const stores = Object.keys(window).filter(key => key.includes('store') || key.includes('Store'));
  console.log('📦 Stores trouvés dans window:', stores);
  
  // Tenter d'accéder aux états des stores
  if (window.zustandStores) {
    console.log('🗃️ États des stores Zustand:', window.zustandStores);
  }
} catch (e) {
  console.log('⚠️ Impossible d\'accéder aux stores:', e.message);
}

// Test 2: Vérifier les éléments DOM
const textarea = document.querySelector('textarea[name="user-input"]');
const sendButton = document.querySelector('button[aria-label="Send message"]');

console.log('🎯 Éléments DOM:');
console.log('- Textarea trouvée:', !!textarea);
console.log('- Bouton Send trouvé:', !!sendButton);

if (textarea) {
  console.log('- Textarea disabled:', textarea.disabled);
  console.log('- Textarea value:', textarea.value);
}

if (sendButton) {
  console.log('- Bouton disabled:', sendButton.disabled);
}

// Test 3: Écouter les événements de clic
if (sendButton) {
  sendButton.addEventListener('click', function(e) {
    console.log('🎯 CLIC DÉTECTÉ sur le bouton Send!');
    console.log('- Event:', e);
    console.log('- Textarea value:', textarea ? textarea.value : 'textarea non trouvée');
  });
}

// Test 4: Vérifier localStorage et sessionStorage
console.log('💾 Stockage local:');
console.log('- localStorage authToken:', localStorage.getItem('authToken'));
console.log('- localStorage agenticForgeSessionId:', localStorage.getItem('agenticForgeSessionId'));
console.log('- sessionStorage keys:', Object.keys(sessionStorage));

// Test 5: Vérifier les cookies
console.log('🍪 Cookies:');
console.log('- document.cookie:', document.cookie);

// Test 6: Essayer d'envoyer un message programmatiquement
function testSendMessage() {
  console.log('🧪 TEST: Envoi programmatique d\'un message');
  
  if (textarea && sendButton) {
    // Définir une valeur dans le textarea
    textarea.value = 'test message from console';
    
    // Déclencher l'événement change
    const changeEvent = new Event('change', { bubbles: true });
    textarea.dispatchEvent(changeEvent);
    
    // Déclencher le clic
    setTimeout(() => {
      sendButton.click();
    }, 100);
  } else {
    console.log('❌ Impossible de tester: éléments DOM manquants');
  }
}

// Test 7: Vérifier les erreurs JavaScript
const originalError = console.error;
console.error = function(...args) {
  console.log('🚨 ERREUR JS DÉTECTÉE:', ...args);
  originalError.apply(console, args);
};

console.log('=====================================');
console.log('✅ Diagnostic setup terminé!');
console.log('📝 Pour tester l\'envoi de message, tapez: testSendMessage()');
console.log('🔍 Essaie maintenant d\'envoyer un message manuellement et regarde les logs');