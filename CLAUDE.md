# AgenticForge - Architecture System

## 🏗️ ARCHITECTURE RÉSEAU

### Ports et Services
- **Port 3001**: Backend API principal (Node.js/Express)
- **Port 3002**: Frontend production (Docker + Nginx proxy)
- **Port ${WEB_PORT}**: Frontend développement (Vite dev server, généralement 3006)

### Configuration Ports
Les ports sont configurés dans `.env`:
- `PORT=3001` - Backend API
- `PUBLIC_PORT=3001` - Port public backend
- `WEB_PORT=3002` - Frontend (variable pour dev server)
- `VITE_BACKEND_PORT=3001` - Port backend pour frontend

## 🧩 COMPOSANTS SYSTÈME

### Backend (packages/core/)
- **Serveur principal**: `server-start.js` (port 3001)
- **Worker**: `worker.js` (traitement des jobs Redis)
- **Base de données**: PostgreSQL (localhost)
- **Cache/Queue**: Redis (localhost:6379)

### Frontend (packages/ui/)
- **Production**: Docker + Nginx (port 3002)
- **Développement**: Vite dev server (port ${WEB_PORT})

### Système de Verrouillage
- **Clés Redis**:
  - `server:singleton:lock` - Empêche multiples serveurs
  - `worker:singleton:lock` - Empêche multiples workers

## 🔧 DÉBOGAGE

### Logs Principaux
- `worker.log` - Logs du worker et traitement des jobs
- `dev-server.log` - Logs du serveur de développement

### Commandes Utiles
```bash
# Vérifier les ports utilisés
ss -tlnp | grep -E ":(3001|3002|3006)"

# Vérifier les processus AgenticForge
ps aux | grep -E "(server-start|worker|vite)"

# Vérifier les verrous Redis
redis-cli KEYS "*lock*"

# Nettoyer les verrous Redis
redis-cli DEL server:singleton:lock worker:singleton:lock
```

### Problèmes Fréquents
1. **Worker utilise `finish` immédiatement**: Vérifier `convertPlainTextToValidJson` dans `agent.ts:1193-1227`
2. **Multiples processus**: Nettoyer avec `pkill` et vérifier les verrous Redis
3. **Ports occupés**: Utiliser `lsof -ti:PORT` pour identifier les processus

## 🚀 DÉMARRAGE

### Backend
```bash
# Backend principal
AUTH_TOKEN="..." PORT=3001 node packages/core/dist/server-start.js

# Worker
AUTH_TOKEN="..." node packages/core/dist/worker.js
```

### Frontend
```bash
# Développement
AUTH_TOKEN="..." VITE_AUTH_TOKEN="..." VITE_BACKEND_PORT=3001 WEB_PORT=3006 pnpm --filter @gforge/ui run start:web

# Production (Docker)
# Disponible sur port 3002
```

## 📝 NOTES IMPORTANTES

- **Token auth**: `AUTH_TOKEN` et `VITE_AUTH_TOKEN` doivent être identiques
- **Compatibilité**: Les interfaces 3002 et 3006 sont compatibles (même backend)
- **Singleton**: Un seul serveur et un seul worker peuvent tourner simultanément
- **Configuration**: Tout est centralisé dans `.env`