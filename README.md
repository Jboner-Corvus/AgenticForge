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
    Votre nouvel agent IA 100% autonome, gratuit et local, garantissant une confidentialité totale. Conçu entièrement avec le protocole MCP, il exécute des tâches complexes, écrit du code et forge ses propres outils, qui sont directement affichés dans l'interface utilisateur pour une transparence totale. Grâce à son routeur de clés API intelligent qui suit une hiérarchie configurable, il bascule automatiquement pour ne jamais être à court de requêtes. Prêt à explorer le futur de l'IA privée ?
  </em>
</p>
<br>
<p align="center">
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

💻 **Assistant de Codage Autonome** - Besoin de code ? Il peut écrire, déboguer et exécuter des programmes en Python, TypeScript, Bash et plus — sans supervision.

🧠 **Sélection Intelligente d'Outils** - Vous demandez, il trouve automatiquement le meilleur outil pour le travail. Comme avoir une forge d'experts prêts à aider.

📋 **Planifie et Exécute des Tâches Complexes** - De la gestion de fichiers au scraping web — il peut diviser les grandes tâches en étapes et forger les outils pour accomplir le travail.

🌐 **Navigation Web Intelligente** - AgenticForge peut naviguer sur internet de manière autonome — rechercher, lire, extraire des infos, automatiser des tâches — le tout sans intervention.

🔄 **Routeur de Clés API Intelligent** - Système de hiérarchie configurable qui bascule automatiquement entre plusieurs clés API pour ne jamais être à court de requêtes.

🚀 **Forge MCP Native** - Utilise le protocole MCP avec FastMCP pour créer, modifier et déployer des outils personnalisés en temps réel. Chaque outil est codé, testé et intégré automatiquement au worker.

---

## Démo

> **"Peux-tu créer un outil pour analyser une une cotation boursiere pour en faire le trading?"**

---

## 🛠️ ⚠️ Travail Actif en Cours

🙏 Ce projet a commencé pour prouver que MCP etait mieux que API et a grandi au-delà des attentes. Les contributions, commentaires et patience sont profondément appréciés alors que nous forgeons de l'avant.

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
> **Windows n'est pas officiellement supporté** pour le serveur ou les workers, en raison de dépendances systèmes spécifiques (Docker, shell scripts, etc.).  
> Une version **client léger** pour Windows pourrait être envisagée dans le futur, mais reste **expérimentale**.

---

## 🚀 Installation Production

### Installation Ultra-Simple

```bash
# 1. Cloner le projet
git clone https://github.com/Jboner-Corvus/AgenticForge.git
cd AgenticForge

# 2. Lancer la console de gestion AgenticForge
chmod +x run.sh
./run.sh
```

**Console de Gestion Production :**

```
    ╔══════════════════════════════════╗
    ║        A G E N T I C F O R G E   ║
    ╚══════════════════════════════════╝
──────────────────────────────────────────
    Docker & Services
    1) 🟢 Démarrer            5) 📊 Logs Worker
    2) 🔄 Redémarrer tout     6) 🐚 Shell (Container)
    3) 🔴 Arrêter            7) 🔨 Rebuild Docker
    4) ⚡ Statut             8) 🧹 Nettoyer Docker
    9) 🔄 Redémarrer worker   15) 🐳 Logs Docker
   20) 🔨 Rebuild Worker
   21) 🔨 Rebuild All
   22) 🧹 Clean All Caches

    Développement & Vérifications
   10) 🔍 Lint               13) 📘 TypeCheck
   11) ✨ Format             14) ✅ Checks Rapides
   12) 🧪 Tests (Unitaires)   17) 🚀 TOUS les Checks
   18) 🧪 Tests (Intégration)
   19) 🧪 Lancer TOUS les tests

   16) 🚪 Quitter
```

**Choisissez "1) ⚡ Démarrer" pour l'installation automatique**

**🔧 Au premier démarrage, le système :**
- Crée automatiquement le fichier `.env` avec des valeurs par défaut
- Installe les dépendances pnpm nécessaires  
- Build les packages core et UI
- Lance tous les services Docker
- Configure l'environnement de production

## ⚙️ Configuration Rapide

### Configuration Automatique

Le système créera automatiquement le fichier `.env` avec des valeurs par défaut au premier démarrage.

### Configuration Manuelle

Éditez le fichier `.env` généré automatiquement :

```env
# === CONFIGURATION AGENTIC FORGE ===

# Ports d'accès
PUBLIC_PORT=8080          # API et serveur principal
WEB_PORT=3002            # Interface utilisateur

# Base de données et cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""        # Laissez vide pour un usage local

# Intelligence Artificielle
LLM_API_KEY="votre_cle_api_preferee"
LLM_MODEL_NAME="gemini-2.5-pro"   # ou "gpt-5", "claude-3.5-sonnet"
LLM_API_BASE_URL=""      # Auto-détecté selon le modèle

# Routeur de clés API (pour éviter les limites)
LLM_API_KEY_BACKUP="cle_api_secondaire"     # Optionnel
LLM_API_KEY_TERTIARY="cle_api_tertiaire"   # Optionnel

# Sécurité
AUTH_TOKEN="$(openssl rand -hex 32)"     # Généré automatiquement

# Environnement
NODE_ENV=production
LOG_LEVEL=info
```

### 🔑 Configuration Multi-Clés API

Pour une disponibilité maximale, configurez plusieurs clés API :

