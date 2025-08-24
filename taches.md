# Tâches de test pour AgenticForge

## Informations importantes

- **Port du serveur API** : 8080
- **URL de base** : http://localhost:8080
- **Endpoint pour les tests** : POST /api/test-chat
- **Token d'authentification** : Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0

## Tâches à effectuer

### 1. Tests basiques des opérations sur les fichiers

- [ ] 1. Créer un fichier avec writeFile
- [ ] 2. Lire un fichier avec readFile
- [ ] 3. Modifier un fichier existant
- [ ] 4. Supprimer un fichier
- [ ] 5. Lister le contenu d'un répertoire
- [x] 6. Créer un répertoire
- [x] 7. Supprimer un répertoire
- [x] 8. Créer une arborescence de fichiers complexes
- [ ] 9. Rechercher des fichiers par motif
- [ ] 10. Obtenir des informations sur un fichier

### 2. Tests basiques de gestion de todo lists

- [ ] 11. Créer une todo list simple
- [ ] 12. Ajouter un élément à une todo list
- [ ] 13. Marquer un élément comme terminé
- [ ] 14. Supprimer un élément de la todo list
- [ ] 15. Créer une todo list avec priorités et dates d'échéance

### 3. Tests de l'affichage dans le canvas

- [ ] 16. Créer un document HTML simple avec display_canvas
- [ ] 17. Créer un document Markdown avec display_canvas
- [ ] 18. Créer un document texte avec display_canvas
- [ ] 19. Afficher une URL dans le canvas

### 4. Tests des outils d'IA

- [ ] 20. Utiliser web_search pour trouver des informations
- [ ] 21. Utiliser finish pour terminer une tâche
- [ ] 22. Utiliser agent_thought pour exprimer une pensée
- [ ] 23. Utiliser agent_response pour répondre directement
- [ ] 24. Utiliser list_tools pour lister les outils disponibles

### 5. Tests de gestion de session

- [ ] 25. Créer une session avec un nom spécifique
- [ ] 26. Renommer une session
- [ ] 27. Lister toutes les sessions
- [ ] 28. Supprimer une session
- [ ] 29. Récupérer les détails d'une session spécifique

### 6. Tests d'exécution de commandes

- [ ] 30. Exécuter une commande shell simple (ls -la)
- [ ] 31. Exécuter une commande shell avec sortie longue
- [ ] 32. Exécuter une commande shell en mode détaché
- [ ] 33. Exécuter une commande shell qui échoue

### 7. Tests de communication et pensées

- [ ] 34. Utiliser agent_thought pour exprimer une pensée
- [ ] 35. Utiliser agent_response pour répondre directement
- [ ] 36. Utiliser finish pour terminer une interaction

### 8. Tests complexes et intégration

- [ ] 37. Créer un jeu simple (comme un jeu de devinette)
- [ ] 38. Créer un site web complet avec HTML/CSS/JS
- [ ] 39. Créer un outil personnalisé et l'utiliser
- [ ] 40. Effectuer un projet complet de A à Z (todo list → développement → test → déploiement)

### 1. Tests avancés des opérations sur les fichiers

- [ ] 41. Créer un fichier avec du contenu encodé en base64
- [ ] 42. Lire et analyser un fichier JSON complexe
- [ ] 43. Modifier un fichier existant sans perdre son contenu
- [ ] 44. Copier un fichier d'un emplacement à un autre
- [ ] 45. Rechercher et remplacer du texte dans un fichier

### 2. Tests avancés du canvas et de la visualisation

- [ ] 46. Créer un diagramme de flux complexe avec plusieurs niveaux
- [ ] 47. Générer un graphique à partir de données fournies
- [ ] 48. Créer un tableau comparatif avec mise en forme
- [ ] 49. Générer un organigramme d'entreprise
- [ ] 50. Créer une timeline d'événements

### 3. Tests avancés des outils d'IA

- [ ] 51. Utiliser web_search pour trouver des informations techniques spécifiques
- [ ] 52. Utiliser web_navigation pour parcourir un site web
- [ ] 53. Combiner plusieurs outils d'IA dans une seule tâche
- [ ] 54. Évaluer la pertinence des résultats de recherche
- [ ] 55. Utiliser l'agent pour résumer un long document

### 4. Tests avancés de gestion de session

- [ ] 56. Créer plusieurs sessions simultanément
- [ ] 57. Basculer entre différentes sessions
- [ ] 58. Exporter l'historique d'une session
- [ ] 59. Importer et continuer une session existante
- [ ] 60. Fusionner deux sessions différentes

### 5. Tests avancés d'exécution de commandes

- [ ] 61. Exécuter une commande avec entrée utilisateur
- [ ] 62. Exécuter une commande avec gestion d'erreurs personnalisée
- [ ] 63. Exécuter une commande avec redirection de sortie
- [ ] 64. Exécuter une commande avec variables d'environnement
- [ ] 65. Exécuter une commande avec gestion de signaux (SIGTERM, SIGKILL)

### 6. Tests de workflows complexes multi-étapes

- [ ] 66. Créer un projet web complet (HTML, CSS, JS) avec documentation
- [ ] 67. Générer un rapport d'analyse de données à partir de fichiers CSV
- [ ] 68. Créer une API REST avec tests et documentation
- [ ] 69. Développer un script d'automatisation de déploiement
- [ ] 70. Créer un système de monitoring avec alertes

### 7. Tests de sécurité et de sécurité

- [ ] 71. Tenter d'accéder à des fichiers système protégés
- [ ] 72. Tenter d'exécuter des commandes avec des privilèges élevés
- [ ] 73. Tester la validation des entrées pour les commandes
- [ ] 74. Tester la gestion des chemins de fichiers dangereux
- [ ] 75. Tester la protection contre les injections de commande

### 8. Tests de performance et de charge

- [ ] 76. Exécuter plusieurs tâches en parallèle
- [ ] 77. Tester les temps de réponse pour des tâches complexes
- [ ] 78. Tester la mémoire utilisée pendant les tâches longues
- [ ] 79. Tester la récupération après une tâche échouée
- [ ] 80. Tester la persistance des sessions après un redémarrage

## Format des requêtes API

Pour tester une tâche, utiliser la commande curl suivante :

```bash
curl -X POST http://localhost:8080/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "Description de la tâche à effectuer",
    "sessionName": "Nom de la session de test"
  }'
```

## Exemple de test

```bash
curl -X POST http://localhost:8080/api/test-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0" \
  -d '{
    "prompt": "Crée un fichier test.txt avec le contenu \"Hello, World!\" et lis le contenu du fichier",
    "sessionName": "Test de base writeFile/readFile"
  }'
```

## Processus de test

Pour chaque tâche :
1. Exécuter la tâche en utilisant l'API
2. **Après chaque tâche, aller voir les logs dans `worker.log` si tout est correct**
3. **Corriger le code source si nécessaire**
4. Cocher la case une fois la tâche validée

Les logs peuvent être consultés avec :
```bash
tail -n 200 worker.log
```