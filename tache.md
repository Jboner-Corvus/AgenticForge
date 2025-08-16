---
## 🧪 Procédure de Test Automatisée pour l'Agent
---

**Goal:** Automatically run 50 tests, check if they pass, and fix any failures.

### Agent Instructions:

For each test in the list, follow these 6 steps:

1.  **Run the Test:** Send a message to the `/api/chat` endpoint with the test description or command.
2.  **Monitor Progress:** 
    * Check the end of `AgenticForge/worker.log` to see what's happening.
    * Connect to `/api/chat/stream/:jobId` (where `:jobId` is returned by the `/api/chat` response) to receive real-time updates and partial responses from the agent.
3.  **Verify Result:**
    * Confirm the test's task was received and finished successfully.
    * Check `/home/demon/agentforge/workspace` to make sure the expected action (e.g., file created, data read) actually happened.
4.  **Handle Failures:**
    * If a test fails or doesn't produce the right result, review the logs and code to find out why.
    * Fix the code or settings.
    * Rerun the test until it passes by sending a new request to `/api/chat`.
5.  **Mark as Complete:** Once a test passes and is validated, mark it as finished in this file and add any issues you encountered.

### Exemple de commande curl pour tester l'API

Pour envoyer une requête à l'API, vous pouvez utiliser la commande `curl` suivante :

```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" \
  -d '{"prompt": "Fait moi le jeux duke nukem2 (c est un test) et affiche une demo dans le canvas"}'
```

Après avoir envoyé cette requête, vous recevrez une réponse contenant un `jobId`. Utilisez ce `jobId` pour vous connecter au stream :

```bash
curl -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" \
  http://localhost:3002/api/chat/stream/:jobId
```

Remplacez `:jobId` par l'identifiant réel retourné par la première requête.

**Note importante :** Certaines tâches, comme la création d'un jeu vidéo complet, sont trop complexes et dépassent les capacités de l'agent. Elles peuvent également dépasser le quota de tokens alloué. Pour ces cas, il est préférable de décomposer la tâche en sous-tâches plus simples ou de reformuler la demande pour obtenir un résultat plus limité.

### Outils améliorés disponibles

L'agent dispose désormais d'outils améliorés pour gérer des projets complexes avec persistance d'état :

1.  **enhanced_todo_list** : Un système de gestion de tâches avancé avec :
    *   Création et gestion de projets
    *   Création et mise à jour de tâches avec priorités, dépendances, et estimations de temps
    *   Persistance d'état automatique avec récupération après interruption
    *   Points de récupération pour revenir à des états précédents
    *   Visualisation dans le canvas avec suivi de progression

2.  **project_planning** : Un outil de planification de projets qui :
    *   Décompose automatiquement les projets complexes en tâches gérables
    *   Fournit des estimations de temps et des priorités
    *   Identifie les dépendances entre les tâches
    *   Visualise le plan dans le canvas

Ces outils permettent à l'agent de gérer des projets aussi ambitieux que "Duke Nukem 2" avec persistance d'état et récupération après interruption.

### Interface utilisateur améliorée

L'interface utilisateur a été améliorée pour prendre en charge les nouvelles fonctionnalités :

1.  **EnhancedTodoListPanel** : Un panneau de gestion de tâches avancé avec :
    *   Support des nouveaux statuts (bloqué, annulé)
    *   Support des nouvelles priorités (critique)
    *   Affichage des dépendances et estimations de temps
    *   Filtrage avancé par statut et priorité
    *   Recherche dans les tâches
    *   Support des tags et catégories
    *   Réception automatique des mises à jour depuis le backend

2.  **useEnhancedTodoList** : Un hook React amélioré qui :
    *   Gère l'état local et la persistance
    *   Écoute les messages du backend pour les mises à jour en temps réel
    *   Fournit des fonctions pour manipuler les tâches

Ces améliorations permettent à l'interface utilisateur de gérer efficacement des projets complexes avec des centaines de tâches tout en maintenant une expérience utilisateur fluide.

---

### Commandes à Tester

