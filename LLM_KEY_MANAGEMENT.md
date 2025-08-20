# Gestion des Clés API LLM

Ce document explique le fonctionnement du système de gestion des clés API LLM dans AgenticForge, y compris la synchronisation automatique de la clé maîtresse.

## Aperçu

AgenticForge utilise un `LlmKeyManager` centralisé pour gérer les clés API des fournisseurs LLM (comme Google Gemini, OpenAI, Anthropic). Ce gestionnaire :

1.  Stocke les clés dans Redis.
2.  Gère la rotation et la priorité des clés.
3.  Désactive automatiquement les clés qui échouent de manière temporaire ou permanente.
4.  Fournit une API pour que l'interface utilisateur puisse afficher, ajouter, supprimer et tester les clés.

## Hiérarchie et Priorité des Clés

Les clés sont utilisées selon un ordre de priorité basé sur leur position dans la liste Redis `llmApiKeys`.

1.  **Priorité Maximale : Clé Maîtresse (`.env`)**
    *   La clé définie dans le fichier `.env` du serveur (variable `LLM_API_KEY` ou `MASTER_LLM_API_KEY`) est considérée comme la clé de secours ultime.
    *   Au démarrage du serveur (`webServer.ts`), une tâche de synchronisation (`_LlmKeyManager.syncEnvMasterKey()`) s'assure que cette clé est présente **en première position** dans la liste Redis `llmApiKeys`. Cela lui garantit la priorité absolue.
    *   Si la clé est déjà présente, elle est mise à jour (son statut est réinitialisé si elle était désactivée, et elle est remise en tête de liste).
    *   Cela signifie que si toutes les autres clés échouent ou sont désactivées, le système tentera toujours d'utiliser cette clé maîtresse.

2.  **Clés Utilisateurs**
    *   Les clés ajoutées via l'interface "LLM Key Manager" de l'application sont stockées dans la liste Redis `llmApiKeys`.
    *   Lorsqu'une clé est utilisée, si elle échoue de manière temporaire (par exemple, quota atteint), elle est désactivée pour 5 minutes. Si elle échoue de manière permanente (clé invalide), elle est marquée comme telle.
    *   Le système essaie les clés dans l'ordre de la liste, en sautant celles qui sont désactivées. Vous pouvez réorganiser cette liste via l'interface pour définir vos préférences de priorité.

## Synchronisation de la Clé Maîtresse

### Fonctionnement

La méthode `LlmKeyManager.syncEnvMasterKey()` est appelée au démarrage du serveur.

1.  **Lecture de la Clé :** Elle lit d'abord la variable d'environnement `MASTER_LLM_API_KEY`. Si elle n'est pas définie, elle utilise `LLM_API_KEY` (généralement définie dans `.env`).
2.  **Validation :** Si aucune clé n'est trouvée ou si elle est vide, la synchronisation est ignorée avec un message d'info.
3.  **Recherche :** Elle vérifie si une clé avec le même `provider` (par défaut `google-flash`), `model` (par défaut `gemini-2.5-flash`) et `apiKey` existe déjà dans la liste Redis.
4.  **Mise à Jour ou Ajout :**
    *   **Si la clé existe :** Son statut est réinitialisé (elle devient active) et elle est déplacée en **première position** de la liste.
    *   **Si la clé n'existe pas :** Elle est créée avec les paramètres par défaut (`provider: google-flash`, `model: gemini-2.5-flash`, active) et ajoutée en **première position**.

### Avantages

*   **Résilience :** Une clé valide dans `.env` agit comme un filet de sécurité.
*   **Configuration Simplifiée :** Pas besoin d'ajouter manuellement la clé `.env` via l'interface.
*   **Priorité Garantie :** La clé `.env` est toujours essayée en premier.

### Variables d'Environnement

*   `LLM_API_KEY` : (Recommandé) La clé API LLM principale, définie dans `.env`.
*   `MASTER_LLM_API_KEY` : (Optionnel) Une variable d'environnement dédiée pour la clé maîtresse, qui a priorité sur `LLM_API_KEY` si elle est définie.

