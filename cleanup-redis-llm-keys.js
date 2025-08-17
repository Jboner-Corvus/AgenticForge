#!/usr/bin/env node

const redis = require('redis');

async function cleanupLLMKeys() {
    console.log('🧹 Nettoyage des clés LLM dupliquées dans Redis...');
    
    const client = redis.createClient({
        host: 'localhost',
        port: 6379
    });
    
    try {
        await client.connect();
        console.log('✅ Connecté à Redis');
        
        // Récupérer toutes les clés LLM
        const allKeys = await client.lRange('llmApiKeys', 0, -1);
        console.log(`📋 Nombre total d'entrées: ${allKeys.length}`);
        
        if (allKeys.length === 0) {
            console.log('ℹ️ Aucune clé trouvée');
            return;
        }
        
        // Analyser et dédupliquer
        const uniqueKeys = new Map();
        const seenKeys = new Set();
        
        for (const keyStr of allKeys) {
            try {
                const keyObj = JSON.parse(keyStr);
                const uniqueId = `${keyObj.apiProvider}-${keyObj.apiKey}-${keyObj.apiModel || 'default'}`;
                
                if (!seenKeys.has(uniqueId)) {
                    seenKeys.add(uniqueId);
                    uniqueKeys.set(uniqueId, keyObj);
                    console.log(`✅ Clé unique trouvée: ${keyObj.apiProvider} (${keyObj.apiModel || 'default'})`);
                } else {
                    console.log(`🔄 Duplicata ignoré: ${keyObj.apiProvider} (${keyObj.apiModel || 'default'})`);
                }
            } catch (error) {
                console.error('❌ Erreur lors du parsing:', error.message);
            }
        }
        
        console.log(`\n📊 Résumé:`);
        console.log(`   - Entrées avant: ${allKeys.length}`);
        console.log(`   - Entrées uniques: ${uniqueKeys.size}`);
        console.log(`   - Doublons supprimés: ${allKeys.length - uniqueKeys.size}`);
        
        if (uniqueKeys.size < allKeys.length) {
            console.log('\n🧹 Nettoyage en cours...');
            
            // Supprimer l'ancienne liste
            await client.del('llmApiKeys');
            console.log('🗑️ Ancienne liste supprimée');
            
            // Recréer avec les clés uniques
            if (uniqueKeys.size > 0) {
                const uniqueKeyStrings = Array.from(uniqueKeys.values()).map(key => JSON.stringify(key));
                await client.lPush('llmApiKeys', ...uniqueKeyStrings);
                console.log(`✅ Nouvelle liste créée avec ${uniqueKeys.size} clés uniques`);
            }
            
            // Vérification
            const newCount = await client.lLen('llmApiKeys');
            console.log(`🔍 Vérification: ${newCount} clés dans la nouvelle liste`);
        } else {
            console.log('✨ Aucun doublon trouvé - Redis est déjà propre !');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.quit();
        console.log('👋 Déconnecté de Redis');
    }
}

// Exécuter le nettoyage
cleanupLLMKeys().catch(console.error);