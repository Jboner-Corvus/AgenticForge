#!/usr/bin/env node

// Script de diagnostic pour tester l'authentification backend
console.log('🔍 DIAGNOSTIC AUTHENTIFICATION BACKEND');
console.log('=====================================');

// Test 1: Vérifier les variables d'environnement
console.log('\n📋 Test 1: Variables d\'environnement');
console.log('VITE_AUTH_TOKEN:', process.env.VITE_AUTH_TOKEN || 'NON DÉFINI');
console.log('AUTH_TOKEN:', process.env.AUTH_TOKEN || 'NON DÉFINI');

// Test 2: Tester la connectivité au backend
console.log('\n🌐 Test 2: Connectivité backend');

const testBackendConnection = async () => {
  try {
    const response = await fetch('http://192.168.40.28:3002/api/health');
    console.log('✅ Backend accessible - Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('📄 Réponse health check:', data);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion au backend:', error.message);
    console.log('💡 Vérifiez que le serveur backend fonctionne sur le port 3002');
  }
};

// Test 3: Tester l'authentification
console.log('\n🔐 Test 3: Authentification');

const testAuthentication = async () => {
  try {
    const authToken = process.env.VITE_AUTH_TOKEN || process.env.AUTH_TOKEN || 'test-token-for-development';

    console.log('Token utilisé pour le test:', authToken.substring(0, 20) + '...');

    const response = await fetch('http://192.168.40.28:3002/api/health', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status réponse authentifiée:', response.status);

    if (response.status === 401) {
      console.log('❌ Erreur 401: Token invalide ou manquant');
      console.log('💡 Vérifiez que le token AUTH_TOKEN est correctement configuré');
    } else if (response.ok) {
      console.log('✅ Authentification réussie');
    } else {
      console.log('⚠️ Status inattendu:', response.status);
    }

  } catch (error) {
    console.log('❌ Erreur lors du test d\'authentification:', error.message);
  }
};

// Exécuter les tests
testBackendConnection().then(() => {
  return testAuthentication();
}).then(() => {
  console.log('\n🎯 Diagnostic terminé');
  console.log('=====================================');
});