## Tests de Disponibilité et Rotation Proactive (Fonctionnalité Préparatoire)

Une base pour une rotation proactive et en temps réel des clés a été posée. Le système peut tester périodiquement la disponibilité de toutes les clés.

### Mécanisme Actuel (Simulation)

*   Une méthode `LlmKeyManager.testAllKeys(dryRun: boolean)` a été ajoutée.
*   Actuellement, elle est configurée pour s'exécuter en mode `dryRun = true`. Cela signifie qu'elle effectue les tests de manière simulée et ne modifie **pas** l'état réel des clés dans Redis. Elle se contente de logger les résultats.
*   Un appel planifié (commenté dans `webServer.ts`) peut être activé pour exécuter ce test toutes les 30 minutes.

### Objectif Futur

1.  **`testAllKeys(false)`** : En passant `dryRun` à `false`, la méthode pourra réellement mettre à jour l'état des clés (réinitialiser les compteurs, désactiver temporairement celles qui échouent).
2.  **Planification Active** : Décommenter l'appel `setInterval` dans `webServer.ts` pour activer les tests automatiques.
3.  **Tests Réels** : Implémenter la fonction `simulateKeyTest` pour effectuer de vrais appels "légers" aux APIs des fournisseurs (ex: `HEAD /v1/models` pour OpenAI, un simple appel de completion avec un prompt minimal pour Google).
4.  **Rotation en Temps Réel** : Lorsqu'une clé est détectée comme épuisée ou en échec, le système pourra immédiatement la désactiver et passer à la suivante, même au milieu d'une longue tâche d'agent.

Cette base permettra d'évoluer vers un système de gestion de clés très robuste et autonome.

## Interface Utilisateur

L'interface utilisateur (frontend) permet de gérer les clés API LLM de manière intuitive :

1.  **Affichage des Clés :** Liste de toutes les clés API avec leur statut, fournisseur, modèle et autres détails.
2.  **Ajout de Clés :** Formulaire pour ajouter de nouvelles clés API avec les champs appropriés.
3.  **Modification de Clés :** Possibilité de modifier les détails des clés existantes.
4.  **Suppression de Clés :** Fonction pour supprimer les clés API non nécessaires.
5.  **Activation/Désactivation :** Boutons pour activer ou désactiver rapidement une clé.
6.  **Test de Clés :** Fonction pour tester manuellement une clé API spécifique.
7.  **Classement :** Affichage du classement des clés API basé sur leur utilisation et performance.
8.  **Statistiques :** Panneau de statistiques montrant l'utilisation globale des clés API.

## Pour les Agents

Les agents n'ont pas à se soucier de la gestion des clés. Le `LlmKeyManager` est utilisé en interne par le code qui effectue les appels LLM (`LlmModule` ou similaire). Voici le flux simplifié :

1.  **Demande de Clé :** Le module LLM demande une clé disponible pour un `provider` et un `model` donnés.
2.  **Sélection :** `LlmKeyManager.getNextAvailableKey()` parcourt la liste `llmApiKeys` du début à la fin.
3.  **Utilisation :** La première clé active trouvée est retournée et utilisée pour l'appel API.
4.  **Gestion d'Erreurs :**
    *   Si l'appel réussit, le compteur d'erreurs de la clé est remis à zéro.
    *   Si l'appel échoue, `LlmKeyManager.markKeyAsBad()` est appelé.
    *   Selon le type d'erreur (temporaire/permanent), la clé est désactivée temporairement ou de manière permanente.
5.  **Retry :** Si une clé échoue, le processus peut être répété pour essayer la clé suivante dans la liste.

En résumé, la clé maîtresse `.env` est votre assurance pour que le système fonctionne, tandis que l'interface permet une gestion fine et dynamique de clés supplémentaires. La rotation proactive est en cours de préparation.