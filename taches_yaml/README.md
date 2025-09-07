# Tâches de test pour AgenticForge - Structure YAML

Cette structure organisée en fichiers YAML remplace le fichier [taches.md](..//taches.md) pour une meilleure lisibilité et maintenabilité.

## Structure des fichiers

- `summary.yaml` : Résumé de toutes les catégories de tâches avec statistiques
- `file_operations.yaml` : Tests des opérations sur les fichiers
- `todo_lists.yaml` : Tests de gestion de todo lists
- `canvas_display.yaml` : Tests de l'affichage dans le canvas
- `ai_tools.yaml` : Tests des outils d'IA
- `session_management.yaml` : Tests de gestion de session
- `command_execution.yaml` : Tests d'exécution de commandes
- `browser_automation.yaml` : Tests Browser Live (Playwright)

## Avantages de la structure YAML

1. **Hiérarchie claire** : Organisation par catégories et sous-catégories
2. **Métadonnées riches** : Chaque tâche inclut priorité, difficulté, tags, etc.
3. **Facile à parser** : Peut être lu programmatiquement pour générer des rapports
4. **Meilleure maintenabilité** : Fichiers plus petits et ciblés
5. **Recherche facilitée** : Tags permettant de filtrer les tâches

## Format des tâches

Chaque tâche comprend :

- `id` : Identifiant unique
- `description` : Description de la tâche
- `status` : Statut (completed, pending, in_progress)
- `priority` : Priorité (high, medium, low)
- `difficulty` : Difficulté (basic, intermediate, advanced, expert)
- `system_prompt` : Prompt système recommandé
- `tags` : Mots-clés pour le filtrage

## Utilisation

Pour convertir tous les fichiers YAML en un rapport HTML ou pour suivre la progression, vous pouvez écrire un script simple qui lit tous les fichiers YAML et génère le format souhaité.