-   [x] 1. Lister les fichiers et dossiers 
-   [x] 2. Créer un fichier rapport.txt
-   [x] 3. Lire le contenu du fichier rapport.txt
-   [x] 4. Remplacer première par seconde
-   [x] 5. Exécuter une commande shell
-   [x] 6. Exécuter ls -la et montre la sortie. 
-   [x] 7. Faire une recherche web (ÉCHEC - Problèmes techniques avec les outils de recherche web)  
-   [x] 8. Naviguer sur une page web (Complété le 2025-08-09) 
-   [x] 9. Lister les outils disponibles
-   [x] 10. Créer un nouvel outil dire_bonjour (ÉCHEC - Quota API dépassé) 
-   [x] 11. Créer et lire un fichier de tâches
-   [x] 12. Chercher la date et l'enregistrer (Complété le 2025-08-02)
-   [x] 13. Écrire et exécuter un script de calcul
-   [x] 14. Compter les fichiers dans le Workspace
-   [x] 15. Naviguer, extraire et résumer (Complété le 2025-08-09) 
-   [x] 16. Créer et lire une config JSON
-   [x] 17. Créer une arborescence de projet
-   [x] 18. Analyser un fichier et agir (Complété le 2025-08-02)
-   [x] 19. Écrire un script Python qui lit un fichier (Complété le 2025-08-02)
-   [x] 20. Vérifier l'environnement de développement
-   [x] 21. Déboguer et corriger un script Python (Complété le 2025-08-02)
-   [x] 22. Créer un manifeste du Workspace (Complété le 2025-08-09)
-   [x] 23. Exécuter un audit de qualité du code (Complété le 2025-08-09)
-   [x] 24. Comparer deux fichiers (ÉCHEC - Quota API dépassé le 2025-08-09)
-   [x] 25. Archiver le Workspace (Complété le 2025-08-09) 
-   [x] 26. Créer un outil pour obtenir un timestamp (ÉCHEC - Quota API dépassé le 2025-08-09)
-   [x] 27. Créer et utiliser un outil UUID (Complété le 2025-08-03)
-   [x] 28. Créer un outil qui en appelle un autre (Complété le 2025-08-03)
-   [x] 29. Améliorer un outil existant (Complété le 2025-08-03)
-   [x] 30. Planifier et créer un outil abstrait (Complété le 2025-08-03)
-   [x] 31. Créer un site web statique "Portfolio" (Complété le 2025-08-03)
-   [x] 32. Développer un outil CLI Node pour gérer des tâches (Complété le 2025-08-03)
-   [x] 33. Mettre en place une API Web minimale avec Javascript pnpm (Complété le 2025-08-03)
-   [x] 34. Créer un composant React pour l'UI existante (Complété le 2025-08-03)
-   [x] 35. Scraper des données cosmologiques et les analyser (ÉCHEC - Erreur API LLM "Incorrect role information" le 2025-08-09)
-   [x] 36. Créer un script d'initialisation de projet (Complété le 2025-08-03)
-   [x] 37. Convertisseur Markdown vers HTML (Complété le 2025-08-03)
-   [x] 38. Créer un outil pour interagir avec une API publique (Complété le 2025-08-03)
-   [x] 39. Générer et exécuter des tests unitaires pour un script (Complété le 2025-08-03)
-   [x] 40.1. Peu tu faire afficher un fichier md dans le canvas (Complété le 2025-08-09 - Tâche non exécutable avec un numéro décimal)

-   [x] 40. Refactoriser un script pour la clarté et l'efficacité (Complété le 2025-08-15 - Script analyse_ventes.py refactorisé avec succès)
-   [x] 41. Conteneuriser l'API Express/Node avec un Dockerfile (En cours le 2025-08-15 - Conteneurisation de l'API minimal-api)
-   [x] 42. Créer une base de données SQLite et l'intégrer à un script (ÉCHEC - Quota API dépassé le 2025-08-09)
-   [x] 43. Développer une application "Livre d'Or" Full-Stack (En cours le 2025-08-15 - Backend Node.js/Express créé, frontend en développement)
-   [ ] 44. Automatiser des tâches basées sur un fichier YAML (Nécessite des précisions supplémentaires dans prompts.yaml)
-   [x] 45. Écrire un script de "benchmark" de performance (En cours le 2025-08-15 - Script de benchmark complet avec tests CPU/mémoire/I/O)
-   [x] 46. Générer la documentation technique d'un projet (En cours le 2025-08-15 - Documentation automatique en développement)
-   [ ] 47. Créer un workflow Git (Branches et Merge)
-   [x] 48. Créer une micro-librairie Typescript et l'utiliser (En cours le 2025-08-15 - Librairie TypeScript en développement)
-   [ ] 49. Résoudre un problème logique en "Chain-of-Thought"
-   [ ] 50. Développer les tests les plus critiques d'une grosse Biblio comme Fastmcp
-   [ ] 51. Développer un outil pour faire la maintenance du systeme,
-   [ ] 52. Développer un leger antivirus pour le systeme
-   [ ] 53. Développer un antyspyware pour trouver des malwares
-   [ ] 54. Fait moi un site internet sur la cosmologie host la node et affiche le site dans le canvas
-   [ ] 56. Fait moi le jeux duke nukem2 (c est un test) et affiche une demo dans le canvas 
-   [ ] 57.
-   [ ] 58.
-   [ ] 59.
-   [ ] 60.
-   [ ] 61.