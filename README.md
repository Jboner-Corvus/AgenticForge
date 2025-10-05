<p align="center">
  <img src="assets/title.png" alt="AgentMCP Logo" width="250">
</p>

<h1 align="center">AgentMCP</h1>
<p align="center">
  <strong>🌐 Langues disponibles</strong><br>
  <a href="README_EN.md">English</a> • 
  <a href="README.md">Français</a> • 
  <a href="README_CHS.md">中文</a> • 
  <a href="README_CHT.md">繁體中文</a> • 
  <a href="README_JP.md">日本語</a> • 
  <a href="README_PTBR.md">Português (Brasil)</a> • 
  <a href="README_ES.md">Español</a>
</p> 
<h3 align="center">
      Votre nouvel agent IA 100% autonome, gratuit et local
</h3>

<p align="center">
  <em>
     Automatisez vos opérations en toute confiance. AgentMCP orchestre des sous-agents spécialisés, vous permettant de visualiser chaque outil MCP en temps réel dans le canevas. Regardez vos idées prendre vie instantanément. Grâce au basculement MCP intelligent, profitez d'une continuité sans interruption. L'IA souveraine est là. Saurez-vous la maîtriser ?
  </em>
</p>
<br>
<p align="center">
    <a href="https://discord.gg/VNtXQByKfg"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/MCP-000000?style=for-the-badge&logoColor=white" alt="MCP">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
</p>

## Pourquoi AgentMCP ?

🔒 **Entièrement Local et Privé** - Tout fonctionne sur votre machine — pas de cloud, pas de partage de données. Vos fichiers, conversations et outils restent privés.

🛠️ **Auto-Forge d'Outils MCP** - AgentMCP code directement des outils MCP personnalisés en TypeScript avec schémas Zod, les intègre au worker en temps réel et les affiche dans l'interface graphique avec transparence totale.

💰 **Fonctionnement Gratuit Prolongé** - Grâce à une astuce de gestion de clés, notamment avec Qwen, AgentMCP peut fonctionner en continu pendant plusieurs jours sans frais.

🤖 **Contrôle de Sous-Agents** - Capable d'orchestrer et de contrôler d'autres agents en ligne de commande (CLI) pour déléguer et paralléliser des tâches complexes.

💻 **Assistant de Codage Autonome** - Besoin de code ? Il peut écrire, déboguer et exécuter des programmes en Python, TypeScript, Bash et plus — sans supervision.

🧠 **Sélection Intelligente d'Outils** - Vous demandez, il trouve automatiquement le meilleur outil pour le travail. Comme avoir une forge d'experts prêts à aider.

📋 **Planifie et Exécute des Tâches Complexes** - De la gestion de fichiers au scraping web — il peut diviser les grandes tâches en étapes et forger les outils pour accomplir le travail.

🌐 **Navigation Web Intelligente** - AgentMCP peut naviguer sur internet de manière autonome — rechercher, lire, extraire des infos, automatiser des tâches — le tout sans intervention.

🔄 **LlmKeyManager Intelligent** - Système de gestion avancé des clés API avec basculement automatique, monitoring de performance et désactivation temporaire des clés défaillantes.

🚀 **Forge MCP Native** - Utilise le protocole MCP avec FastMCP pour créer, modifier et déployer des outils personnalisés en temps réel. Chaque outil est codé, testé et intégré automatiquement au worker. Les outils créés avec MCP sont directement accessibles pour un agent n8n.

---

## 🛠️ ⚠️ Travail Actif en Cours

🙏 Ce projet a commencé pour prouver que MCP était mieux que API et a grandi au-delà des attentes. Les contributions, commentaires et patience sont profondément appréciés alors que nous forgeons de l'avant.

---

## 📋 Prérequis

**Requis pour l'installation :**