```env
# Clé principale
LLM_API_KEY="sk-xxxxxxxxxxxxxxxxx"

# Clés de secours (AgenticForge basculera automatiquement)
LLM_API_KEY_BACKUP="gsk-xxxxxxxxxxxxxxxxx"      # Google AI
LLM_API_KEY_TERTIARY="claude-xxxxxxxxxxxxxxxxx"  # Anthropic

# Le système utilisera automatiquement la hiérarchie : Principale → Backup → Tertiaire
```

---

## 🤖 Configuration IA

### Option 1 : API Cloud (Recommandée pour débuter)

| Fournisseur | Modèles Recommandés | Obtenir une clé API |
|-------------|---------------------|---------------------|
| **Google AI** | `gemini-2.5-pro`, `flash-2.5-pro` | [aistudio.google.com](https://aistudio.google.com/keys) |
| **OpenAI** | `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4o`, `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com/signup) |
| **Anthropic** | `claude-3.5-sonnet` | [console.anthropic.com](https://console.anthropic.com/) |
| **DeepSeek** | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com) |

### Option 2 : IA Locale (Pour la confidentialité)

1. **Installer Ollama** : [ollama.ai](https://ollama.ai/)
2. **Télécharger un modèle** :
   ```bash
   ollama pull deepseek-r1:14b  # Recommandé pour la plupart des tâches
   ollama serve
   ```
3. **Configuration** : Le système détectera automatiquement Ollama

---

## 🚀 Gestion du Système

### Console de Gestion Interactive

```bash
# Accéder à toutes les fonctionnalités via la console
./run.sh
```

### Commandes Production Rapides

```bash
# Démarrage complet
./run.sh start

# Vérifier le statut des services
./run.sh status

# Voir les logs système
./run.sh logs

# Redémarrer après modification config
./run.sh restart

# Arrêt propre du système
./run.sh stop
```

---

## 🌐 Accès à AgenticForge

### Interfaces Principales

| Interface | URL | Description |
|-----------|-----|-------------|
| **🎨 Interface Web** | [localhost:3002](http://localhost:3002) | Interface principale pour interagir avec l'agent |
| **⚡ API** | [localhost:8080](http://localhost:8080) | API REST pour intégrations |
| **❤️ Health** | [localhost:8080/api/health](http://localhost:8080/api/health) | Monitoring système |

### 🎯 Fonctionnalités de l'Interface

- **Chat Intelligent** : Conversation naturelle avec l'agent
- **👁️ Transparence** : Visualisation en temps réel des outils créés
- **⚡ Streaming** : Réponses instantanées
- **📊 Dashboard** : Monitoring des clés API et performances
- **🛠️ Outils** : Catalogue des capacités disponibles

### Test Rapide

```bash
# Vérifier que tout fonctionne
curl http://localhost:8080/api/health
```

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

#### 🗄️ Outils Base de Données Custom
```bash
"Développe un outil MCP pour gérer PostgreSQL :
- Outil avec connexions, requêtes, migrations
- Interface graphique intégrée à AgenticForge  
- Validation des schémas avec Zod
- Export/Import automatique des données
- Déploie et test l'outil en une commande"
```

### 💼 Projets de Développement

#### 🏗️ Refactorisation et Optimisation Système
```bash
"Scan tous mes scripts Python dans /home/projects, identifie ceux qui ont 
des problèmes de performance, refactorise-les automatiquement et exécute 
les tests pour vérifier que tout fonctionne encore"
```

#### 🐳 Conteneurisation Automatique
```bash
"Prends mon projet dans le dossier courant, génère un Dockerfile optimisé,
crée le docker-compose.yml, build l'image et lance le conteneur.
Vérifie que l'application répond correctement sur le port configuré"
```

#### 🗄️ Base de Données et Déploiement Local
```bash
"Crée une base SQLite dans ./data/, initialise le schéma depuis ce fichier SQL,
génère une API CRUD complète, installe les dépendances et lance le serveur.
Teste tous les endpoints avec curl et génère un rapport"
```

### 🌐 Applications Full-Stack

#### 📝 Application Livre d'Or avec Déploiement
```bash
"Crée une app complète dans ./guestbook/ :
- Frontend React + build automatique
- Backend Express + base SQLite
- Lance npm install, build le frontend, démarre le serveur
- Ouvre automatiquement le navigateur sur localhost:3000
- Configure nginx comme reverse proxy local"
```

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

#### 🔍 Scraping et Traitement Local
```bash
"Crée un scraper intelligent qui s'exécute sur cette machine :
- Installe Chrome/Playwright automatiquement
- Scrappe les sites avec rotation d'User-Agent
- Stocke en PostgreSQL local (via Docker)
- Génère des rapports PDF avec des graphiques
- Programme des tâches cron pour l'automatisation
- Dashboard web local pour visualiser les données"
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
| **Console Complète** | `./run.sh` | Interface de gestion principale |
| **Démarrage Rapide** | `./run.sh start` | Lancement direct du système |
| **Monitoring** | `./run.sh status` | État des services Docker |
| **Logs Live** | `./run.sh logs` | Surveillance temps réel |
| **Redémarrage** | `./run.sh restart` | Après modification config |
| **Maintenance** | `./run.sh` → Option 7 | Nettoyage et optimisation |

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

- **Issues** : [GitHub Issues](https://github.com/votre-username/g-forge/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/g-forge/discussions)
- **Documentation** : [Wiki du Projet](https://github.com/votre-username/g-forge/wiki)

---

<div align="center">

**🔨 Un forgeron forge ses marteaux.** **🤖 G-Forge forge ses propres capacités.**

_Forgez votre avenir technologique._

[![Commencer](https://img.shields.io/badge/🚀_Commencer-brightgreen?style=for-the-badge)](./run.sh)

</div>
