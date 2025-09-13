# Exécution Automatique des Tâches de Test

Ce répertoire contient les outils nécessaires pour exécuter automatiquement les tâches de test définies dans le fichier [taches.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/taches.md).

## Fichiers Disponibles

1. **[agent_instructions.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/agent_instructions.md)** - Instructions détaillées pour un agent humain
2. **[taches.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/taches.md)** - Fichier source des tâches (déjà existant)

## Utilisation

### Pour un agent humain

Lisez attentivement le fichier [agent_instructions.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/agent_instructions.md) qui contient toutes les instructions détaillées pour exécuter les tâches une par une.

## Prérequis

1. AgenticForge doit être démarré avec `./run.sh start`
2. Les services doivent être accessibles sur http://localhost:3002
3. Le fichier worker.log doit être accessible pour la vérification des logs

## Structure des Tâches

Les tâches sont organisées par catégories dans [taches.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/taches.md) :

- Opérations sur les fichiers
- Gestion de todo lists
- Affichage dans le canvas
- Outils d'IA
- Gestion de session
- Exécution de commandes
- Tests Browser Live (Playwright)
- Tests Alpha Vantage

## Sélection des Prompts Système

Chaque tâche utilise un prompt système spécifique selon sa catégorie :

- `code` : Opérations techniques (fichiers, commandes)
- `architect` : Conception et visualisation
- `ask` : Recherche et communication
- `orchestrator` : Gestion de projets complexes
- `debug` : Débogage et analyse
- `trader` : Analyse financière

## Bonnes Pratiques

1. Vérifiez toujours les logs après chaque exécution
2. Corrigez les erreurs avant de passer à la tâche suivante
3. Marquez les tâches comme complétées dans [taches.md](file:///home/demon/agentforge/AgenticForge2/AgenticForge/taches.md)
4. Testez les scripts avec quelques tâches avant exécution complète
