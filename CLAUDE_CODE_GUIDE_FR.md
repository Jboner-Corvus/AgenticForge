# Guide Complet d'Utilisation de Claude Code en Français

## 📋 Introduction

Claude Code est un outil en ligne de commande qui permet d'interagir avec Claude, l'IA d'Anthropic, directement depuis votre terminal. Il offre une session interactive par défaut mais peut aussi être utilisé en mode non-interactif pour des scripts et automatisations.

## 🚀 Installation

```bash
# Installation globale
npm install -g @anthropic-ai/claude-code

# Ou avec sudo si nécessaire
sudo npm install -g @anthropic-ai/claude-code
```

## 📖 Utilisation de Base

### Démarrer une session interactive
```bash
claude
```

### Utiliser avec un prompt direct
```bash
claude "Ton prompt ici"
```

### Obtenir de l'aide
```bash
claude --help
```

## ⚙️ Options Principales

### Options de Sortie

#### `-p, --print`
- Imprime la réponse et quitte
- Utile pour les scripts et pipes
- **Note** : Saute la boîte de dialogue de confiance de l'espace de travail

```bash
claude -p "Explique ce code"
echo "Analyse ce fichier" | claude -p
```

#### `--output-format <format>`
- Format de sortie (fonctionne avec --print)
- Choix : "text" (défaut), "json", "stream-json"

```bash
claude -p --output-format json "Analyse ce projet"
```

#### `--include-partial-messages`
- Inclut les fragments de messages au fur et à mesure de leur arrivée
- Fonctionne avec --print et --output-format=stream-json

#### `--input-format <format>`
- Format d'entrée (fonctionne avec --print)
- Choix : "text" (défaut), "stream-json"

### Options de Debug et Verbosité

#### `-d, --debug [filter]`
- Active le mode debug avec filtrage de catégories optionnel
- Exemples : "api,hooks" ou "!statsig,!file"

```bash
claude --debug api,hooks "Test cette fonction"
claude --debug "!statsig,!file" "Debug général"
```

#### `--verbose`
- Surcharge le mode verbeux depuis la configuration

#### `--mcp-debug`
- **DÉPRÉCIÉ** : Utilisez --debug à la place
- Active le mode debug MCP (montre les erreurs des serveurs MCP)

## 🔐 Options de Permissions (MODE YOLO)

### `--dangerously-skip-permissions`
- **Contourne TOUTES les vérifications de permissions**
- ⚠️ **Recommandé uniquement pour les sandbox sans accès Internet**
- C'est l'option principale pour le mode "yolo"

```bash
claude --dangerously-skip-permissions
```

### `--permission-mode <mode>`
- Mode de permissions pour la session
- Choix : "acceptEdits", "bypassPermissions", "default", "plan"

#### Modes disponibles :
- **acceptEdits** : Accepte automatiquement les modifications
- **bypassPermissions** : Contourne les permissions (mode yolo)
- **default** : Utilise le mode de permissions par défaut
- **plan** : Mode planification

```bash
# Mode yolo complet
claude --permission-mode bypassPermissions

# Accepter automatiquement les modifications
claude --permission-mode acceptEdits
```

### `--allowedTools, --allowed-tools <tools...>`
- Liste d'outils autorisés (séparés par des virgules ou espaces)
- Exemple : "Bash(git:*) Edit"

```bash
claude --allowed-tools "Bash(git:*),Edit" "Modifie ce projet"
```

### `--disallowedTools, --disallowed-tools <tools...>`
- Liste d'outils interdits

```bash
claude --disallowed-tools "Bash(rm:*)" "Analyse ce fichier"
```

## 🔄 Gestion de Session

### `-c, --continue`
- Continue la conversation la plus récente

```bash
claude --continue
```

### `-r, --resume [sessionId]`
- Reprend une conversation
- Avec sessionId : reprend une session spécifique
- Sans sessionId : sélection interactive

```bash
claude --resume
claude --resume 12345678-1234-1234-1234-123456789012
```

### `--fork-session`
- Crée un nouvel ID de session lors de la reprise
- À utiliser avec --resume ou --continue

```bash
claude --resume --fork-session
```

### `--session-id <uuid>`
- Utilise un ID de session spécifique (doit être un UUID valide)

```bash
claude --session-id 12345678-1234-1234-1234-123456789012
```

## 🤖 Configuration des Modèles

### `--model <model>`
- Modèle pour la session courante
- Alias : 'sonnet', 'opus'
- Nom complet : 'claude-sonnet-4-5-20250929'

