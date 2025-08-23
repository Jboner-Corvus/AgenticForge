<p align="center">
  <img src="assets/title.png" alt="G-Forge Logo" width="250">
</p>

<h1 align="center">AgenticForge</h1>
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
     Votre IA privée qui ne vous trahit jamais. Orchestrez des sous-agents spécialisés, visualisez chaque outil MCP en temps réel dans le canvas, et regardez vos idées prendre vie instantanément. Basculement API intelligent, zéro interruption. L'IA souveraine est là - la maîtriserez-vous ?
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

## Pourquoi AgenticForge ?

🔒 **Entièrement Local et Privé** - Tout fonctionne sur votre machine — pas de cloud, pas de partage de données. Vos fichiers, conversations et outils restent privés.

🛠️ **Auto-Forge d'Outils MCP** - AgenticForge code directement des outils MCP personnalisés en TypeScript avec schémas Zod, les intègre au worker en temps réel et les affiche dans l'interface avec transparence totale.

💰 **Fonctionnement Gratuit Prolongé** - Grâce à une astuce de gestion de clés, notamment avec Qwen, AgenticForge peut fonctionner en continu pendant plusieurs jours sans frais.

🤖 **Contrôle de Sous-Agents** - Capable d'orchestrer et de contrôler d'autres agents en ligne de commande (CLI) pour déléguer et paralléliser des tâches complexes.

💻 **Assistant de Codage Autonome** - Besoin de code ? Il peut écrire, déboguer et exécuter des programmes en Python, TypeScript, Bash et plus — sans supervision.

🧠 **Sélection Intelligente d'Outils** - Vous demandez, il trouve automatiquement le meilleur outil pour le travail. Comme avoir une forge d'experts prêts à aider.

📋 **Planifie et Exécute des Tâches Complexes** - De la gestion de fichiers au scraping web — il peut diviser les grandes tâches en étapes et forger les outils pour accomplir le travail.

🌐 **Navigation Web Intelligente** - AgenticForge peut naviguer sur internet de manière autonome — rechercher, lire, extraire des infos, automatiser des tâches — le tout sans intervention.

🔄 **LlmKeyManager Intelligent** - Système de gestion avancé des clés API avec basculement automatique, monitoring de performance et désactivation temporaire des clés défaillantes.

🚀 **Forge MCP Native** - Utilise le protocole MCP avec FastMCP pour créer, modifier et déployer des outils personnalisés en temps réel. Chaque outil est codé, testé et intégré automatiquement au worker.

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

> **AgenticForge** est conçu pour être déployé sur **Linux** ou **macOS**.  
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
chmod +x run-v2.sh
./run-v2.sh install
```

**Option 3: Installation interactive**
```bash
# 1. Cloner le projet
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Lancer la console de gestion AgenticForge
chmod +x run-v2.sh
./run-v2.sh
```

**Console de Gestion Production :**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
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

```env
# === CONFIGURATION AGENTIC FORGE ===

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

AgenticForge intègre un **LlmKeyManager** puissant pour une gestion centralisée et dynamique de vos clés API, accessible directement depuis l'interface web.

1.  **Accédez à l'interface** : Ouvrez votre navigateur sur [http://localhost:3002](http://localhost:3002).
2.  **Allez dans le "LLM Key Manager"** : Utilisez le menu pour naviguer vers la page de gestion des clés.

#### Fonctionnalités du LlmKeyManager :

-   **Ajout/Suppression de Clés en Temps Réel** : Ajoutez ou supprimez des clés API pour différents fournisseurs (OpenAI, Gemini, Anthropic, etc.) sans redémarrer le système.
-   **Activation/Désactivation** : Activez ou désactivez des clés à la volée.
-   **Basculement Automatique (Failover)** : Si une clé API échoue (limite de requêtes atteinte, erreur), le système bascule automatiquement sur la prochaine clé valide pour garantir une continuité de service.
-   **Monitoring et Statistiques** : Suivez l'utilisation de vos clés, le nombre de clés actives, et le nombre de fournisseurs configurés.
-   **Tests de Validité** : Testez la validité de chaque clé directement depuis l'interface.