- **Docker Engine & Docker Compose** : Pour les services principaux
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommandé) : Windows | Mac | Linux
  - Ou [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+** : Pour le build et le worker local
  - [Télécharger Node.js](https://nodejs.org/)
- **pnpm** : Gestionnaire de paquets
  ```bash
  npm install -g pnpm
  ```
- **Git** : Pour cloner le projet

### 🖥️ Compatibilité Système

> **AgentMCP** est conçu pour être déployé sur **Linux** ou **macOS**.  
> **Windows n'est pas officiellement supporté**.

---

## 🚀 Installation Production

### 🤖 Installation Ultra-Simple (100% Automatique)

**Option 1: Installation en une ligne**

```bash
curl -fsSL https://raw.githubusercontent.com/Jboner-Corvus/AgenticForge/main/install.sh | bash
```

**Option 2: Installation classique**

```bash
# 1. Cloner le projet
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Installation complètement automatisée
chmod +x run.sh
./run.sh install
```

**Option 3: Installation interactive**

```bash
# 1. Cloner le projet
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Lancer la console de gestion AgentMCP
chmod +x run.sh
./run.sh
```

**Console de Gestion Production :**

```
    ╔══════════════════════════════════╗
    ║           A G E N T M C P        ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & Services
    1) 🟢 Start Services            5) 📊 Worker Logs
    2) 🔄 Restart All               6) 🐚 Container Shell
    3) 🔴 Stop Services              7) 🔨 Rebuild All
    4) ⚡ Status                    8) 🐳 Docker Logs

    Testing & Quality
    9) 🔬 Unit Tests Only           12) 🔍 Lint Code
   10) 🔗 Integration Tests         13) ✨ Format Code
   11) 🧪 All Tests                14) 📘 Type Check

   15) 🚪 Exit
```

**Choisissez "1) 🟢 Start Services" pour l'installation automatique**

**🔧 Au premier démarrage, le système :**

- Crée automatiquement le fichier `.env` avec des valeurs par défaut
- Installe les dépendances pnpm nécessaires
- Build les packages core et UI
- Lance tous les services Docker
- Configure l'environnement de production

## ⚙️ Configuration Rapide

### Configuration Initiale

Au premier démarrage, le fichier `.env` est créé avec des valeurs par défaut. Vous pouvez y définir votre première clé API pour un démarrage rapide.

```
# === CONFIGURATION AgentMCP ===

# Ports d'accès
PUBLIC_PORT=8080          # API et serveur principal
WEB_PORT=3002            # Interface utilisateur

# Base de données et cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""        # Laissez vide pour un usage local

# Intelligence Artificielle - Clé de démarrage
LLM_API_KEY="votre_cle_api_preferee"
LLM_PROVIDER="gemini"          # ou "openai", "anthropic", "grok", "qwen", etc.
LLM_MODEL_NAME="gemini-2.5-pro"   # Modèle correspondant au provider
LLM_API_BASE_URL=""            # Optionnel, auto-détecté si non fourni
QWEN_API_BASE_URL="https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"  # Pour le fournisseur Qwen

# Sécurité
AUTH_TOKEN="$(openssl rand -hex 32)"     # Généré automatiquement

# Environnement
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 Gestion Multi-Clés API via l'Interface Web

AgentMCP intègre un **LlmKeyManager** puissant pour une gestion centralisée et dynamique de vos clés API, accessible directement depuis l'interface web.

1.  **Accédez à l'interface** : Ouvrez votre navigateur sur [http://localhost:3002](http://localhost:3002).
2.  **Allez dans le "LLM Key Manager"** : Utilisez le menu pour naviguer vers la page de gestion des clés.

#### Fonctionnalités du LlmKeyManager :

- **Ajout/Suppression de Clés en Temps Réel** : Ajoutez ou supprimez des clés API pour différents fournisseurs (OpenAI, Gemini, Anthropic, etc.) sans redémarrer le système.
- **Activation/Désactivation** : Activez ou désactivez des clés à la volée.
- **Basculement Automatique (Failover)** : Si une clé API échoue (limite de requêtes atteinte, erreur), le système bascule automatiquement sur la prochaine clé valide pour garantir une continuité de service.
- **Monitoring et Statistiques** : Suivez l'utilisation de vos clés, le nombre de clés actives, et le nombre de fournisseurs configurés.
- **Tests de Validité** : Testez la validité de chaque clé directement depuis l'interface.

#### Ajout de Clés Supplémentaires

1. **Via l'Interface Web** : [localhost:3002](http://localhost:3002) → Onglet "Clés API"
2. **Fonctionnalités** :
   - ✅ Ajout/suppression de clés en temps réel
   - ✅ Basculement automatique en cas d'erreur

#### Configuration du Fournisseur Qwen

Pour utiliser le fournisseur Qwen, vous devez :

1. Obtenir une clé API depuis [Qwen Portal](https://portal.qwen.ai/)
2. Configurer les variables d'environnement suivantes :

```
LLM_PROVIDER=qwen
LLM_MODEL_NAME=qwen3-coder-plus
LLM_API_KEY=votre_cle_api_qwen
QWEN_API_BASE_URL=https://portal.qwen.ai/v1/chat/completions

```

Consultez le fichier [docs/QWEN_PROVIDER.md](docs/QWEN_PROVIDER.md) pour plus de détails sur la configuration et le dépannage du fournisseur Qwen.

### 🔧 Outils de Dépannage Qwen

Des scripts utilitaires sont disponibles pour diagnostiquer et résoudre les problèmes de connexion Qwen :

- `scripts/diagnose-qwen-connection.ts` - Diagnostic complet des connexions
- `scripts/validate-qwen-key.ts` - Validation des clés API
- `scripts/test-qwen-provider.ts` - Test de base du fournisseur

Pour exécuter ces scripts :

```bash
cd /chemin/vers/AgentMCP
ts-node scripts/diagnose-qwen-connection.ts
```

Consultez [QWEN_OPTIMIZATION_SUMMARY.md](QWEN_OPTIMIZATION_SUMMARY.md) pour un résumé complet des améliorations apportées au fournisseur Qwen.

---

## 🤖 Configuration IA

### Option 1 : API Cloud (Recommandée pour débuter)

| Fournisseur    | Modèles Recommandés (2025)           | Point d'accès / Clé API                                      |
| :------------- | :----------------------------------- | :----------------------------------------------------------- |
| **Google AI**  | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com/keys](https://aistudio.google.com/keys) |
| **Qwen**       | `qwen-coder-plus`                    | [portal.qwen.ai](https://portal.qwen.ai/)                    |
| **OpenAI**     | `gpt-5`                              | [platform.openai.com](https://platform.openai.com/signup)    |
| **X AI**       | `grok-4`                             | [x.ai](https://x.ai/)                                        |
| **OpenRouter** | `z-ai/glm-4.5-air:free`              | [openrouter.ai](https://openrouter.ai/keys)                  |

### Option 2 : IA Locale (Pour la confidentialité)

#### Ollama

1. **Installer Ollama** : [ollama.ai](https://ollama.ai/)
2. **Télécharger un modèle** :
   ```bash
   ollama pull deepseek-r1:14b  # Recommandé pour la plupart des tâches
   ollama serve
   ```

#### LM Studio

1. **Installer LM Studio** : [lmstudio.ai](https://lmstudio.ai/)
2. **Télécharger un modèle** et démarrer le serveur local
3. **Configuration** :
   ```env
   LLM_PROVIDER="openai"
   LLM_API_BASE_URL="http://localhost:1234/v1"
   LLM_API_KEY="lm-studio"  # Valeur quelconque
   LLM_MODEL_NAME="votre-modele-local"
   ```

**Note** : Le système détecte automatiquement les serveurs locaux

---

## 🚀 Gestion du Système

### Console de Gestion Interactive

```bash
# Accéder à toutes les fonctionnalités via la console
./run.sh
```


### Gestion Système Avancée

| Action               | Commande                  | Utilisation                     |
| -------------------- | ------------------------- | ------------------------------- |
| **Console Complète** | `./run.sh`                | Interface de gestion principale |
| **Démarrage Rapide** | `./run.sh start`          | Lancement direct du système     |
| **Monitoring**       | `./run.sh status`         | État des services Docker        |
| **Logs Live**        | `./run.sh logs`           | Surveillance temps réel         |
| **Redémarrage**      | `./run.sh restart`        | Après modification config       |
| **Maintenance**      | `./run.sh` → Options 7-14 | Tests, lint, format, rebuild    |

---

## ⚙️ Architecture Production

### Stack Technique

- **🧠 Serveur Principal** : API REST, orchestration IA, gestion des sessions
- **🌐 Interface Web** : Application React avec streaming temps réel
- **💾 Redis** : Cache haute performance et message broker
- **🗄️ PostgreSQL** : Stockage persistant des sessions et outils
- **🐳 Docker Compose** : Orchestration complète des services
- **📊 OpenTelemetry** : Observabilité et monitoring

### Processus de Forge d'Outils

1. **Analyse** → L'IA comprend le besoin utilisateur
2. **Conception** → Génération du code TypeScript/Python
3. **Validation** → Tests automatiques et vérification
4. **Intégration** → Ajout au catalogue d'outils
5. **Exécution** → Disponible instantanément dans l'interface

---

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour les détails.

---

## Remerciements

- **[FastMCP](https://github.com/punkpeye/fastmcp)** : Framework MCP ultra-performant - la fusée qui propulse AgentMCP 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** : Protocole révolutionnaire pour l'interaction avec les LLMs
- **[Docker](https://docker.com)** : Conteneurisation et isolation
- **[Redis](https://redis.io)** : Structures de données haute performance
- **[Playwright](https://playwright.dev)** : Automatisation web moderne
- **Communauté Open Source** : Pour l'inspiration et la collaboration

---

## Support

- **🚨 Issues** : [GitHub Issues](https://github.com/votre-username/agentmcp/issues)
- **💬 Discussions** : [GitHub Discussions](https://github.com/votre-username/agentmcp/discussions)
- **📚 Documentation** : [Wiki du Projet](https://github.com/votre-username/agentmcp/wiki)
- **🎮 Discord** : [Rejoignez la communauté](https://discord.gg/VNtXQByKfg) - _Partagez vos créations, obtenez de l'aide en temps réel et découvrez les dernières nouveautés en avant-première_

---

<div align="center">

**🔨 Un forgeron forge ses marteaux.** **🤖 AgentMCP forge ses propres capacités.**

_Forgez votre avenir technologique._

[![Commencer](https://img.shields.io/badge/🚀_Commencer-brightgreen?style=for-the-badge)](./run.sh)

</div>
