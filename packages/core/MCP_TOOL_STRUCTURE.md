# Structure des Outils MCP

## Introduction

Ce document définit la structure standard pour tous les outils MCP (Model Context Protocol) dans AgenticForge.

## Structure de Base

```
src/modules/tools/definitions/
├── category/
│   ├── tool-name.tool.ts          # Implémentation de l'outil
│   ├── tool-name.tool.test.ts     # Tests unitaires
│   └── __tests__/
│       └── integration.test.ts      # Tests d'intégration
```

## Structure du Code TypeScript

### Importations Standard

```typescript
import { z } from 'zod';
import { Tool } from '../../../../types.ts';
// Autres importations spécifiques à l'outil
```

### Schéma Zod des Paramètres

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
    // Implémentation avec gestion d'erreurs
  },
  name: 'tool_name',
  parameters: ToolParameters,
};
```

## Bonnes Pratiques

1. **Nommage**:
   - Fichier: `tool-name.tool.ts` (snake_case)
   - Variable: `toolNameTool` (camelCase)
   - Nom de l'outil: `tool_name` (snake_case)

2. **Validation**:
   - Toujours utiliser Zod pour valider les paramètres
   - Fournir des descriptions détaillées
   - Appliquer des contraintes appropriées

3. **Gestion des Erreurs**:
   - Toujours utiliser try/catch
   - Logger les erreurs avec le contexte approprié
   - Retourner des messages d'erreur clairs

4. **Journalisation**:
   - Logger le début et la fin de l'exécution
   - Logger les erreurs avec le contexte
   - Utiliser des niveaux de log appropriés

## Références

Pour plus de détails, voir:

- [Guide de Développement d'Outils MCP](./MCP_TOOL_DEVELOPMENT_GUIDE.md)
- [Exemple d'Outil MCP](./src/modules/tools/definitions/system/exampleMcpTool.tool.ts)
- [Tests d'Outils](./src/modules/tools/definitions/system/__tests__/exampleMcpTool.test.ts)
