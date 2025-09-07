# Méthode pour Rendre un Prompt Ordinaire Agentique -

## 🎯 Introduction

Ce document explique la méthodologie AgentMCP pour transformer un prompt ordinaire en système agentique capable d'utiliser des outils et d'exécuter des actions autonomes.

## 🏗️ Architecture du Système de Prompts

### 1. Structure Modulaire des Prompts

AgentMCP utilise un système de prompts modulaires avec des templates spécialisés :

```typescript
// packages/core/src/modules/agent/system-prompts.ts
export const SYSTEM_PROMPT_TEMPLATES: Record<string, SystemPromptTemplate> = {
  architect: {
    /* Conception système et architecture */
  },
  coder: {
    /* Implémentation et débogage de code */
  },
  explain: {
    /* Explication et enseignement */
  },
  debug: {
    /* Débogage et résolution de problèmes */
  },
  orchestrate: {
    /* Gestion de projet et coordination */
  },
  frontend: {
    /* Développement frontend et UI/UX */
  },
};
```

### 2. Spécialisation par Domaine d'Outils (1 Prompt = ~5 Outils)

**Principe fondamental** : Chaque template de prompt contrôle un ensemble spécialisé de 4-5 outils maximum pour éviter la surcharge cognitive et optimiser les performances.

#### **Template `architect`** → Outils de Conception

- `projectPlanning` - Planification de projets
- `getDevelopmentPreferences` - Récupération des préférences
- `setDevelopmentPreferences` - Configuration des préférences
- `delegateTask` - Délégation de tâches
- `listTools` - Inspection des outils disponibles

#### **Template `coder`** → Outils de Développement

- `writeFile` - Création de fichiers
- `editFile` - Modification de fichiers
- `readFile` - Lecture de fichiers
- `executeShellCommand` - Exécution de commandes
- `listDirectory` - Navigation dans les dossiers

#### **Template `frontend`** → Outils d'Interface

- `playwright_navigate` - Navigation web
- `playwright_click` - Interaction avec éléments
- `playwright_screenshot` - Capture d'écran
- `playwright_type` - Saisie de texte
- `displayCanvas` - Affichage visuel

#### **Template `debug`** → Outils de Débogage

- `executeShellCommand` - Tests et diagnostics
- `readFile` - Analyse de logs
- `canvasConsoleFeedback` - Feedback console
- `listDirectory` - Exploration de structure
- `summarize` - Analyse de problèmes

#### **Template `orchestrate`** → Outils de Coordination

- `todoWrite` - Gestion de tâches
- `delegateTask` - Coordination d'équipe
- `finish` - Finalisation de workflows
- `createTool` - Création d'outils dynamiques
- `projectPlanning` - Orchestration de projets

#### **Template `explain`** → Outils Pédagogiques

- `readFile` - Lecture de code
- `listDirectory` - Exploration de structure
- `summarize` - Synthèse de concepts
- `displayCanvas` - Visualisation explicative
- `finish` - Réponses finales

### 3. Construction Dynamique du Prompt

Le prompt final est construit par assemblage de plusieurs sections :

