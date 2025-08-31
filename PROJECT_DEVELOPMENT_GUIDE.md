# Guide de Développement de Projets AgenticForge

## Structure du Projet

1. **README.md** - Documentation principale du projet
2. **run.sh** - Script de gestion des services
3. **Quality Gates** - Vérifications automatiques
4. **Tests** - Tests unitaires et d'intégration

## 1. README.md - Structure Recommandée

```markdown
# Nom du Projet

## Description

Brève description du projet.

## Fonctionnalités

- Fonctionnalité 1
- Fonctionnalité 2
- Fonctionnalité 3

## Technologies Utilisées

- Langage/Framework principal
- Outils de développement
- Dépendances principales

## Prérequis

- Version de Node.js requise
- Autres dépendances système

## Installation

Instructions d'installation détaillées.

## Utilisation

Instructions d'utilisation du projet.

## Scripts Disponibles

- `npm start` - Démarre l'application
- `npm test` - Lance les tests
- `npm run build` - Compile le projet

## Structure du Projet
```

├── src/
│ ├── components/
│ ├── utils/
│ └── index.js
├── tests/
├── docs/
└── package.json

```

## Contribution
Guide pour contribuer au projet.

## Licence
Information sur la licence du projet.
```

## 2. Script run.sh - Structure et Commandes

```bash
#!/bin/bash

# Script de gestion des services AgenticForge
# Auteur: AgenticForge AI
# Date: $(date)

set -e  # Arrêter le script si une commande échoue

# Variables
PROJECT_NAME="AgenticForge Project"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Commandes principales
start_services() {
    print_header "Démarrage des Services"
    # Implémentation du démarrage des services
    print_success "Services démarrés avec succès"
}

stop_services() {
    print_header "Arrêt des Services"
    # Implémentation de l'arrêt des services
    print_success "Services arrêtés avec succès"
}

restart_services() {
    print_header "Redémarrage des Services"
    stop_services
    start_services
    print_success "Services redémarrés avec succès"
}

show_status() {
    print_header "Statut des Services"
    # Implémentation de l'affichage du statut
    echo "Statut des services Docker:"
    # docker-compose ps
}

show_logs() {
    local service=$1
    print_header "Logs des Services"
    case $service in
        "server")
            echo "Logs du serveur..."
            # Implémentation des logs serveur
            ;;
        "docker")
            echo "Logs Docker..."
            # docker-compose logs
            ;;
        *)
            echo "Logs de tous les services..."
            # Implémentation des logs généraux
            ;;
    esac
}

clean_docker() {
    print_header "Nettoyage Docker"
    print_warning "Cette action supprimera tous les conteneurs, volumes et images Docker"
    read -p "Êtes-vous sûr ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Implémentation du nettoyage Docker
        print_success "Système Docker nettoyé"
    else
        print_warning "Nettoyage annulé"
    fi
}

open_shell() {
    print_header "Shell dans le Conteneur"
    # Implémentation de l'ouverture du shell
    echo "Ouverture du shell..."
}

run_lint() {
    print_header "Linter"
    # Implémentation du linter
    echo "Exécution du linter..."
    # npm run lint
}

run_format() {
    print_header "Formatage du Code"
    # Implémentation du formatage
    echo "Formatage du code..."
    # npm run format
}

run_tests() {
    print_header "Tests"
    # Implémentation des tests
    echo "Exécution des tests..."
    # npm test
}

run_typecheck() {
    print_header "Vérification des Types"
    # Implémentation de la vérification des types
    echo "Vérification des types..."
    # npm run typecheck
}

show_menu() {
    clear
    print_header "$PROJECT_NAME - Menu"
    echo "Utilisation: $0 [commande]"
    echo
    echo "Commandes disponibles:"
    echo "  start             : Démarre tous les services (Docker et worker local)"
    echo "  stop              : Arrête tous les services (Docker et worker local)"
    echo "  restart           : Redémarre tous les services"
    echo "  status            : Affiche le statut des conteneurs Docker"
    echo "  logs [service]    : Affiche les logs. 'service' peut être 'server' ou 'docker'"
    echo "  clean-docker      : Nettoie le système Docker (supprime conteneurs, volumes, etc.)"
    echo "  shell             : Ouvre un shell dans le conteneur du serveur"
    echo "  lint              : Lance le linter sur le code"
    echo "  format            : Formate le code"
    echo "  test              : Lance les tests"
    echo "  typecheck         : Vérifie les types TypeScript"
    echo "  menu              : Affiche le menu interactif (défaut)"
    echo "  alltest           : Lance tous les tests possibles"
    echo
    echo "Exemples:"
    echo "  $0 start"
    echo "  $0 logs server"
    echo "  $0 alltest"
    echo
}

run_all_tests() {
    print_header "Exécution de Tous les Tests"

    echo "1. Vérification des types..."
    run_typecheck

    echo "2. Linter..."
    run_lint

    echo "3. Tests..."
    run_tests

    echo "4. Formatage..."
    run_format

    print_success "Tous les tests ont été exécutés avec succès"
}

# Parse les arguments
case $1 in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs $2
        ;;
    clean-docker)
        clean_docker
        ;;
    shell)
        open_shell
        ;;
    lint)
        run_lint
        ;;
    format)
        run_format
        ;;
    test)
        run_tests
        ;;
    typecheck)
        run_typecheck
        ;;
    alltest)
        run_all_tests
        ;;
    menu|"")
        show_menu
        ;;
    *)
        print_error "Commande inconnue: $1"
        show_menu
        exit 1
        ;;
esac
```

