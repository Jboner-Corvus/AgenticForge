---
## 🧪 Procédure de Test Automatisée pour l'Agent
---

**Goal:** Automatically run 50 tests, check if they pass, and fix any failures.

### Agent Instructions:

For each test in the list, follow these 6 steps:

1.  **Run the Test:** Use `python AgenticForge/exec_Test.py <test_number>` to start the test.
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
-   [ ] 6. Exécuter ls -la et montre la sortie. 
-   [ ] 7. Faire une recherche web 
-   [ ] 8. Naviguer sur une page web
-   [ ] 9. Lister les outils disponibles
-   [ ] 10. Créer un nouvel outil dire_bonjour 
-   [ ] 11. Créer et lire un fichier de tâches
-   [ ] 12. Chercher la date et l'enregistrer
-   [ ] 13. Écrire et exécuter un script de calcul
-   [ ] 14. Compter les fichiers dans le Workspace
-   [ ] 15. Naviguer, extraire et résumer
-   [ ] 16. Créer et lire une config JSON
-   [ ] 17. Créer une arborescence de projet
-   [ ] 18. Analyser un fichier et agir
-   [ ] 19. Écrire un script Python qui lit un fichier
-   [ ] 20. Vérifier l'environnement de développement
-   [ ] 21. Déboguer et corriger un script Python
-   [ ] 22. Créer un manifeste du Workspace
-   [ ] 23. Exécuter un audit de qualité du code
-   [ ] 24. Comparer deux fichiers
-   [ ] 25. Archiver le Workspace
-   [ ] 26. Créer un outil pour obtenir un timestamp
-   [ ] 27. Créer et utiliser un outil UUID
-   [ ] 28. Créer un outil qui en appelle un autre
-   [ ] 29. Améliorer un outil existant
-   [ ] 30. Planifier et créer un outil abstrait
-   [ ] 31. Créer un site web statique "Portfolio"
-   [ ] 32. Développer un outil CLI Node pour gérer des tâches
-   [ ] 33. Mettre en place une API Web minimale avec Javascript pnpm
-   [ ] 34. Créer un composant React pour l'UI existante
-   [ ] 35. Scraper des données cosmologiques et les analyser
-   [ ] 36. Créer un script d'initialisation de projet
-   [ ] 37. Convertisseur Markdown vers HTML
-   [ ] 38. Créer un outil pour interagir avec une API publique
-   [ ] 39. Générer et exécuter des tests unitaires pour un script
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