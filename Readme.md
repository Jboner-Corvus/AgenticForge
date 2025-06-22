# 🔨 Agentic Forge

### Une Alternative a MANUS Privée et Locale

![Agentic Forge Logo](https://img.shields.io/badge/🔨-Agentic_Forge-orange?style=for-the-badge)

**Français** | [English](#english) | [中文](#中文) | [Español](#español)

Un agent IA autonome **100% local** qui forge ses propres outils, écrit du code et exécute des tâches complexes tout en gardant toutes les données sur votre appareil. Basé sur le **protocole MCP (Model Context Protocol)** avec **FastMCP** comme fusée propulsive, il est conçu pour les modèles de raisonnement locaux et adaptable à l'API de votre LLM favori, garantissant une confidentialité complète et aucune dépendance cloud.

[![Licence](https://img.shields.io/badge/Licence-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![GitHub stars](https://img.shields.io/github/stars/votre-username/agentic-forge?style=social)](https://github.com/votre-username/agentic-forge)

---

## Pourquoi Agentic Forge ?

🔒 **Entièrement Local et Privé** - Tout fonctionne sur votre machine — pas de cloud, pas de partage de données. Vos fichiers, conversations et outils restent privés.

🛠️ **Auto-Forge d'Outils** - Agentic Forge peut créer ses propres outils — quand une capacité lui manque, il écrit le code pour la construire.

💻 **Assistant de Codage Autonome** - Besoin de code ? Il peut écrire, déboguer et exécuter des programmes en Python, TypeScript, Bash et plus — sans supervision.

🧠 **Sélection Intelligente d'Outils** - Vous demandez, il trouve automatiquement le meilleur outil pour le travail. Comme avoir une forge d'experts prêts à aider.

📋 **Planifie et Exécute des Tâches Complexes** - De la gestion de fichiers au scraping web — il peut diviser les grandes tâches en étapes et forger les outils pour accomplir le travail.

🌐 **Navigation Web Intelligente** - Agentic Forge peut naviguer sur internet de manière autonome — rechercher, lire, extraire des infos, automatiser des tâches — le tout sans intervention.

🚀 **Propulsé par FastMCP** - Utilise le protocole MCP (Model Context Protocol) avec FastMCP comme framework ultra-performant — une véritable fusée pour les interactions LLM.

---

## Démo

> **"Peux-tu créer un outil pour analyser mes fichiers CSV, puis l'utiliser pour générer un rapport à partir de donnees_ventes.csv ?"**

---

## 🛠️ ⚠️ Travail Actif en Cours

🙏 Ce projet a commencé comme une exploration des agents IA auto-améliorants et a grandi au-delà des attentes. Les contributions, commentaires et patience sont profondément appréciés alors que nous forgeons de l'avant.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir les logiciels suivants installés :

-   **Git** : Pour cloner le dépôt. [Télécharger Git](https://git-scm.com/)
-   **Docker Engine & Docker Compose** : Pour exécuter les services groupés.
    -   [Installer Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclut Docker Compose V2) : Windows | Mac | Linux
    -   Ou installer séparément : [Docker Engine](https://docs.docker.com/engine/install/) | [Docker Compose](https://docs.docker.com/compose/install/)
-   **Node.js 20+** : Pour l'interface web. [Télécharger Node.js](https://nodejs.org/)
-   **pnpm** : Gestionnaire de paquets. Installer avec `npm install -g pnpm`

---

## 1. Cloner le dépôt

```bash
git clone [https://github.com/votre-username/agentic-forge.git](https://github.com/votre-username/agentic-forge.git)
cd agentic-forge
```

## 2. Lancer le script d'installation

Rendez le script de gestion exécutable et lancez-le.

```bash
chmod +x run.sh
./run.sh
```

À la première exécution, le script vérifiera si un fichier `.env` existe. S'il n'existe pas, il le créera automatiquement pour vous.

## 3. Configurer votre environnement

Une fois le fichier `.env` créé, ouvrez-le et remplissez les valeurs avec vos propres informations d'identification.

```env
# Copiez ce fichier en .env et remplissez les valeurs.
HOST_PORT=8080
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
AUTH_TOKEN=""
REDIS_HOST=redis
REDIS_PORT=6378
REDIS_HOST_PORT=6378
REDIS_PASSWORD=""
# L'URL de base n'est plus nécessaire pour l'API Google, commentez-la ou supprimez-la.
# LLM_API_BASE_URL=
WEB_PORT=3000
# Utilisez votre clé d'API Google Gemini
LLM_API_KEY=""

# Spécifiez un modèle Gemini, par exemple "gemini-1.5-pro-latest"
LLM_MODEL_NAME=gemini-2.5-flash
PYTHON_SANDBOX_IMAGE="python:3.11-slim"
BASH_SANDBOX_IMAGE="alpine:latest"
CODE_EXECUTION_TIMEOUT_MS=60000
```

**Important** :
-   Définissez un `AUTH_TOKEN` fort (32+ caractères recommandés)
-   Les clés API sont optionnelles si vous utilisez des modèles locaux

---

## 4. Démarrer Docker

Assurez-vous que Docker est en cours d'exécution avant de continuer.

---

## Configuration pour LLM Local (Recommandé)

### Exigences Matérielles

| Taille Modèle | Mémoire GPU | Performance |
| --- | --- | --- |
| 7B | 8GB VRAM | ⚠️ Tâches basiques seulement |
| 14B | 12GB VRAM | ✅ La plupart des tâches fonctionnent bien |
| 32B | 24GB VRAM | 🚀 Excellentes performances |
| 70B+ | 48GB+ VRAM | 💪 Qualité professionnelle |

### Configuration avec Ollama (Recommandé)

1.  **Installer Ollama** : [Télécharger Ollama](https://ollama.ai/)
2.  **Démarrer Ollama** :
    ```bash
    ollama serve
    ```
3.  **Télécharger un modèle de raisonnement** :
    ```bash
    ollama pull deepseek-r1:14b
    # ou pour plus de puissance : ollama pull deepseek-r1:32b
    ```
4.  **Mettre à jour la configuration** dans `.env` :
    ```env
    LLM_MODEL_NAME="deepseek-r1:14b"
    LLM_API_BASE_URL="http://localhost:11434"
    ```

---

## Démarrer les Services et Exécuter

### Utiliser la Console de Gestion (`run.sh`)

Après avoir configuré votre fichier `.env`, utilisez la console de gestion pour démarrer l'application.

Lancez la console interactive :
```bash
./run.sh
```

Depuis le menu de la console :
1.  **Démarrer** - Lancer tous les services
2.  **Statut** - Vérifier la santé des services
3.  **Logs** - Surveiller les logs en temps réel

---

## Points d'Accès

Une fois les services en marche :

| Service | URL | Description |
| --- | --- | --- |
| **Interface Web** | http://localhost:3000 | Interface utilisateur principale |
| **Point d'API** | http://localhost:8080/api/v1/agent/stream | Accès API direct |
| **Vérification Santé** | http://localhost:8080/health | Statut de santé des services |

---

*Le reste du fichier README.md peut rester tel quel car il décrit les fonctionnalités, l'architecture et le dépannage qui ne sont pas affectés par ce changement.*