```typescript
// packages/core/src/modules/agent/orchestrator.prompt.ts
export const getMasterPrompt = (
  session: AgentSession,
  tools: Tool[],
): string => {
  return `${getPreamble()}\n\n${workingContextSection}${toolsSection}\n\n${historySection}\n\nASSISTANT's turn. Your response:`;
};
```

### 4. Filtrage Intelligent des Outils

Le système filtre dynamiquement les outils selon le template de prompt actif :

```typescript
// Logique de filtrage selon le template prompt
const getToolsForTemplate = (template: string): Tool[] => {
  const toolMappings = {
    architect: [
      'projectPlanning',
      'getDevelopmentPreferences',
      'setDevelopmentPreferences',
      'delegateTask',
      'listTools',
    ],
    coder: [
      'writeFile',
      'editFile',
      'readFile',
      'executeShellCommand',
      'listDirectory',
    ],
    frontend: [
      'playwright_navigate',
      'playwright_click',
      'playwright_screenshot',
      'playwright_type',
      'displayCanvas',
    ],
    debug: [
      'executeShellCommand',
      'readFile',
      'canvasConsoleFeedback',
      'listDirectory',
      'summarize',
    ],
    orchestrate: [
      'todoWrite',
      'delegateTask',
      'finish',
      'createTool',
      'projectPlanning',
    ],
    explain: [
      'readFile',
      'listDirectory',
      'summarize',
      'displayCanvas',
      'finish',
    ],
  };

  return getAllTools().filter((tool) =>
    toolMappings[template]?.includes(tool.name),
  );
};
```

## 🛠️ Système d'Outils (Tools)

### 1. Définition d'un Outil avec Zod

Chaque outil est défini avec un schéma Zod pour la validation des paramètres :

```typescript
// Exemple: packages/core/src/modules/tools/definitions/fs/writeFile.tool.ts
export const writeFileParams = z.object({
  content: z
    .string()
    .max(50 * 1024 * 1024, 'Le contenu ne peut pas dépasser 50MB')
    .describe('The full content to write to the file.'),
  path: z
    .string()
    .min(1, 'Le chemin ne peut pas être vide')
    .describe('The path to the file within the workspace.'),
});

export const writeFile: Tool<typeof writeFileParams, typeof writeFileOutput> = {
  name: 'writeFile',
  description:
    'Writes content to a file, overwriting it. Creates the file and directories if they do not exist.',
  parameters: writeFileParams,
  execute: async (args: z.infer<typeof writeFileParams>, ctx: Ctx) => {
    // Implémentation de l'outil
  },
};
```

### 2. Conversion Zod vers JSON Schema

Le système convertit automatiquement les schémas Zod en JSON Schema pour le prompt :

```typescript
// packages/core/src/modules/agent/orchestrator.prompt.ts (lignes 66-185)
const zodToJsonSchema = (_schema: any): any => {
  switch (_schema._def.typeName) {
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodObject':
      // Construction du schéma JSON avec propriétés et champs requis
      break;
    case 'ZodDefault':
      // Gestion des valeurs par défaut
      break;
    // ... autres types Zod
  }
};
```

## 🔄 Schéma de Réponse LLM

### 1. Structure JSON Stricte

Le LLM doit répondre dans un format JSON strict défini par Zod :

```typescript
// packages/core/src/modules/agent/responseSchema.ts
export const llmResponseSchema = z.object({
  thought: z
    .string()
    .optional()
    .describe('Your internal monologue and reasoning'),
  command: z
    .object({
      name: z.string().describe('The name of the tool to execute'),
      params: z
        .record(z.string(), z.any())
        .optional()
        .describe('The parameters for the tool, as a JSON object'),
    })
    .optional()
    .describe('The command to execute'),
  answer: z
    .string()
    .optional()
    .describe("The final answer to the user's request"),
  canvas: z
    .object({
      content: z.string(),
      contentType: z.enum(['html', 'markdown', 'text', 'url']),
    })
    .optional()
    .describe('The canvas is a visual workspace'),
});
```

### 2. Validation et Parsing

```typescript
// Le schéma est converti en JSON Schema et intégré au prompt
export function getResponseJsonSchema() {
  return zodToJsonSchema(llmResponseSchema, {
    $refStrategy: 'none',
  });
}
```

## 🚀 Méthodologie : De Prompt Ordinaire à Agentique

### Étape 1 : Prompt Ordinaire

```
"Écris un fichier Python qui calcule 2+2"
```

### Étape 2 : Transformation Agentique

Le système AgentMCP transforme ce prompt en :

1. **Contexte Système** (system.prompt.md)
2. **Outils Disponibles** (formatés avec JSON Schema)
3. **Historique de Conversation**
4. **Schéma de Réponse JSON**

### Étape 3 : Prompt Final Construit

```markdown
# AgentMCP - AI Assistant System Prompt

## 🛠️ TOOL USAGE GUIDELINES

