# Guide de Visualisation des Logs pour Agent Code

## Introduction

Ce guide explique comment visualiser les logs des workers après l'exécution d'un job. Le nouveau système de logging génère des fichiers structurés qui peuvent être facilement consultés.

## Méthodes pour visualiser les logs

### 1. Via le script simpleLogViewer (recommandé)

Le script `simpleLogViewer.ts` permet de consulter facilement les logs depuis la ligne de commande.

#### Commandes de base

```bash
# Lister tous les jobs avec des logs disponibles
npx tsx packages/core/src/simpleLogViewer.ts list

# Afficher les logs d'un job spécifique
npx tsx packages/core/src/simpleLogViewer.ts job <jobId>

# Afficher un résumé d'un job
npx tsx packages/core/src/simpleLogViewer.ts summary <jobId>

# Rechercher un texte dans les logs
npx tsx packages/core/src/simpleLogViewer.ts search "erreur" --job <jobId>

# Afficher les métriques d'un job
npx tsx packages/core/src/simpleLogViewer.ts metrics <jobId>
```

#### Options utiles

```bash
# Limiter le nombre de logs affichés
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --limit 20

# Afficher uniquement les erreurs
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --error

# Afficher uniquement les avertissements
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --warn

# Filtrer par type de log (tool, perf, metric)
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --type tool

# Afficher au format JSON
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --json
```

### 2. Via le code TypeScript

Vous pouvez également utiliser le LogViewer directement dans votre code :

```typescript
import { LogViewer } from './packages/core/src/logViewer';

// Créer une instance du viewer
const viewer = new LogViewer('./logs');

// Lister les jobs disponibles
const jobs = viewer.getLogFiles();
console.log('Jobs disponibles:', jobs);

// Voir les logs d'un job spécifique
const logs = viewer.getLogsForJob('job-id-123');
viewer.displayLogs(logs);

// Voir les métriques d'un job
const metrics = viewer.getMetricsForJob('job-id-123');
console.log('Métriques:', metrics);
```

### 3. Lecture directe des fichiers

Les logs sont stockés dans le répertoire `./logs` au format JSON :

```bash
# Lister les fichiers de logs
ls -la ./logs/

# Lire un fichier de log spécifique
cat ./logs/worker-job-id-123-2023-10-05T14-20-00-000Z.log

# Utiliser jq pour filtrer les logs
cat ./logs/worker-*.log | jq 'select(.level == "error")'
```

## Structure des logs

Chaque entrée de log est un objet JSON avec les champs suivants :

```json
{
  "level": "info",
  "type": "info",
  "timestamp": "2023-10-05T14:20:00.000Z",
  "service": "worker",
  "jobId": "job-id-123",
  "sessionId": "session-id-456",
  "msg": "Message du log",
  "metrics": {
    "uptime": 5000,
    "memoryUsage": {...},
    "toolExecutions": {...},
    "errors": 0,
    "warnings": 1
  }
}
```

## Types de logs spécialisés

### Logs d'exécution d'outils
```json
{
  "type": "tool",
  "toolName": "executeShellCommand",
  "action": "end",
  "duration": 150
}
```

### Logs de performance
```json
{
  "type": "perf",
  "operation": "agent_execution",
  "duration": 2500
}
```

### Logs de métriques
```json
{
  "type": "metric",
  "metricName": "custom_metric",
  "value": 42,
  "unit": "units"
}
```

## Exemples d'utilisation

### Après l'exécution d'un job

1. **Trouver l'ID du job** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts list
   ```

2. **Voir un résumé rapide** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts summary <jobId>
   ```

3. **Voir les logs détaillés** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts job <jobId>
   ```

4. **Rechercher des erreurs** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --error
   ```

### Débogage d'un problème

1. **Rechercher des erreurs dans tous les logs** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts all --error
   ```

2. **Rechercher un message spécifique** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts search "échec"
   ```

3. **Voir les performances** :
   ```bash
   npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --type perf
   ```

## Conseils pour Kilo Code

1. **Commencez toujours par `summary`** pour avoir une vue d'ensemble du job
2. **Utilisez `--error` pour identifier rapidement les problèmes**
3. **Utilisez `--limit` pour éviter d'être submergé par les logs**
4. **Utilisez `search` pour trouver des informations spécifiques**
5. **Consultez les métriques pour comprendre les performances**

## Fichiers de log

Les fichiers de log sont nommés selon le format :
```
worker-{jobId}-{timestamp}.log
```

Ils sont automatiquement rotés lorsque leur taille dépasse la limite configurée.