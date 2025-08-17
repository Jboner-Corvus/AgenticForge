# 🤖 GUIDE DE CONFIGURATION POUR L'AGENT IA

## 📍 Fichier Principal
Le fichier de configuration principal est : **`.env`** (dans ce répertoire)

## 🔧 Comment Modifier la Configuration

### 1. Pour changer le modèle IA :
```bash
# Modifiez ces lignes dans le .env :
LLM_PROVIDER=openai                 # ou anthropic, qwen, google, etc.
LLM_MODEL_NAME=gpt-4               # ou claude-3-opus, qwen3-coder-plus, etc.
LLM_API_KEY=votre_nouvelle_clé
```

### 2. Pour changer les ports :
```bash
PUBLIC_PORT=8080       # Port principal du serveur
WEB_PORT=3002         # Port de l'interface web
```

### 3. Après toute modification :
```bash
./run.sh restart
```

## 🚨 Variables Critiques

### AUTH_TOKEN
- **UNE SEULE** variable d'authentification pour tout le système
- Partagée automatiquement entre backend et frontend via Vite
- Si manquante ou incorrecte, erreur 401 Unauthorized

### LLM_API_KEY
- Clé d'accès au modèle IA
- Spécifique au provider choisi
- Gardez-la secrète

## 🗂️ Structure des Sections

1. **🌐 RÉSEAU & PORTS** - Configuration des ports
2. **🔐 AUTHENTIFICATION** - Tokens d'accès
3. **🧠 LLM** - Configuration du modèle IA
4. **🗄️ POSTGRESQL** - Base de données
5. **🔴 REDIS** - Cache et messages
6. **🛠️ SYSTÈME** - Paramètres d'environnement
7. **📁 CHEMINS** - Répertoires de travail
8. **🌍 FRONTEND** - Variables Vite
9. **📝 OPTIONNELLES** - Variables facultatives

## 🔄 Redémarrage Requis
Après modification du `.env`, redémarrez avec :
```bash
./run.sh restart
```

## 📋 Validation
Vérifiez que les services démarrent correctement :
- Backend : http://localhost:8080/api/health
- Frontend : http://localhost:3002