### Available Tools:

### writeFile

Description: Writes content to a file, overwriting it
Parameters (JSON Schema):
{
"type": "object",
"$schema": "http://json-schema.org/draft-07/schema#",
"additionalProperties": false,
"properties": {
"content": {
"type": "string",
"description": "The full content to write to the file."
},
"path": {
"type": "string",
"description": "The path to the file within the workspace."
}
},
"required": ["content", "path"]
}

## 🔄 RESPONSE FORMAT (ABSOLUTE REQUIREMENT)

Your response MUST BE VALID JSON ONLY:

{
"thought": "Je vais créer un fichier Python pour calculer 2+2",
"command": {
"name": "writeFile",
"params": {
"path": "calcul.py",
"content": "result = 2 + 2\nprint(f'2 + 2 = {result}')"
}
}
}

## Conversation History:

USER:
Écris un fichier Python qui calcule 2+2

ASSISTANT's turn. Your response:
```

## 🎮 Fast MCP Integration

### 1. Protocole MCP (Model Context Protocol)

AgenticForge utilise FastMCP pour l'intégration des outils :

```typescript
// packages/core/src/types.ts (ligne 1)
import type { Context as FastMCPContext } from 'fastmcp';

export type Ctx = {
  job?: MinimalJob;
  llm: ILlmProvider;
  log: pino.Logger;
  // ... autres propriétés
} & Omit<FastMCPContext<SessionData>, 'reportProgress' | 'streamContent'>;
```

### 2. Outils MCP Standards

Exemple d'intégration MCP avec outils spécialisés :

```typescript
// Exemple d'outil MCP
export const playwrightNavigateTool: Tool<typeof navigateParams, any> = {
  name: 'playwright_navigate',
  description: 'Navigate to a URL using Playwright browser automation',
  parameters: navigateParams,
  execute: async (params: z.infer<typeof navigateParams>, ctx: Ctx) => {
    // Implémentation avec événements Redis pour la UI
    await sendEvent(ctx, 'browser.navigating', { url: params.url });
    // ... logique d'exécution
  },
};
```

## 🧠 Logique d'Anti-Boucle

### 1. Règles Critiques Anti-Boucle

```markdown
## 🚨 ANTI-LOOP CRITICAL RULES

1. **NEVER use the same tool 2 times in a row** unless it's a different task
2. **FORBIDDEN TOOL REPETITION:** If you just used `agent_thought`, you MUST use a different tool next
3. **PROGRESSION ENFORCEMENT:** Always move forward - if stuck, use `finish` tool
4. **PARSING FAILURE RECOVERY:** If LLM response fails to parse, use `finish` tool immediately
```

### 2. Stratégie de Progression

- **Action immédiate** : Pas de sur-réflexion
- **Workflows systematiques** : Utilisation de TodoWrite pour les tâches complexes
- **Feedback visuel** : Canvas pour les livrables finaux

## 🎨 Gestion du Canvas et Feedback Visuel

### 1. Canvas pour Livrables

```typescript
canvas: z.object({
  content: z.string().describe('The content to display on the canvas'),
  contentType: z.enum(['html', 'markdown', 'text', 'url']),
})
  .optional()
  .describe('The canvas is a visual workspace');
```

### 2. Événements Redis pour UI en Temps Réel

```typescript
const sendEvent = async (ctx: Ctx, type: string, data: unknown) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({
      type,
      data,
      timestamp: Date.now(),
      jobId: ctx.job.id,
      sessionId: ctx.session?.id,
    });
    await getRedisClientInstance().publish(channel, event);
  }
};
```

## 🔧 Registre d'Outils (ToolRegistry)

### 1. Pattern Singleton

```typescript
// packages/core/src/modules/tools/toolRegistry.ts
class ToolRegistry {
  private static instance: ToolRegistry;
  private readonly tools = new Map<string, Tool<z.AnyZodObject, ZodTypeAny>>();

