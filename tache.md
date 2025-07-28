
 
 🧪 Procédure de Test Standard pour l'Agent

Prérequis : Assurez-vous que tous les services sont démarrés avec la commande (run.sh status) sinon (run.sh restart).


Instructions :
Exécute chaque commande curl ci-dessous, une par une. Pour chaque commande :


1 Exécute la requête.

2 Consulte les logs du worker (sh run.sh logs worker) pour suivre l'exécution.

3 Confirme que la tâche associée au prompt a été reçue et s'est terminée avec succès et qu elle a bien effectuer sont action.

4 Corrige le code si la tache ne fonctionne pas 

5 Cochez la case `[x]`seulement quand la tache est terminée avec succès



# GUIDE D'UTILISATION DU SCRIPT
# ==============================================================================
#
# Pour lancer une commande, utilisez la structure suivante dans votre terminal
# (CMD, PowerShell, etc.) :
#
#   python3 exec_commande.py <numero_de_la_commande>
#
# Remplacez :
#   - `exec_commande.py` par le nom de ce fichier.
#   - `<numero_de_la_commande>` par le numéro de la tâche à exécuter (de 1 à 50).
#
# ---
# Exemples pratiques :
# ---
#
# 1. Pour lister les fichiers et dossiers (commande n°1) :
#    python3 exec_commande.py 1
#
# 2. Pour créer une archive du répertoire de travail (commande n°25) :
#    python3 exec_commande.py 25
#
# ==============================================================================


Commandes à Tester


[ ] 1. Lister les fichiers et dossiers
[ ] 2. Créer un fichier rapport.txt
[ ] 3. Lire le contenu du fichier rapport.txt
[ ] 4. Remplacer première par seconde
[ ] 5. Exécuter du code Python
[ ] 6. Exécuter une commande shell
[ ] 7. Faire une recherche web
[ ] 8. Naviguer sur une page web
[ ] 9. Lister les outils disponibles
[ ] 10. Créer un nouvel outil dire_bonjour
[ ] 11. Créer et lire un fichier de tâches
[ ] 12. Chercher la date et l'enregistrer
[ ] 13. Écrire et exécuter un script de calcul
[ ] 14. Compter les fichiers dans le Workspace
[ ] 15. Naviguer, extraire et résumer
[ ] 16. Créer et lire une config JSON
[ ] 17. Créer une arborescence de projet
[ ] 18. Analyser un fichier et agir
[ ] 19. Écrire un script Python qui lit un fichier
[ ] 20. Vérifier l'environnement de développement
[ ] 21. Déboguer et corriger un script Python
[ ] 22. Créer un manifeste du Workspace
[ ] 23. Exécuter un audit de qualité du code
[ ] 24. Comparer deux fichiers
[ ] 25. Archiver le Workspace
[ ] 26. Créer un outil pour obtenir un timestamp
[ ] 27. Créer et utiliser un outil UUID
[ ] 28. Créer un outil qui en appelle un autre
[ ] 29. Améliorer un outil existant
[ ] 30. Planifier et créer un outil abstrait
[ ] 31. Créer un site web statique "Portfolio"
[ ] 32. Développer un outil CLI Node pour gérer des tâches
[ ] 33. Mettre en place une API Web minimale avec Javascript pnpm
[ ] 34. Créer un composant React pour l'UI existante
[ ] 35. Scraper des données cosmologiques et les analyser
[ ] 36. Créer un script d'initialisation de projet
[ ] 37. Convertisseur Markdown vers HTML
[ ] 38. Créer un outil pour interagir avec une API publique
[ ] 39. Générer et exécuter des tests unitaires pour un script
[ ] 40. Refactoriser un script pour la clarté et l'efficacité
[ ] 41. Conteneuriser l'API Express/Node avec un Dockerfile
[ ] 42. Créer une base de données SQLite et l'intégrer à un script
[ ] 43. Développer une application "Livre d'Or" Full-Stack
[ ] 44. Automatiser des tâches basées sur un fichier YAML
[ ] 45. Écrire un script de "benchmark" de performance
[ ] 46. Générer la documentation technique d'un projet
[ ] 47. Créer un workflow Git (Branches et Merge)
[ ] 48. Créer une micro-librairie Typescript et l'utiliser
[ ] 49. Résoudre un problème logique en "Chain-of-Thought"
[ ] 50. Développer les tests les plus critiques d'une grosse Biblio comme Fastmcp