## 3. Quality Gates - Processus Obligatoire

### 4 Tests Obligatoires à Passer :

1. **typecheck** - Vérification des types TypeScript
2. **lint** - Vérification du style de code
3. **test** - Exécution des tests unitaires
4. **format** - Formatage du code

```bash
# Script quality-gate.sh
#!/bin/bash

echo "🚀 Exécution des Quality Gates"

# 1. Vérification des types
echo "1. Vérification des types..."
if npm run typecheck; then
    echo "✅ Vérification des types réussie"
else
    echo "❌ Vérification des types échouée"
    exit 1
fi

# 2. Linter
echo "2. Linter..."
if npm run lint; then
    echo "✅ Linter réussi"
else
    echo "❌ Linter échoué"
    exit 1
fi

# 3. Tests
echo "3. Tests..."
if npm test; then
    echo "✅ Tests réussis"
else
    echo "❌ Tests échoués"
    exit 1
fi

# 4. Formatage
echo "4. Formatage..."
if npm run format; then
    echo "✅ Formatage réussi"
else
    echo "❌ Formatage échoué"
    exit 1
fi

echo "🎉 Tous les Quality Gates ont été passés avec succès"
```

## 4. Structure des Fichiers de Test

### Tests Unitaires

```
tests/
├── unit/
│   ├── components/
│   │   ├── ComponentA.test.ts
│   │   └── ComponentB.test.ts
│   ├── utils/
│   │   ├── utils.test.ts
│   │   └── helpers.test.ts
│   └── services/
│       └── api.test.ts
├── integration/
│   ├── api.integration.test.ts
│   └── e2e.test.ts
└── setup/
    ├── test-setup.ts
    └── mock-data.ts
```

### Exemple de Fichier de Test

```typescript
// tests/unit/components/ComponentA.test.ts
import { describe, it, expect } from 'vitest';
import { ComponentA } from '../../../src/components/ComponentA';

describe('ComponentA', () => {
  it('should render correctly', () => {
    const component = new ComponentA();
    expect(component.render()).toBe('Expected output');
  });

  it('should handle click events', () => {
    const component = new ComponentA();
    const result = component.handleClick();
    expect(result).toBe('Click handled');
  });
});
```

## 5. Structure des Outils MCP (Model Context Protocol)

### Structure de Base d'un Outil MCP

Les outils MCP doivent suivre une structure spécifique pour être compatibles avec le système FastMCP. Voici la structure recommandée :

```
src/modules/tools/definitions/
├── category/
│   ├── tool-name.tool.ts          # Implémentation de l'outil
│   ├── tool-name.tool.test.ts     # Tests unitaires
│   └── __tests__/
│       └── integration.test.ts    # Tests d'intégration
```

### Format d'un Fichier d'Outil MCP (.tool.ts)