  public async execute(
    name: string,
    params: unknown,
    ctx: Ctx,
  ): Promise<unknown> {
    const tool = this.get(name);
    let parsedParams: Record<string, unknown>;
    try {
      parsedParams = tool.parameters.parse(params);
    } catch (error) {
      // Gestion d'erreur Zod détaillée
    }
    return tool.execute(parsedParams, ctx);
  }
}
```

## 📋 Workflow de TodoWrite

### 1. Gestion des Tâches Complexes

```typescript
// Utilisation pour les projets multi-étapes uniquement
{
  "command": {
    "name": "todoWrite",
    "params": {
      "todos": [
        {"id": "1", "content": "Créer structure HTML", "status": "pending"},
        {"id": "2", "content": "Ajouter styles CSS", "status": "pending"},
        {"id": "3", "content": "Implémenter logique JS", "status": "pending"}
      ]
    }
  }
}
```

## 🎯 Transformation Complète : Exemple Pratique

### Prompt Ordinaire :

```
"Crée un jeu de Snake en HTML"
```

### Étape 1 : Sélection du Template Spécialisé

Le système sélectionne automatiquement le template `frontend` car il s'agit de création d'interface :

**Template `frontend`** active ses 5 outils spécialisés :

- `writeFile` - Création des fichiers HTML/CSS/JS
- `playwright_navigate` - Test de navigation
- `playwright_screenshot` - Captures d'écran de validation
- `displayCanvas` - Affichage du jeu final
- `executeShellCommand` - Serveur de développement

### Étape 2 : Prompt Agentique Transformé

```markdown
# AgentMCP - FrontEnd Development Mode

## Available Tools:

### writeFile

Description: Writes content to a file, overwriting it
Parameters: {"path": "string", "content": "string"}

### playwright_navigate

Description: Navigate to a URL using Playwright browser automation
Parameters: {"url": "string", "waitUntil": "load|domcontentloaded|networkidle"}

### playwright_screenshot

Description: Take a screenshot using Playwright browser automation  
Parameters: {"fullPage": "boolean", "selector": "string?"}

### displayCanvas

Description: Display rich content on the visual canvas
Parameters: {"content": "string", "contentType": "html|markdown|text"}

### executeShellCommand

Description: Execute shell commands for development tasks
Parameters: {"command": "string", "workingDirectory": "string?"}

## User Request: "Crée un jeu de Snake en HTML"

ASSISTANT's turn. Your response:
```

### Étape 3 : Réponse LLM Spécialisée

Avec seulement 5 outils spécialisés, le LLM peut se concentrer efficacement :

```json
{
  "thought": "Template frontend activé avec 5 outils spécialisés. Je vais créer le Snake en utilisant writeFile puis displayCanvas",
  "command": {
    "name": "writeFile",
    "params": {
      "path": "snake.html",
      "content": "<!DOCTYPE html><html><head><title>Snake Game</title><style>canvas{border:1px solid #000}</style></head><body><canvas id=\"game\" width=\"400\" height=\"400\"></canvas><script>/* Logique Snake complète */</script></body></html>"
    }
  }
}
```

### Étape 4 : Validation et Affichage

```json
{
  "thought": "Jeu créé, maintenant je l'affiche sur le canvas pour validation visuelle",
  "command": {
    "name": "displayCanvas",
    "params": {
      "content": "file://snake.html",
      "contentType": "url"
    }
  }
}
```

## 🚀 Avantages de cette Méthode

### 1. **Déterminisme**

- Format JSON strict élimine l'ambiguïté
- Validation Zod garantit la cohérence des paramètres

### 2. **Spécialisation Cognitive**

- Limitation à 4-5 outils par template évite la surcharge
- Focus sur des domaines d'expertise spécifiques
- Réduction drastique de l'espace de décision pour le LLM

### 3. **Modularité**

- Outils réutilisables et composables
- Templates de prompts spécialisés par domaine

### 4. **Observabilité**

- Événements Redis pour feedback temps réel
- Historique complet des actions

### 5. **Robustesse**

- Gestion d'erreurs intégrée
- Mécanismes anti-boucles
- Validation systématique

## 🔄 Flux de Transformation

```
Prompt Ordinaire
    ↓
