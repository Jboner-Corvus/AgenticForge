---
## 🧪 Procédure de Test Automatisée pour l'Agent
---

**Objectif** : Exécuter de manière autonome une série de 50 tests prédéfinis, vérifier leur succès, et corriger les échecs si nécessaire.

### Instructions pour l'Agent :

Vous devez parcourir la liste des tests ci-dessous. Pour chaque test, suivez la procédure suivante :

1.  **Exécuter le Test** : Lancez le test correspondant en utilisant le script `AgenticForge4/exec_Test.py` avec le numéro de commande approprié.
    * **Exemple** : `python AgenticForge4/exec_Test.py <numéro_du_test>`

2.  **Surveiller l'Exécution** : Consultez les logs du worker (`AgenticForge4/worker.log`) pour suivre l'exécution de la tâche.

3.  **Valider le Résultat** :
    * Confirmez que la tâche associée au test a été reçue et s'est terminée avec succès.
    * Vérifiez que l'action attendue par le test a bien été effectuée (par exemple, un fichier créé, une donnée lue, une commande exécutée, etc.).

4.  **Gérer les Échecs** :
    * Si un test échoue ou ne produit pas le résultat attendu, analysez les logs et le code pour identifier la cause du problème.
    * Corrigez le code ou la configuration nécessaire pour que le test puisse réussir.
    * Ré-exécutez le test après la correction jusqu'à ce qu'il réussisse.

5.  **Marquer le Test comme Terminé** : Une fois qu'un test a été exécuté avec succès et validé, marquez-le comme terminé.

---

### Commandes à Tester

-   [ ] 1. Lister les fichiers et dossiers
-   [ ] 2. Créer un fichier rapport.txt
-   [ ] 3. Lire le contenu du fichier rapport.txt
-   [ ] 4. Remplacer première par seconde
-   [ ] 5. Exécuter du code Python
-   [ ] 6. Exécuter une commande shell
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