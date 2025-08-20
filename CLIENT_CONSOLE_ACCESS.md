# Accès à la Console du Client depuis le Serveur

Ce document décrit comment implémenter une fonctionnalité permettant au backend (serveur Node.js d'AgenticForge) d'exécuter du code JavaScript dans la console du navigateur client (frontend). Cela utilise l'architecture SSE (Server-Sent Events) et Redis existante.

## Vue d'ensemble

L'idée est de permettre une communication bidirectionnelle via le canal SSE déjà en place :
1. Le **backend** envoie une commande spéciale au **frontend** via SSE.
2. Le **frontend** exécute la commande JavaScript dans le contexte du navigateur.
3. Le **frontend** envoie le résultat à un **endpoint API** du backend.
4. Le **backend** publie le résultat sur le canal Redis du job concerné.
5. L'**agent** reçoit le résultat via le flux d'événements Redis.

## Implémentation

### 1. Côté Frontend (UI)

#### 1.1. Ajouter le gestionnaire dans `useAgentStream`

Modifie le hook `useAgentStream` (fichier `packages/ui/src/lib/hooks/useAgentStream.ts`) pour gérer un nouveau type de message.

```typescript
// Dans useAgentStream.ts
// Ajoute ce cas dans le switch de la fonction onMessage
case 'execute_client_command': {
  if (data.content) {
    try {
      // Exécute la commande JavaScript dans le contexte du navigateur
      // eslint-disable-next-line no-eval
      const result = eval(data.content);
      
      // Convertit le résultat en une chaîne JSONifiable
      let stringResult;
      if (result === undefined) {
        stringResult = "undefined";
      } else if (result === null) {
        stringResult = "null";
      } else if (typeof result === 'object') {
        try {
          stringResult = JSON.stringify(result, null, 2);
        } catch (e) {
          stringResult = `[Unserializable Object: ${result?.constructor?.name || 'Unknown'}]`;
        }
      } else {
        stringResult = String(result);
      }
      
      // Envoie le résultat au backend
      // Assure-toi que authToken et sessionId sont disponibles
      fetch(buildApiUrl('/api/client-console/result'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({
          jobId: jobIdStore, // ou un jobId passé dans le message
          result: stringResult,
          command: data.content
        })
      }).catch(err => {
        console.error("Failed to send client command result to backend:", err);
        // Optionnel: envoyer l'erreur de communication elle-même
      });
    } catch (execError: any) {
      console.error("Error executing client command:", execError);
      // Envoie l'erreur au backend
      fetch(buildApiUrl('/api/client-console/result'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({
          jobId: jobIdStore,
          error: execError.message,
          command: data.content
        })
      }).catch(err => {
        console.error("Failed to send client command error to backend:", err);
      });
    }
  }
  break;
}
```

### 2. Côté Backend (Serveur Node.js)

Le backend a déjà été mis à jour avec :
1. Un outil `client_console` enregistré.
2. Une API dédiée `/api/client-console/*`.

#### 2.1. Vérifier l'enregistrement de l'outil

Assure-toi que l'outil est enregistré dans le registre des outils :
```typescript
// Dans toolRegistry.ts ou un fichier similaire
import { clientConsoleTool } from './clientConsole.tool.js';

toolRegistry.register(clientConsoleTool);
```

## Comment l'utiliser

### Via l'outil `client_console`

Une fois l'outil enregistré, l'agent peut l'utiliser de différentes manières :

1.  **Obtenir de l'aide :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "help"
      }
    }
    ```

2.  **Lister les propriétés de `window` :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "ls"
      }
    }
    ```

3.  **Obtenir l'URL de la page :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "url"
      }
    }
    ```

4.  **Obtenir le titre de la page :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "title"
      }
    }
    ```

5.  **Exécuter une commande JavaScript personnalisée :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "document.querySelector('h1').innerText"
      }
    }
    ```

6.  **Simuler une capture d'écran :**
    ```json
    {
      "name": "client_console",
      "parameters": {
        "command": "screenshot"
      }
    }
    ```

### Via les routes API directement

L'agent peut aussi interagir directement avec les routes API :

1.  **Envoyer une commande :**
    ```bash
    curl -X POST http://localhost:8080/api/client-console/execute \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer VOTRE_TOKEN_AUTH" \
      -H "X-Session-ID: ID_DE_VOTRE_SESSION" \
      -d '{"jobId": "ID_DU_JOB", "command": "document.title"}'
    ```

2.  **Recevoir un résultat (cette action est normalement faite automatiquement par le frontend) :**
    ```bash
    curl -X POST http://localhost:8080/api/client-console/result \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer VOTRE_TOKEN_AUTH" \
      -H "X-Session-ID: ID_DE_VOTRE_SESSION" \
      -d '{"jobId": "ID_DU_JOB", "result": "Titre de la page", "command": "document.title"}'
    ```

## Ce qu'il reste à implémenter

1.  **Sécurité renforcée :**
    *   Mettre en place un système d'autorisation plus strict pour les commandes exécutées via `eval()`.
    *   Implémenter une liste blanche de commandes autorisées pour limiter les risques.
    *   Ajouter une validation côté serveur des commandes reçues.

2.  **Gestion des erreurs côté frontend :**
    *   Améliorer la gestion des erreurs dans le bloc `catch` du frontend pour fournir plus de détails.
    *   Ajouter une limite de temps d'exécution pour éviter les boucles infinies.

3.  **Commandes prédéfinies avancées :**
    *   Ajouter plus de commandes prédéfinies utiles comme `click(selector)`, `fill(selector, value)`, etc.
    *   Implémenter des commandes pour interagir avec le DOM de manière plus complexe.

4.  **Support des captures d'écran réelles :**
    *   Remplacer la simulation de capture d'écran par une implémentation réelle utilisant les capacités du navigateur.

5.  **Tests automatisés :**
    *   Écrire des tests unitaires pour l'outil `client_console`.
    *   Créer des tests d'intégration pour l'API `/api/client-console/*`.

6.  **Documentation utilisateur :**
    *   Ajouter une documentation plus détaillée sur l'utilisation de l'outil dans le contexte d'AgenticForge.
    *   Créer des exemples de scénarios d'utilisation complets.

## Tests

Pour tester cette fonctionnalité :
1. Démarre AgenticForge normalement (`./run.sh start`).
2. Accède à l'interface sur `http://localhost:3002` (ou le port configuré).
3. Utilise l'outil `client_console` depuis un agent.
4. Vérifie que les résultats sont correctement renvoyés à l'agent.