System Prompt Template (selon le mode)
    ↓
+ Outils Disponibles (avec JSON Schema)
    ↓
+ Historique de Conversation
    ↓
+ Schéma de Réponse JSON
    ↓
= Prompt Agentique Complet
    ↓
Réponse JSON Structurée
    ↓
Exécution d'Outils avec Validation Zod
    ↓
Mise à Jour de l'État et Feedback UI
```

## 📦 Composants Clés

### 1. **Prompt Builder** (`orchestrator.prompt.ts`)

- Assemblage dynamique du prompt final
- Injection des outils et de l'historique

### 2. **Tool Registry** (`toolRegistry.ts`)

- Gestion centralisée des outils
- Validation et exécution sécurisée

### 3. **Response Schema** (`responseSchema.ts`)

- Structure JSON obligatoire pour les réponses LLM
- Validation automatique

### 4. **Fast MCP Integration**

- Protocole standardisé pour les outils
- Context enrichi avec job, session, logging

## 🎨 Cas d'Usage Spécialisés

### Développement Web

```json
{
  "command": {
    "name": "playwright_navigate",
    "params": { "url": "https://example.com" }
  }
}
```

### Gestion de Fichiers

```json
{
  "command": {
    "name": "writeFile",
    "params": { "path": "app.js", "content": "console.log('Hello')" }
  }
}
```

### Feedback Visuel

```json
{
  "command": {
    "name": "displayCanvas",
    "params": {
      "content": "<html>...</html>",
      "contentType": "html"
    }
  }
}
```

## 🎮 Exemples de Spécialisation par Template

### Template `coder` + 5 Outils de Développement

```
Prompt: "Répare le bug dans login.js"
→ Template: coder
→ Outils: [readFile, editFile, executeShellCommand, listDirectory, writeFile]
→ Focus: Analyse, modification, test de code
```

### Template `frontend` + 5 Outils d'Interface

```
Prompt: "Teste l'interface utilisateur"
→ Template: frontend
→ Outils: [playwright_navigate, playwright_click, playwright_screenshot, playwright_type, displayCanvas]
→ Focus: Interaction web, validation visuelle
```

### Template `architect` + 5 Outils de Conception

```
Prompt: "Conçois l'architecture de l'application"
→ Template: architect
→ Outils: [projectPlanning, getDevelopmentPreferences, setDevelopmentPreferences, delegateTask, listTools]
→ Focus: Planification, architecture, coordination
```

## 📊 Avantages de la Spécialisation (1 Prompt = ~5 Outils)

### 1. **Performance Cognitive**

- **Réduction de complexité** : 5 outils vs 15+ outils globaux
- **Spécialisation** : Outils cohérents pour un domaine
- **Précision** : Moins de confusion dans le choix d'outils

### 2. **Optimisation des Tokens**

- **Prompts plus courts** : Seulement les outils pertinents
- **Descriptions ciblées** : Instructions spécialisées par domaine
- **Contexte réduit** : Élimination du bruit informationnel

### 3. **Qualité d'Exécution**

- **Expertise focalisée** : Maîtrise d'un ensemble restreint d'outils
- **Workflows optimisés** : Enchaînements logiques d'outils spécialisés
- **Cohérence** : Actions alignées avec l'objectif du template

## 🏆 Résultat

Cette méthode de **spécialisation cognitive par domaine** transforme un simple prompt textuel en un système agentique expert capable de :

- **Se spécialiser** automatiquement selon le domaine (1 template = ~5 outils)
- **Planifier** avec des outils de coordination
- **Exécuter** avec des outils domain-specific
- **Communiquer** via JSON structuré et validé
- **Visualiser** avec des outils de feedback adaptés
- **Monitorer** via événements Redis temps réel

**Le prompt ordinaire devient un agent spécialisé** doté d'un ensemble restreint mais expert d'outils, optimisant ainsi ses performances et sa précision d'exécution.
