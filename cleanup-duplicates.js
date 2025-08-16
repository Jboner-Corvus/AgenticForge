#!/usr/bin/env node

/**
 * Script de nettoyage des doublons dans Redis
 * Supprime les clés LLM dupliquées en gardant la plus récente
 */

const Redis = require('redis');

async function cleanupDuplicates() {
  const client = Redis.createClient({ host: 'localhost', port: 6379 });
  
  try {
    await client.connect();
    console.log('Connecté à Redis');
    
    // Récupérer toutes les clés LLM
    const keys = await client.keys('llm:keys:*');
    console.log(`Trouvé ${keys.length} clés au total`);
    
    const keyData = [];
    
    // Récupérer toutes les données
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          keyData.push({ redisKey: key, ...parsed });
        } catch (e) {
          console.warn(`Impossible de parser ${key}`);
        }
      }
    }
    
    // Grouper par combinaison unique (providerId + keyName + keyValue)
    const groups = {};
    keyData.forEach(item => {
      const uniqueKey = `${item.providerId}-${item.keyName}-${item.keyValue}`;
      if (!groups[uniqueKey]) {
        groups[uniqueKey] = [];
      }
      groups[uniqueKey].push(item);
    });
    
    // Identifier et supprimer les doublons
    let deletedCount = 0;
    for (const [uniqueKey, items] of Object.entries(groups)) {
      if (items.length > 1) {
        console.log(`Doublons trouvés pour ${uniqueKey}: ${items.length} copies`);
        
        // Trier par date de création (garder le plus récent)
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Supprimer tous sauf le premier (le plus récent)
        for (let i = 1; i < items.length; i++) {
          await client.del(items[i].redisKey);
          console.log(`Supprimé: ${items[i].redisKey}`);
          deletedCount++;
        }
      }
    }
    
    console.log(`Nettoyage terminé. ${deletedCount} doublons supprimés.`);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.quit();
  }
}

// Exécuter le script
if (require.main === module) {
  cleanupDuplicates().catch(console.error);
}

module.exports = cleanupDuplicates;