```bash
claude --model sonnet "Explique ce concept"
claude --model claude-sonnet-4-5-20250929 "Analyse approfondie"
```

### `--fallback-model <model>`
- Active le fallback automatique vers un modèle spécifique
- Fonctionne uniquement avec --print

```bash
claude -p --fallback-model sonnet "Question complexe"
```

## 📁 Gestion des Fichiers et Répertoires

### `--add-dir <directories...>`
- Répertoires supplémentaires pour autoriser l'accès aux outils

```bash
claude --add-dir /chemin/vers/projet "Analyse ce projet"
```

### `--settings <file-or-json>`
- Chemin vers un fichier de settings JSON ou chaîne JSON

```bash
claude --settings ./config.json "Configure ce projet"
claude --settings '{"verbose": true}' "Test"
```

### `--setting-sources <sources>`
- Sources de paramètres à charger (séparées par des virgules)
- Choix : user, project, local

```bash
claude --setting-sources user,project "Test"
```

## 🔌 Configuration MCP

### `--mcp-config <configs...>`
- Charge les serveurs MCP depuis des fichiers JSON ou chaînes

```bash
claude --mcp-config ./mcp-config.json "Utilise les outils MCP"
```

### `--strict-mcp-config`
- Utilise uniquement les serveurs MCP depuis --mcp-config
- Ignore toutes les autres configurations MCP

```bash
claude --strict-mcp-config --mcp-config ./mcp.json "Test strict"
```

## 🎯 Personnalisation

### `--append-system-prompt <prompt>`
- Ajoute un prompt système au prompt système par défaut

```bash
claude --append-system-prompt "Réponds en français" "Explique l'IA"
```

### `--agents <json>`
- Définit des agents personnalisés (format JSON)

```bash
claude --agents '{"reviewer": {"description": "Vérifie le code", "prompt": "Tu es un expert en code"}}' "Utilise l'agent reviewer"
```

## 🖥️ Intégration IDE

### `--ide`
- Connecte automatiquement à l'IDE au démarrage
- Si exactement un IDE valide est disponible

```bash
claude --ide
```

## 🔄 Gestion des Messages

### `--replay-user-messages`
- Réémet les messages utilisateur depuis stdin vers stdout
- Fonctionne avec --input-format=stream-json et --output-format=stream-json

## 📋 Commandes Disponibles

### `mcp`
- Configure et gère les serveurs MCP

```bash
claude mcp
```

### `migrate-installer`
- Migre de l'installation npm globale à l'installation locale

```bash
claude migrate-installer
```

### `setup-token`
- Configure un token d'authentification longue durée
- Nécessite un abonnement Claude

```bash
claude setup-token
```

### `doctor`
- Vérifie la santé de l'auto-updater Claude Code

```bash
claude doctor
```

### `update`
- Vérifie les mises à jour et les installe si disponibles

```bash
claude update
```

### `install [options] [target]`
- Installe la build native de Claude Code
- Cible : stable, latest, ou version spécifique

```bash
claude install stable
claude install latest
claude install 1.0.0
```

## 🎯 Exemples Pratiques

### Mode YOLO Complet
```bash
# Sans aucune confirmation
claude --dangerously-skip-permissions "Nettoie ce projet et organise les fichiers"
```

### Script d'Automatisation
```bash
# Pour les scripts
claude -p --output-format json --permission-mode bypassPermissions "Analyse ce projet et génère un rapport"
```

### Développement Interactif
```bash
# Session interactive avec permissions étendues
claude --permission-mode acceptEdits --add-dir ./src "Aide-moi à développer cette fonctionnalité"
```

### Debug Avancé
```bash
# Avec debug complet
claude --debug "api,hooks" --verbose "Débugge ce problème complexe"
```

### Travail avec MCP
```bash
# Avec serveurs MCP personnalisés
claude --mcp-config ./mcp-servers.json --strict-mcp-config "Utilise les outils spécialisés"
```

## ⚠️ Avertissements de Sécurité

- `--dangerously-skip-permissions` doit être utilisé avec prudence
- Privilégiez les environnements isolés sans accès Internet
- Vérifiez toujours les commandes avant de les exécuter
- Sauvegardez votre travail avant d'utiliser des modes automatisés

## 📚 Ressources Supplémentaires

- Documentation officielle : https://docs.anthropic.com/claude/docs/claude-code
- Support : https://support.anthropic.com
- Communauté : https://community.anthropic.com

---

**Note** : Ce guide est basé sur la version actuelle de Claude Code. Les options peuvent évoluer avec les mises à jour.