# AgenticForge Agent Workspace

## Vue d'ensemble

Bienvenue dans votre workspace dédié ! Ce dossier est configuré comme votre **dossier racine** et votre **home directory** par défaut.

## Configuration

- **Chemin relatif** : `./packages/core/workspace` (depuis le répertoire racine du projet)
- **Variable d'environnement** : `WORKSPACE_PATH` définie dans tous les scripts de lancement
- **Accès** : Lecture/écriture complète pour l'agent
- **Persistance** : Les fichiers créés ici sont conservés entre les redémarrages

## Structure recommandée

```
workspace/
├── projects/          # Projets utilisateur et code généré
├── temp/             # Fichiers temporaires
├── data/             # Données persistantes
├── logs/             # Logs de l'agent
├── backups/          # Sauvegardes
└── README.md         # Cette documentation
```

## Capacités

Vous pouvez :
- ✅ Créer, modifier et supprimer des fichiers
- ✅ Créer des sous-dossiers
- ✅ Accéder aux fichiers en dehors de ce workspace (avec confirmation)
- ✅ Utiliser ce dossier comme base pour vos opérations
- ✅ Persister vos données entre les sessions

## Commandes importantes

```bash
# Redémarrer l'agent avec le nouveau workspace
./run-v2.sh restart-worker

# Vérifier le statut
./run-v2.sh status

# Voir les logs
tail -f worker.log
```

## Sécurité

- Les opérations en dehors de ce workspace nécessitent une confirmation explicite
- Toutes les actions sont tracées dans les logs
- L'accès est restreint aux utilisateurs autorisés

---

*Ce workspace est automatiquement créé et configuré lors de l'installation ou du rebuild du système.*