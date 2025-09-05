#!/bin/bash

# Charger les variables d'environnement depuis le fichier .env
if [ -f ".env" ]; then
    while IFS='=' read -r key value; do
        # Ignorer les lignes vides et les commentaires
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        # Supprimer les espaces autour de la clé et de la valeur
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        # Exporter la variable si elle n'est pas vide
        [ -n "$key" ] && export "$key=$value"
    done < .env
fi

# Liste des clés à tester depuis les variables d'environnement
KEYS=()

# Ajouter les clés disponibles depuis les variables d'environnement
[ -n "$LLM_API_KEY" ] && KEYS+=("$LLM_API_KEY")
[ -n "$LLM_API_KEY_GEMINI_FLASH_2" ] && KEYS+=("$LLM_API_KEY_GEMINI_FLASH_2")
[ -n "$LLM_API_KEY_GEMINI_PRO_2" ] && KEYS+=("$LLM_API_KEY_GEMINI_PRO_2")
[ -n "$LLM_API_KEY_GEMINI_FLASH_3" ] && KEYS+=("$LLM_API_KEY_GEMINI_FLASH_3")
[ -n "$LLM_API_KEY_GEMINI_PRO_3" ] && KEYS+=("$LLM_API_KEY_GEMINI_PRO_3")
[ -n "$LLM_API_KEY_GEMINI_FLASH_4" ] && KEYS+=("$LLM_API_KEY_GEMINI_FLASH_4")
[ -n "$LLM_API_KEY_GEMINI_PRO_4" ] && KEYS+=("$LLM_API_KEY_GEMINI_PRO_4")
[ -n "$GEMINI_API_KEY" ] && KEYS+=("$GEMINI_API_KEY") # Fallback pour compatibilité

# Vérifier qu'il y a des clés à tester
if [ ${#KEYS[@]} -eq 0 ]; then
    echo "❌ Aucune clé Gemini trouvée dans les variables d'environnement"
    echo "   Vérifiez que le fichier .env contient des clés valides"
    exit 1
fi

echo "🔍 Testing Gemini API keys with curl..."
echo

for key in "${KEYS[@]}"; do
    echo "Testing key: ${key:0:15}..."

    # Test avec l'API Gemini
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -H "Content-Type: application/json" \
        -X POST \
        -d '{
            "contents": [{
                "parts": [{
                    "text": "Hello, test message"
                }]
            }]
        }' \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$key")

    # Extraire le status HTTP
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')

    if [ "$http_status" = "200" ]; then
        echo "✅ Key ${key:0:15}... is VALID"
    else
        echo "❌ Key ${key:0:15}... is INVALID (HTTP $http_status)"
        echo "   Error: $(echo "$response_body" | jq -r '.error.message // "Unknown error"' 2>/dev/null || echo "$response_body" | head -1)"
    fi

    echo
    # Petit délai entre les tests pour éviter le rate limiting
    sleep 2
done

echo "📝 Test completed. Invalid keys need to be replaced with valid Gemini API keys."
echo "💡 Get new keys from: https://makersuite.google.com/app/apikey"