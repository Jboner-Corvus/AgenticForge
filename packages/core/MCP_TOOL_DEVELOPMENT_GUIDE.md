# Guide de Développement d'Outils MCP

## Introduction

Ce guide fournit des instructions détaillées pour développer des outils compatibles avec le protocole MCP (Model Context Protocol) dans AgenticForge.

## Structure des Fichiers

### Organisation

```
src/modules/tools/definitions/
├── category/
│   ├── tool-name.tool.ts          # Implémentation de l'outil
│   ├── tool-name.tool.test.ts     # Tests unitaires
│   └── __tests__/
│       └── integration.test.ts      # Tests d'intégration
```

### Convention de Nommage

- **Fichier**: `tool-name.tool.ts` (toujours en minuscules avec tirets)
- **Variable exportée**: `toolNameTool` (camelCase avec "Tool" suffixe)
- **Nom de l'outil**: `tool_name` (snake_case)

## Structure du Code

### Importations Requises

```typescript
import { z } from 'zod';
import { Tool } from '../../../../types.ts';
```

### Schéma Zod pour les Paramètres

```typescript
const ToolParameters = z.object({
  /**
   * Description claire du paramètre
   */
  parameter_name: z
    .string({
      description: 'Description détaillée du paramètre',
    })
    .min(1)
    .max(100),
});
```

### Structure de l'Outil

```typescript
export const toolNameTool: Tool<typeof ToolParameters> = {
  description: "Description détaillée de ce que fait l'outil",
  execute: async (params, context) => {
    // Implémentation
  },
  name: 'tool_name',
  parameters: ToolParameters,
};
```

## Bonnes Pratiques

### Gestion des Erreurs

```typescript
export const toolNameTool: Tool<typeof ToolParameters> = {
  description: "Description de l'outil",
  execute: async (params, context) => {
    const { job, log } = context;
    const parsedParams = ToolParameters.parse(params);

    try {
      // Logique métier
      const result = await performAction(parsedParams);

      return {
        success: true,
        data: result,
        message: 'Action réussie',
      };
    } catch (error) {
      log.error({ err: error }, 'Erreur détaillée');
      throw new Error(
        `Message d'erreur clair: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  name: 'tool_name',
  parameters: ToolParameters,
};
```

### Validation des Paramètres

1. **Toujours utiliser Zod** pour valider les paramètres
2. **Fournir des descriptions détaillées** pour chaque paramètre
3. **Appliquer des contraintes appropriées** (min/max, regex, etc.)
4. **Définir des valeurs par défaut** quand c'est pertinent

### Journalisation

```typescript
// Au début de l'exécution
log.info("Démarrage de l'outil avec paramètres", { params });

// Pendant l'exécution
log.debug('Étape intermédiaire', { intermediateData });

// En cas d'erreur
log.error({ err: error, params }, 'Erreur détaillée');

// À la fin
log.info('Outil terminé avec succès', { result });
```

## Tests

### Structure des Tests

```typescript
// tool-name.tool.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolNameTool } from '../tool-name.tool.ts';

describe('toolNameTool', () => {
  const mockContext: any = {
    job: { session: { metadata: {} } },
    log: { info: vi.fn(), error: vi.fn() },
  };

  beforeEach(() => {
    mockContext.job.session.metadata = {};
    vi.clearAllMocks();
  });

  it('should execute successfully', async () => {
    const params = {
      /* paramètres de test */
    };

    const result = await toolNameTool.execute(params, mockContext);

    expect(result).toEqual({ success: true /* attentes */ });
  });

  it('should handle validation errors', async () => {
    const invalidParams = {
      /* paramètres invalides */
    };

    await expect(
      toolNameTool.execute(invalidParams, mockContext),
    ).rejects.toThrow(/* message d'erreur attendu */);
  });
});
```

### Types de Tests à Inclure

1. **Tests de succès** - Cas nominaux
2. **Tests d'erreurs** - Gestion des erreurs
3. **Tests de validation** - Paramètres invalides
4. **Tests limites** - Valeurs extrêmes
5. **Tests d'intégration** - Interaction avec d'autres outils

## Exemple Complet

### Outil de Lecture de Fichier

```typescript
// readFile.tool.ts
import { z } from 'zod';
import { promises as fs } from 'fs';
import { Tool } from '../../../../types.ts';

const ReadFileParams = z.object({
  /**
   * Chemin du fichier à lire
   */
  path: z
    .string({
      description: 'Chemin absolu ou relatif du fichier à lire',
    })
    .min(1),

  /**
   * Encodage du fichier
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

## Qualité du Code

### Revue de Code

Avant de merger un nouvel outil, vérifier :

1. **Structure** - Suit les conventions établies
2. **Typage** - Utilise TypeScript correctement
3. **Validation** - Paramètres validés avec Zod
4. **Erreurs** - Gestion d'erreurs appropriée
5. **Journalisation** - Logging approprié
6. **Tests** - Tests complets et pertinents
7. **Documentation** - Commentaires et descriptions clairs

## Maintenance

### Documentation

1. **README** - Documentation dans le dossier de l'outil
2. **Inline Comments** - Commentaires pour la logique complexe
3. **Examples** - Exemples d'utilisation
4. **Changelog** - Historique des changements

## Ressources

- [Documentation Zod](https://zod.dev/)
- [FastMCP Documentation](https://github.com/punkpeye/fastmcp)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