#### Ajout de Clés Supplémentaires
1. **Via l'Interface Web** : [localhost:3002](http://localhost:3002) → Onglet "Clés API"
2. **Fonctionnalités** :
   - ✅ Ajout/suppression de clés en temps réel
   - ✅ Basculement automatique en cas d'erreur

#### Configuration du Fournisseur Qwen

Pour utiliser le fournisseur Qwen, vous devez :

1. Obtenir une clé API depuis [Qwen Portal](https://portal.qwen.ai/)
2. Configurer les variables d'environnement suivantes :

``env
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
cd /chemin/vers/AgenticForge
ts-node scripts/diagnose-qwen-connection.ts
```

Consultez [QWEN_OPTIMIZATION_SUMMARY.md](QWEN_OPTIMIZATION_SUMMARY.md) pour un résumé complet des améliorations apportées au fournisseur Qwen.

---

## 🤖 Configuration IA

### Option 1 : API Cloud (Recommandée pour débuter)

| Fournisseur | Modèles Recommandés (2025) | Obtenir une clé API |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `gemini-2.5-flash` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-4o`, `gpt-4.1` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-4-opus`, `claude-4-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-v3`, `deepseek-r1` | [platform.deepseek.com](https://platform.deepseek.com) |

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
./run-v2.sh
```

### Commandes Production Rapides

```bash
# Démarrage complet
./run-v2.sh start

# Vérifier le statut des services
./run-v2.sh status

# Voir les logs système
./run-v2.sh logs

# Redémarrer après modification config
./run-v2.sh restart

# Arrêt propre du système
./run-v2.sh stop
```


### 🔧 Contrôle Qualité Code

Les outils de qualité de code (lint, TypeScript, format) sont intégrés à la console de gestion :

```bash
# Console de gestion complète
./run-v2.sh

# Ou directement :
pnpm run lint      # Vérification qualité code
pnpm run typecheck # Vérification types TypeScript
pnpm run format    # Formatage automatique
```

---

## 🌐 Accès à AgenticForge

### Interfaces Principales

| Interface | URL | Description |
|-----------|-----|-------------|
| **🎨 Interface Web** | [localhost:3002](http://localhost:3002) | Interface principale pour interagir avec l'agent |
| **🛠️ API Server** | [localhost:8080](http://localhost:8080) | API backend et serveur principal |

---

## 🎯 Cas d'Usage et Exemples

### 🚀 Démarrage Rapide

1. **Accédez** à [localhost:3002](http://localhost:3002) 
2. **Testez** la forge d'outils MCP en temps réel :
   ```
   "Crée un outil MCP personnalisé pour analyser les logs système, 
   code-le en TypeScript, l'intègre au worker et teste-le immédiatement"
   ```
3. **Ou testez** l'exécution système directe :
   ```
   "Analyse mon système, crée une API REST dans un nouveau dossier, 
   installe les dépendances avec npm, lance les tests et démarre le serveur"
   ```

### 🔧 Forge d'Outils MCP Personnalisés

#### ⚡ Outils Système Avancés
```bash
"Forge un outil MCP qui monitor en temps réel :
- Code l'outil en TypeScript avec Zod schemas  
- Intègre-le directement au worker AgenticForge
- Interface pour surveiller CPU/RAM/Processus
- Affichage temps réel dans l'interface web
- Test immédiat de toutes les fonctionnalités"
```

#### 🌐 Outils Web Intelligents  
```bash
"Crée un outil MCP de scraping intelligent :
- Génère le code avec gestion des sessions
- Interface Playwright intégrée au worker
- Schémas de validation des données scrapées
- Dashboard en temps réel des résultats
- Stockage automatique en base locale"
```

### 🌐 Applications Full-Stack

#### ⚙️ Automation & Supervision Système
```bash
"Lis ce fichier YAML de configuration, crée un daemon Python qui :
- Monitor les processus système définis
- Exécute les tâches cron automatiquement  
- Envoie les logs vers /var/log/automation.log
- Redémarre les services en cas d'échec
- Lance le daemon avec systemctl --user"
```

### 📊 Outils de Performance

#### 🏃‍♂️ Benchmarking Système Complet
```bash
"Lance un benchmark complet de cette machine :
- Teste CPU/RAM/Disque avec stress-ng
- Benchmark réseau avec iperf3 vers 8.8.8.8
- Mesure les performances de mes APIs locales
- Génère un rapport HTML dans ./benchmarks/
- Compare avec les résultats précédents stockés localement"
```

#### 📚 Documentation Auto-Générée
```bash
"Scan récursivement mon projet, analyse le code source, génère :
- README.md détaillé avec diagrammes d'architecture
- Documentation API avec Swagger/OpenAPI
- Diagrammes de classes UML (avec PlantUML)
- Guide d'installation testé sur cette machine
- Publie tout ça sur un serveur local avec docsify"
```

### 🔧 Gestion de Projet

#### 🌳 Workflows Git avec Déploiement Automatique
```bash
"Configure un workflow Git complet dans ce repo :
- Installe et configure GitFlow avec les hooks
- Crée les scripts pre-commit avec tests auto
- Configure GitHub Actions ou GitLab CI localement  
- Script de déploiement qui build, test et relance les services
- Test le workflow complet avec une feature branch"
```

### 🎯 Projets Spécialisés

#### 🤖 Agent avec Suite d'Outils MCP Custom
```bash
"Clone AgenticForge, crée un agent spécialisé avec ses propres outils MCP :
- Forge 5 outils MCP : monitoring, déploiement, backup, alertes, analytics
- Chaque outil codé en TypeScript avec interfaces Zod complètes
- Interface web sur port 3001 montrant tous les outils en action
- Base SQLite pour persistance + outils MCP pour la gérer
- Test complet de la suite d'outils forgés automatiquement"
```

#### 💻 Administration Système Intelligente  
```bash
"Analyse ce serveur Linux et crée un tableau de bord admin :
- Monitor temps réel : CPU, RAM, disque, réseau
- Gestion des services systemd avec interface web
- Backup automatique des configurations importantes
- Alertes par email/Slack en cas de problème
- Scripts de maintenance programmés
- Interface accessible via nginx sur port 8080"
```

**🔥 Puissance Unique :** 
- **🛠️ Forge MCP** : Crée des outils MCP personnalisés en TypeScript, les intègre au worker et les test immédiatement
- **⚡ Exécution Directe** : Accès système complet - installation, configuration, tests, déploiement automatisés
- **🎯 Transparence Totale** : Visualisez vos outils MCP forgés en action directement dans l'interface web

---

### Gestion Système Avancée

| Action | Commande | Utilisation |
|--------|----------|-----------|
| **Console Complète** | `./run-v2.sh` | Interface de gestion principale |
| **Démarrage Rapide** | `./run-v2.sh start` | Lancement direct du système |
| **Monitoring** | `./run-v2.sh status` | État des services Docker |
| **Logs Live** | `./run-v2.sh logs` | Surveillance temps réel |
| **Redémarrage** | `./run-v2.sh restart` | Après modification config |
| **Maintenance** | `./run-v2.sh` → Options 7-14 | Tests, lint, format, rebuild |

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

- **[FastMCP](https://github.com/punkpeye/fastmcp)** : Framework MCP ultra-performant - la fusée qui propulse G-Forge 🚀
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** : Protocole révolutionnaire pour l'interaction avec les LLMs
- **[Docker](https://docker.com)** : Conteneurisation et isolation
- **[Redis](https://redis.io)** : Structures de données haute performance
- **[Playwright](https://playwright.dev)** : Automatisation web moderne
- **Communauté Open Source** : Pour l'inspiration et la collaboration

---

## Support

- **🚨 Issues** : [GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **💬 Discussions** : [GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **📚 Documentation** : [Wiki du Projet](https://github.com/votre-username/g-forge/wiki)
- **🎮 Discord** : [Rejoignez la communauté](https://discord.gg/VNtXQByKfg) - *Partagez vos créations, obtenez de l'aide en temps réel et découvrez les dernières nouveautés en avant-première*

---

<div align="center">

**🔨 Un forgeron forge ses marteaux.** **🤖 G-Forge forge ses propres capacités.**

_Forgez votre avenir technologique._

[![Commencer](https://img.shields.io/badge/🚀_Commencer-brightgreen?style=for-the-badge)](./run-v2.sh)

</div>
