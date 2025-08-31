# Guide des Préférences de Développement

## Introduction

Le système de préférences de développement permet aux utilisateurs de spécifier leurs technologies et frameworks préférés pour différents types de projets. Cela permet à l'agent AgenticForge de générer du code en utilisant les outils et frameworks que vous préférez.

## Types de Projets Supportés

1. **game** - Jeux interactifs et applications de divertissement
2. **website** - Sites web statiques ou dynamiques
3. **webapp** - Applications web avec fonctionnalités complexes
4. **mobile_app** - Applications mobiles
5. **desktop_app** - Applications de bureau
6. **library** - Bibliothèques de code réutilisables
7. **api** - Services API et backends
8. **cli_tool** - Outils en ligne de commande

## Technologies Recommandées par Défaut

### Jeux (game)

- **Framework par défaut**: PixiJS pour les jeux 2D, Three.js pour les jeux 3D
- **Alternatives**: HTML5 Canvas, Phaser.js, Babylon.js

### Sites Web (website)

- **Framework par défaut**: React avec TypeScript et Tailwind CSS
- **Alternatives**: Vue.js, Svelte, Next.js
- **Styling**: Tailwind CSS, Sass, Bootstrap

### Applications Web (webapp)

- **Framework par défaut**: React avec TypeScript, Tailwind CSS, et pnpm
- **Full-stack**: Next.js, Express.js, PostgreSQL
- **Gestion d'état**: Redux, Zustand, Context API

### Applications Mobile (mobile_app)

- **Framework par défaut**: React Native, Flutter
- **Alternatives**: Ionic, NativeScript

### Applications de Bureau (desktop_app)

- **Framework par défaut**: Electron, Tauri
- **Alternatives**: Flutter, .NET MAUI

### Bibliothèques (library)

- **Framework par défaut**: TypeScript avec Rollup/Vite
- **Alternatives**: JavaScript avec Webpack

### Services API (api)

- **Framework par défaut**: Node.js avec Express.js
- **Alternatives**: FastAPI, Django, Spring Boot

### Outils CLI (cli_tool)

- **Framework par défaut**: Node.js avec Commander.js
- **Alternatives**: Python avec Click, Go avec Cobra

## Utilisation des Outils

### 1. Définir les Préférences

Pour définir vos préférences de développement, utilisez l'outil `set_development_preferences` :

```json
{
  "thought": "Définition des préférences de développement pour les jeux",
  "command": {
    "name": "set_development_preferences",
    "params": {
      "projectType": "game",
      "preferredTechnologies": {
        "framework": "PixiJS",
        "language": "TypeScript"
      },
      "instructions": "Utiliser les meilleures pratiques de développement de jeux 2D avec PixiJS"
    }
  }
}
```

### 2. Récupérer les Préférences

Pour récupérer les préférences déjà définies, utilisez l'outil `get_development_preferences` :

```json
{
  "thought": "Vérification des préférences de développement pour les sites web",
  "command": {
    "name": "get_development_preferences",
    "params": {
      "projectType": "website"
    }
  }
}
```

### 3. Récupérer Toutes les Préférences

Pour récupérer toutes les préférences définies :

```json
{
  "thought": "Récupération de toutes les préférences de développement",
  "command": {
    "name": "get_development_preferences",
    "params": {}
  }
}
```

## Exemples d'Utilisation

### Exemple 1: Configuration pour les Jeux

```
Utilisateur: "Pour les jeux, utilise PixiJS avec TypeScript"

Agent: {
  "thought": "Configuration des préférences pour les jeux avec PixiJS",
  "command": {
    "name": "set_development_preferences",
    "params": {
      "projectType": "game",
      "preferredTechnologies": {
        "framework": "PixiJS",
        "language": "TypeScript"
      }
    }
  }
}
```

### Exemple 2: Configuration pour les Sites Web

```
Utilisateur: "Pour les sites web, utilise React avec TypeScript et Tailwind CSS"

Agent: {
  "thought": "Configuration des préférences pour les sites web avec React et Tailwind CSS",
  "command": {
    "name": "set_development_preferences",
    "params": {
      "projectType": "website",
      "preferredTechnologies": {
        "framework": "React",
        "language": "TypeScript",
        "styling": "Tailwind CSS"
      }
    }
  }
}
```

### Exemple 3: Utilisation des Préférences dans un Projet

```
Utilisateur: "Crée un jeu"

Agent: {
  "thought": "Vérification des préférences de développement pour les jeux",
  "command": {
    "name": "get_development_preferences",
    "params": {
      "projectType": "game"
    }
  }
}

Agent: {
  "thought": "Les préférences indiquent d'utiliser PixiJS. Je vais créer un jeu en utilisant cette technologie.",
  "command": {
    "name": "enhanced_todo_list",
    "params": {
      "action": "create_project",
      "title": "Jeu avec PixiJS",
      "project": {
        "name": "Jeu avec PixiJS",
        "description": "Jeu 2D développé avec PixiJS et TypeScript"
      }
    }
  }
}
```

## Bonnes Pratiques

1. **Définissez vos préférences dès le début** d'un projet pour assurer la cohérence
2. **Soyez spécifique** sur les technologies que vous préférez
3. **Utilisez des instructions claires** pour guider l'agent
4. **Mettez à jour vos préférences** si vous changez d'avis sur une technologie
5. **Testez les préférences** en créant de petits projets pour vérifier qu'elles sont respectées

## Dépannage

### Problème: Les préférences ne semblent pas être appliquées

**Solution**: Vérifiez que vous avez correctement défini les préférences avec `set_development_preferences` et que vous les récupérez avec `get_development_preferences` avant de commencer un projet.

### Problème: Une technologie préférée n'est pas supportée

**Solution**: L'agent peut proposer des alternatives. Vous pouvez également modifier vos préférences pour utiliser une technologie supportée.

### Problème: Les préférences sont oubliées entre les sessions

**Solution**: Les préférences sont stockées dans la session. Si vous commencez une nouvelle session, vous devrez redéfinir vos préférences.

## Conclusion

Le système de préférences de développement vous permet de personnaliser la façon dont l'agent AgenticForge développe vos projets. En définissant clairement vos préférences, vous pouvez vous assurer que le code généré utilise les technologies que vous connaissez et préférez.
