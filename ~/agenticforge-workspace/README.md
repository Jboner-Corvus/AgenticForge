# AgenticForge System Workspace

Ce workspace système est utilisé par AgenticForge pour stocker les fichiers et données de l'agent en production.

## Structure des dossiers

- `projects/` - Projets utilisateur et code généré par l'agent
- `temp/` - Fichiers temporaires et cache
- `logs/` - Logs de l'agent et historique des opérations
- `data/` - Données persistantes et configurations
- `backups/` - Sauvegardes automatiques

## Configuration

- **Chemin:** `/home/demon/agenticforge-workspace`
- **Propriétaire:** Utilisateur système (pas Docker)
- **Accès:** Lecture/écriture pour l'utilisateur demon

## Utilisation

L'agent peut :
- Créer et modifier des fichiers dans ce workspace
- Accéder aux fichiers en dehors du workspace si demandé explicitement
- Utiliser ce dossier comme espace de travail par défaut

## Sécurité

- Fichiers en dehors du workspace nécessitent une approbation explicite
- Toutes les opérations sont tracées dans les logs
- Accès restreint aux utilisateurs autorisés

## Maintenance

Ce workspace est créé automatiquement lors de l'installation ou du rebuild du système.