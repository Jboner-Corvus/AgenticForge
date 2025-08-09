---
## 🧪 Procédure de Test Automatisée pour l'Agent
---

**Goal:** Automatically run 50 tests, check if they pass, and fix any failures.

### Agent Instructions:

For each test in the list, follow these 6 steps:

1.  **Run the Test:** Use `python AgenticForge/commander.py <test_number>` to start the test.
2.  **Monitor Progress:** Check the end of `AgenticForge/worker.log` to see what's happening.
3.  **Verify Result:**
    * Confirm the test's task was received and finished successfully.
    * Check `/home/demon/agentforge/workspace` to make sure the expected action (e.g., file created, data read) actually happened.
4.  **Handle Failures:**
    * If a test fails or doesn't produce the right result, review the logs and code to find out why.
    * Fix the code or settings.
    * Rerun the test until it passes.
5.  **Mark as Complete:** Once a test passes and is validated, mark it as finished in this file and add any issues you encountered.

---

### Commandes à Tester

-   [x] 1. Lister les fichiers et dossiers 
-   [x] 2. Créer un fichier rapport.txt
-   [x] 3. Lire le contenu du fichier rapport.txt
-   [x] 4. Remplacer première par seconde
-   [x] 5. Exécuter une commande shell
-   [x] 6. Exécuter ls -la et montre la sortie. 
-   [ ] 7. Faire une recherche web  
-   [ ] 8. Naviguer sur une page web 
-   [x] 9. Lister les outils disponibles
-   [x] 10. Créer un nouvel outil dire_bonjour (ÉCHEC - Quota API dépassé) 
-   [x] 11. Créer et lire un fichier de tâches
-   [x] 12. Chercher la date et l'enregistrer (Complété le 2025-08-02)
-   [x] 13. Écrire et exécuter un script de calcul
-   [x] 14. Compter les fichiers dans le Workspace
-   [ ] 15. Naviguer, extraire et résumer 
-   [x] 16. Créer et lire une config JSON
-   [x] 17. Créer une arborescence de projet
-   [x] 18. Analyser un fichier et agir (Complété le 2025-08-02)
-   [x] 19. Écrire un script Python qui lit un fichier (Complété le 2025-08-02)
-   [x] 20. Vérifier l'environnement de développement
-   [x] 21. Déboguer et corriger un script Python (Complété le 2025-08-02)
-   [ ] 22. Créer un manifeste du Workspace (ÉCHEC - Timeout)
-   [ ] 23. Exécuter un audit de qualité du code (ÉCHEC - Agent bloqué dans une boucle)
-   [ ] 24. Comparer deux fichiers
-   [ ] 25. Archiver le Workspace 
-   [ ] 26. Créer un outil pour obtenir un timestamp (ÉCHEC - Problème d'environnement avec lint:fix)
-   [x] 27. Créer et utiliser un outil UUID (Complété le 2025-08-03)
-   [x] 28. Créer un outil qui en appelle un autre (Complété le 2025-08-03)
-   [x] 29. Améliorer un outil existant (Complété le 2025-08-03)
-   [x] 30. Planifier et créer un outil abstrait (Complété le 2025-08-03)
-   [x] 31. Créer un site web statique "Portfolio" (Complété le 2025-08-03)
-   [x] 32. Développer un outil CLI Node pour gérer des tâches (Complété le 2025-08-03)
-   [x] 33. Mettre en place une API Web minimale avec Javascript pnpm (Complété le 2025-08-03)
-   [x] 34. Créer un composant React pour l'UI existante (Complété le 2025-08-03)
-   [ ] 35. Scraper des données cosmologiques et les analyser
-   [x] 36. Créer un script d'initialisation de projet (Complété le 2025-08-03)
-   [x] 37. Convertisseur Markdown vers HTML (Complété le 2025-08-03)
-   [x] 38. Créer un outil pour interagir avec une API publique (Complété le 2025-08-03)
-   [x] 39. Générer et exécuter des tests unitaires pour un script (Complété le 2025-08-03)
-   [ ] 40. Refactoriser un script pour la clarté et l'efficacité
-   [ ] 41. Conteneuriser l'API Express/Node avec un Dockerfile
-   [ ] 42. Créer une base de données SQLite et l'intégrer à un script
-   [ ] 43. Développer une application "Livre d'Or" Full-Stack
-   [ ] 44. Automatiser des tâches basées sur un fichier YAML
-   [ ] 45. Écrire un script de "benchmark" de performance
-   [ ] 46. Générer la documentation technique d'un projet
-   [ ] 47. Créer un workflow Git (Branches et Merge)
-   [ ] 48. Créer une micro-librairie Typescript et l'utiliser
-   [ ] 49. Résoudre un problème logique en "Chain-of-Thought"
-   [ ] 50. Développer les tests les plus critiques d'une grosse Biblio comme Fastmcp
-   [ ] 51. Développer un outil pour faire la maintenance du systeme,
-   [ ] 52. Développer un leger antivirus pour le systeme
-   [ ] 53. Développer un antyspyware pour trouver des malwares
-   [ ] 54. Fait moi un site internet sur la cosmologie host la node et affiche le site dans le canvas



