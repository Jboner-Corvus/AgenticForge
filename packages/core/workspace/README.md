# AgenticForge Unified Workspace

Bienvenue dans votre workspace unifié !

**Chemin absolu :** `/home/demon/agentforge/AgenticForge2/AgenticForge/packages/core/workspace`
**WORKSPACE_PATH :** Défini dans .env et config.ts pour tous les outils
**Statut :** Workspace unifié pour TOUS les outils et composants

## Structure :
- projects/ - Vos projets utilisateur
- temp/ - Fichiers temporaires
- data/ - Données persistantes
- logs/ - Logs de l'agent
- backups/ - Sauvegardes automatiques

## Configuration :
- ✅ Utilisé par tous les outils (fs, shell, etc.)
- ✅ Défini dans WORKSPACE_PATH de .env
- ✅ Valeur par défaut dans config.ts
- ✅ Chemin absolu pour éviter les ambiguïtés
- ✅ Confinement strict des opérations

## Utilisation :
Tous les outils et composants utilisent maintenant ce même workspace unifié !
Cela garantit la cohérence et évite les conflits entre différents composants.

Dernière mise à jour : $(date)
