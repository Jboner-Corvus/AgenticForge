#!/bin/bash

# Script de monitoring et auto-réparation Redis
# Usage: ./redis-monitor.sh

REDIS_CONTAINER="g_forge_redis"
REDIS_PORT="6379"
MAX_RETRIES=3
RESTART_DELAY=5

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_redis_health() {
    log "Vérification santé Redis..."

    # Test 1: Conteneur running?
    if ! docker ps | grep -q $REDIS_CONTAINER; then
        log "❌ Conteneur Redis arrêté"
        return 1
    fi

    # Test 2: Port accessible?
    if ! nc -z localhost $REDIS_PORT 2>/dev/null; then
        log "❌ Port $REDIS_PORT inaccessible"
        return 1
    fi

    # Test 3: Redis répond au ping?
    if ! redis-cli ping >/dev/null 2>&1; then
        log "❌ Redis ne répond pas au ping"
        return 1
    fi

    log "✅ Redis en bonne santé"
    return 0
}

restart_redis() {
    log "🔄 Redémarrage Redis..."

    # Arrêt forcé
    docker stop $REDIS_CONTAINER 2>/dev/null || true
    docker rm $REDIS_CONTAINER 2>/dev/null || true

    # Démarrage avec configuration robuste
    docker run -d \
        --name $REDIS_CONTAINER \
        --restart always \
        -p $REDIS_PORT:6379 \
        -v redis_data:/data \
        -v $(pwd)/../redis/redis.conf:/usr/local/etc/redis/redis.conf:ro \
        --memory=512m \
        --memory-swap=512m \
        redis:7.2-alpine \
        redis-server /usr/local/etc/redis/redis.conf

    # Attendre démarrage
    sleep $RESTART_DELAY

    if check_redis_health; then
        log "✅ Redis redémarré avec succès"
        return 0
    else
        log "❌ Échec du redémarrage Redis"
        return 1
    fi
}

# Monitor principal
retries=0

while [ $retries -lt $MAX_RETRIES ]; do
    if check_redis_health; then
        log "✅ Monitor Redis: OK"
        retries=0
    else
        retries=$((retries + 1))
        log "⚠️ Erreur Redis (tentative $retries/$MAX_RETRIES)"

        if [ $retries -le $MAX_RETRIES ]; then
            if restart_redis; then
                retries=0
            else
                log "❌ Impossible de redémarrer Redis"
                exit 1
            fi
        fi
    fi

    sleep 30
done