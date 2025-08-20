#!/bin/bash

echo "🧹 Nettoyage des clés LLM dupliquées dans Redis..."

# Récupérer le nombre d'entrées actuelles
CURRENT_COUNT=$(docker exec g_forge_redis redis-cli LLEN llmApiKeys)
echo "📋 Nombre actuel d'entrées: $CURRENT_COUNT"

if [ "$CURRENT_COUNT" -eq 0 ]; then
    echo "ℹ️ Aucune clé trouvée"
    exit 0
fi

# Récupérer toutes les clés et les sauvegarder
echo "💾 Sauvegarde des clés existantes..."
docker exec g_forge_redis redis-cli LRANGE llmApiKeys 0 -1 > /tmp/llm_keys_backup.txt

# Extraire une seule copie de chaque clé unique
echo "🔍 Analyse des doublons..."
cat /tmp/llm_keys_backup.txt | sort | uniq > /tmp/llm_keys_unique.txt

UNIQUE_COUNT=$(cat /tmp/llm_keys_unique.txt | wc -l)
echo "✨ Clés uniques trouvées: $UNIQUE_COUNT"
echo "🗑️ Doublons à supprimer: $((CURRENT_COUNT - UNIQUE_COUNT))"

if [ "$UNIQUE_COUNT" -lt "$CURRENT_COUNT" ]; then
    echo "🧹 Nettoyage en cours..."
    
    # Supprimer l'ancienne liste
    docker exec g_forge_redis redis-cli DEL llmApiKeys
    echo "🗑️ Ancienne liste supprimée"
    
    # Recréer avec les clés uniques
    if [ "$UNIQUE_COUNT" -gt 0 ]; then
        while IFS= read -r line; do
            if [ ! -z "$line" ]; then
                docker exec g_forge_redis redis-cli LPUSH llmApiKeys "$line"
            fi
        done < /tmp/llm_keys_unique.txt
        echo "✅ Nouvelle liste créée avec $UNIQUE_COUNT clés uniques"
    fi
    
    # Vérification
    NEW_COUNT=$(docker exec g_forge_redis redis-cli LLEN llmApiKeys)
    echo "🔍 Vérification: $NEW_COUNT clés dans la nouvelle liste"
else
    echo "✨ Aucun doublon trouvé - Redis est déjà propre !"
fi

# Nettoyer les fichiers temporaires
rm -f /tmp/llm_keys_backup.txt /tmp/llm_keys_unique.txt

echo "✅ Nettoyage terminé !"