```typescript
import { z } from 'zod';
import { Tool } from '../../../../types.ts';

// Schéma Zod pour les paramètres de l'outil
const ToolParameters = z.object({
  /**
   * Description du paramètre
   */
  parameter_name: z.string({
    description: 'Description détaillée du paramètre',
  }),

  /**
   * Paramètre optionnel avec valeur par défaut
   */
  optional_parameter: z.string().optional().default('default_value'),
});

// Export de l'outil MCP
export const toolNameTool: Tool<typeof ToolParameters> = {
  // Description de l'outil - doit être claire et concise
  description: "Description détaillée de ce que fait l'outil",

  // Fonction d'exécution de l'outil
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = ToolParameters.parse(params);
    const { parameter_name, optional_parameter } = parsedParams;

    try {
      // Logique de l'outil
      log.info(
        `Exécution de toolName avec paramètres: ${JSON.stringify(parsedParams)}`,
      );

      // Implémentation de la fonctionnalité
      const result = await performAction(parameter_name, optional_parameter);

      // Retourner le résultat
      return {
        success: true,
        data: result,
        message: 'Action réalisée avec succès',
      };
    } catch (error) {
      log.error({ err: error }, "Erreur lors de l'exécution de toolName");
      throw new Error(
        `Échec de l'exécution de toolName: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  // Nom de l'outil - doit être unique et en snake_case
  name: 'tool_name',

  // Schéma des paramètres
  parameters: ToolParameters,
};

// Fonctions utilitaires (si nécessaire)
async function performAction(param1: string, param2?: string) {
  // Implémentation de l'action
  return `Résultat de l'action avec ${param1} et ${param2 || 'valeur par défaut'}`;
}
```

### Exemple Concret : Outil de Lecture de Fichier

```typescript
import { z } from 'zod';
import { promises as fs } from 'fs';
import { Tool } from '../../../../types.ts';

// Schéma Zod pour les paramètres
const ReadFileParams = z.object({
  /**
   * Chemin du fichier à lire
   */
  path: z.string({
    description: 'Chemin absolu ou relatif du fichier à lire',
  }),

  /**
   * Encodage du fichier (optionnel)
   */
  encoding: z.enum(['utf8', 'base64', 'binary']).optional().default('utf8'),
});

export const readFileTool: Tool<typeof ReadFileParams> = {
  description:
    "Lit le contenu d'un fichier et le retourne sous forme de chaîne",
  execute: async (params, context) => {
    const { log } = context;
    const parsedParams = ReadFileParams.parse(params);
    const { path, encoding } = parsedParams;

    try {
      log.info(`Lecture du fichier: ${path}`);

      // Lire le fichier
      const content = await fs.readFile(path, { encoding });

      return {
        success: true,
        content: content,
        path: path,
        encoding: encoding,
      };
    } catch (error) {
      log.error({ err: error, path }, 'Erreur lors de la lecture du fichier');
      throw new Error(
        `Impossible de lire le fichier ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'read_file',
  parameters: ReadFileParams,
};
```

### Bonnes Pratiques pour les Outils MCP

1. **Nommage**:
   - Nom de l'outil en snake_case
   - Noms de fonctions et variables en camelCase
   - Noms de classes en PascalCase

2. **Documentation**:
   - Description claire de l'outil
   - Commentaires JSDoc pour les paramètres
   - Exemples d'utilisation dans la description

3. **Gestion des Erreurs**:
   - Toujours utiliser try/catch
   - Logger les erreurs avec le contexte approprié
   - Retourner des messages d'erreur clairs

4. **Validation des Paramètres**:
   - Utiliser Zod pour valider les paramètres
   - Fournir des valeurs par défaut quand c'est approprié
   - Documenter tous les paramètres

5. **Logging**:
   - Logger le début et la fin de l'exécution
   - Logger les erreurs avec le contexte
   - Utiliser des niveaux de log appropriés (info, warn, error)

6. **Retour de Résultats**:
   - Toujours retourner un objet avec un champ `success`
   - Inclure des données pertinentes dans le résultat
   - Fournir des messages clairs pour l'utilisateur

### Structure du Schéma Zod

```typescript
const ToolParameters = z.object({
  // Paramètres requis
  required_string: z.string({
    description: 'Description du paramètre requis',
  }),

  required_number: z.number({
    description: 'Description du paramètre numérique requis',
  }),

  required_boolean: z.boolean({
    description: 'Description du paramètre booléen requis',
  }),

  required_enum: z.enum(['option1', 'option2', 'option3'], {
    description: 'Description du paramètre énuméré requis',
  }),

  required_array: z.array(z.string(), {
    description: 'Description du tableau requis',
  }),

  required_object: z.object(
    {
      nested_field: z.string(),
    },
    {
      description: "Description de l'objet imbriqué requis",
    },
  ),

  // Paramètres optionnels
  optional_string: z.string().optional(),

  optional_with_default: z.string().optional().default('valeur_par_defaut'),

  optional_with_description: z.string().optional({
    description: 'Description du paramètre optionnel',
  }),

  // Paramètres avec contraintes
  constrained_string: z.string().min(1).max(100),

  constrained_number: z.number().min(0).max(100),

  email: z.string().email(),

  url: z.string().url(),

  uuid: z.string().uuid(),
});
```

### Exemple de Test pour un Outil MCP

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileTool } from '../readFile.tool.ts';

describe('readFileTool', () => {
  const mockContext: any = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read file content successfully', async () => {
    const params = {
      path: '/test/file.txt',
      encoding: 'utf8',
    };

    // Mock fs.readFile
    vi.mock('fs', () => ({
      promises: {
        readFile: vi.fn().mockResolvedValue('Contenu du fichier'),
      },
    }));

    const result = await readFileTool.execute(params, mockContext);

    expect(result).toEqual({
      success: true,
      content: 'Contenu du fichier',
      path: '/test/file.txt',
      encoding: 'utf8',
    });
  });

  it('should handle file reading errors', async () => {
    const params = {
      path: '/nonexistent/file.txt',
    };

    // Mock fs.readFile to throw an error
    vi.mock('fs', () => ({
      promises: {
        readFile: vi.fn().mockRejectedValue(new Error('File not found')),
      },
    }));

    await expect(readFileTool.execute(params, mockContext)).rejects.toThrow(
      'Impossible de lire le fichier /nonexistent/file.txt: File not found',
    );
  });
});
```

## 6. Bonnes Pratiques de Développement

### Avant de Commencer un Gros Projet :

1. ✅ Créer le README.md avec la documentation complète
2. ✅ Mettre en place le script run.sh avec toutes les commandes
3. ✅ Configurer les Quality Gates
4. ✅ Créer la structure des fichiers de test

### Processus de Développement :

1. **Planification** - Définir les fonctionnalités et l'architecture
2. **Configuration** - Mettre en place l'environnement de développement
3. **Développement** - Écrire le code en suivant les bonnes pratiques
4. **Tests** - Écrire et exécuter les tests
5. **Quality Gates** - Passer les 4 tests obligatoires
6. **Documentation** - Mettre à jour le README.md
7. **Validation** - Revue de code et validation finale

### Technologies Recommandées par Type de Projet :

**Jeux :**

- Framework: PixiJS (2D), Three.js (3D)
- Langage: TypeScript
- Build: Vite ou Webpack

**Sites Web :**

- Framework: React avec TypeScript
- Styling: Tailwind CSS
- Build: Vite
- Package Manager: pnpm

**Applications Web :**

- Framework: Next.js (React)
- State Management: Zustand ou Redux
- Styling: Tailwind CSS
- Backend: Node.js/Express

**Applications Mobile :**

- Framework: React Native
- Styling: Native Base ou React Native Paper

**Applications Desktop :**

- Framework: Electron ou Tauri
- UI: React avec Tailwind CSS

**Librairies :**

- Langage: TypeScript
- Build: Rollup ou Vite
- Package Manager: pnpm

**API Services :**

- Framework: Express.js (Node.js)
- Database: PostgreSQL
- ORM: Prisma ou TypeORM

**Outils CLI :**

- Langage: TypeScript
- Framework: Commander.js
- Build: tsup ou esbuild

## 7. Processus de Validation Final

Avant de considérer un projet comme terminé :

1. ✅ README.md complet et à jour
2. ✅ Script run.sh fonctionnel
3. ✅ Quality Gates configurés et fonctionnels
4. ✅ Tests unitaires et d'intégration écrits
5. ✅ Tous les tests passent (typecheck, lint, test, format)
6. ✅ Code documenté
7. ✅ Exemples d'utilisation fournis
8. ✅ Configuration Docker si nécessaire
9. ✅ CI/CD configuré (si applicable)
10. ✅ Revue de code effectuée

## 8. Template de Commit pour les Gros Projets

```
feat(project): Initial commit of [Project Name]

- Added complete project structure
- Implemented core functionality
- Added comprehensive tests
- Configured quality gates
- Updated documentation

Quality Gates Passed:
- ✅ typecheck
- ✅ lint
- ✅ test
- ✅ format

Closes #[issue-number]
```

Ce guide assure un développement structuré, testé et documenté de tous les projets.
