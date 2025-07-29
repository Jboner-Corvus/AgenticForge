# ==============================================================================
# 🧪 PROCÉDURE DE TEST STANDARD POUR L'AGENT
# ==============================================================================
#
# Prérequis : Assurez-vous que les services back-end sont démarrés et fonctionnels.
#
# ---
# Instructions :
# ---
#
# Exécutez chaque commande ci-dessous, une par une, en utilisant ce script.
# Pour chaque commande :
#
# 1. Exécutez la requête via le script (ex: python3 exec_commande.py 1).
# 2. Consultez les logs du worker pour suivre l'exécution de la tâche.
# 3. Confirmez que la tâche associée au prompt a été reçue, qu'elle s'est
#    terminée avec succès et qu'elle a bien effectué son action.
# 4. Corrigez le code si la tâche ne fonctionne pas.
# 5. Cochez la case `[x]` dans votre liste de suivi seulement quand la tâche
#    est terminée avec succès.
#
# ==============================================================================
# GUIDE D'UTILISATION DU SCRIPT
# ==============================================================================
#
# Pour lancer une commande, utilisez la structure suivante dans votre terminal
# (CMD, PowerShell, etc.) :
#
#   python exec_commande.py <numero_de_la_commande>
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
#    python exec_commande.py 1
#
# 2. Pour créer une archive du répertoire de travail (commande n°25) :
#    python exec_commande.py 25
#
# ==============================================================================

import subprocess
import sys
import json

# Configure stdout to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# La liste de vos 50 commandes cURL à tester
commands = [
    # 1
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"1. Liste tous les fichiers et dossiers dans le répertoire de travail.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 2
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"2. Crée un fichier nommé rapport.txt et écris dedans : Ceci est la première ligne.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 3
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"3. Lis le contenu du fichier rapport.txt.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 4
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"4. Dans rapport.txt, remplace première par seconde.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 5
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"5. Exécute ce code Python et donne le résultat : import sys; print(f\\\\\\"Version de Python: {sys.version}\\\\\\")\\"}" "http://192.168.2.56:8080/api/chat"',
    # 6
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"6. Exécute ls -la et montre la sortie.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 7
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"7. Fais une recherche web sur : dernières avancées du modèle Llama 3.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 8
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"8. Navigue sur https://www.lemonde.fr et résume les titres principaux.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 9
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"9. Quels sont tous les outils que tu peux utiliser ? Liste-les.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 10
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"10. Crée un nouvel outil nommé dire_bonjour qui ne prend aucun paramètre et retourne la chaîne \\\\\\"Bonjour le monde !\\\\\\".\\"}" "http://192.168.2.56:8080/api/chat"',
    # 11
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"11. Crée un fichier todo.txt avec trois lignes : - Tâche 1, - Tâche 2, - Tâche 3. Ensuite, lis le contenu de ce fichier pour confirmer.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 12
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"12. Utilise une commande shell pour obtenir la date actuelle au format AAAA-MM-JJ. Ensuite, écris cette date dans un fichier nommé date_du_jour.txt.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 13
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"13. Écris un script Python nommé calcul.py qui calcule 125 * 8 et affiche le résultat. Ensuite, exécute ce script et donne-moi la réponse.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 14
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"14. Utilise une commande shell pour compter le nombre total de fichiers et de dossiers dans le répertoire de travail et annonce le résultat.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 15
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"15. Navigue sur la page d\'accueil de Wikipedia (https://fr.wikipedia.org), extrais tout le texte, puis fournis un résumé concis de ce contenu.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 16
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"16. Crée un fichier config.json avec le contenu {\\\\\\"user\\\\\\": \\\\\\"admin\\\\\\", \\\\\\"version\\\\\\": \\\\\\"2.1.0\\\\\\", \\\\\\"active\\\\\\": true}. Ensuite, lis ce fichier et dis-moi uniquement la valeur de la clé version.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 17
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"17. Crée une arborescence de projet dans le workspace : un dossier parent nommé webapp, et à l\'intérieur, deux sous-dossiers : src et assets.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 18
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"18. Lis le fichier todo.txt. Si le fichier contient Tâche 2, remplace cette ligne par - Tâche 2 (Terminée). Sinon, ajoute une nouvelle ligne : - Tâche 4.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 19
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"19. Écris un script Python word_counter.py qui ouvre et lit le fichier projet_alpha.md, compte le nombre de mots, et affiche le total. Exécute ensuite ce script.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 20
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"20. Exécute la commande pnpm -v pour vérifier la version du gestionnaire de paquets dans l\'environnement de développement.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 21
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"21. Crée un fichier bug.py avec le code suivant: print(hello). Exécute-le. Tu devrais obtenir une NameError. Corrige le script pour qu\'il affiche correctement la chaîne de caractères \\\\\\"hello\\\\\\", puis exécute-le à nouveau.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 22
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"22. Analyse le contenu complet du répertoire de travail. Crée un fichier manifest.json qui liste tous les fichiers présents avec leur taille en octets. Le format doit être un tableau d\'objets, par exemple [{\\\\\\"nom\\\\\\": \\\\\\\"fichier1.txt\\\\\\", \\\\\\\"taille\\\\\\": 123}].\\"}" "http://192.168.2.56:8080/api/chat"',
    # 23
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"23. Je veux m\'assurer que le code est propre. Exécute la commande de linting du projet et rapporte la sortie complète.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 24
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"24. Crée un fichier A.txt avec \\\\\\"hello\\\\\\" et un fichier B.txt avec \\\\\\"world\\\\\\". Lis les deux fichiers et dis-moi s\'ils ont le même contenu.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 25
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"25. Utilise la commande tar pour créer une archive workspace.tar.gz de tout le contenu du répertoire de travail.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 26
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"26. Crée un outil nommé get-timestamp qui ne prend aucun paramètre et retourne la date et l\'heure actuelles au format ISO 8601. La fonction execute doit simplement contenir return new Date().toISOString();.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 27
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"27. J\'ai besoin d\'un outil pour générer des UUID. Crée un outil nommé generate-uuid qui utilise la fonction crypto.randomUUID() de Node.js. Après sa création, utilise-le immédiatement pour générer un UUID et l\'afficher.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 28
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"28. Crée un outil log-activity qui prend un paramètre message. Cet outil doit utiliser writeFile pour ajouter le message précédé d\'un timestamp dans un fichier activity.log. Crée cet outil.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 29
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"29. Lis le code de l\'outil listFiles. Crée une nouvelle version de cet outil nommée listFiles-recursive qui utilise une commande shell (find . -print) pour lister les fichiers de manière récursive. Enregistre-le comme un nouvel outil.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 30
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"30. Je dois souvent vérifier si des sites web sont en ligne. Crée un outil check-website-status qui prend une url en paramètre. Cet outil doit utiliser Python et la librairie requests pour faire une requête GET à l\'URL et retourner \\\\\\"En ligne\\\\\\" si le code de statut est 200, et \\\\\\"Hors ligne\\\\\\" sinon. Crée cet outil pour moi.\\"}" "http://192.168.2.56:8080/api/chat"',
    # 31
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"31. Créer un Site Web Statique \\\\\\"Portfolio\\\\\\"\\"}" "http://192.168.2.56:8080/api/chat"',
    # 32
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"32. Développer un Outil CLI Node pour Gérer des Tâches\\"}" "http://192.168.2.56:8080/api/chat"',
    # 33
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"33. Mettre en Place une API Web Minimale avec Javascript pnpm\\"}" "http://192.168.2.56:8080/api/chat"',
    # 34
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"34. Créer un Composant React pour l\'UI Existante\\"}" "http://192.168.2.56:8080/api/chat"',
    # 35
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"35. Scraper des Données Cosmologique et les Analyser\\"}" "http://192.168.2.56:8080/api/chat"',
    # 36
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"36. Créer un Script d\'Initialisation de Projet\\"}" "http://192.168.2.56:8080/api/chat"',
    # 37
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"37. Convertisseur Markdown vers HTML\\"}" "http://192.168.2.56:8080/api/chat"',
    # 38
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"38. Créer un Outil pour Interagir avec une API Publique\\"}" "http://192.168.2.56:8080/api/chat"',
    # 39
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"39. Générer et Exécuter des Tests Unitaires pour un Script\\"}" "http://192.168.2.56:8080/api/chat"',
    # 40
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"40. Refactoriser un Script pour la Clarté et l\'Efficacité\\"}" "http://192.168.2.56:8080/api/chat"',
    # 41
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"41. Conteneuriser l\'API Express/Node avec un Dockerfile\\"}" "http://192.168.2.56:8080/api/chat"',
    # 42
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"42. Créer une Base de Données SQLite et l\'Intégrer à un Script\\"}" "http://192.168.2.56:8080/api/chat"',
    # 43
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"43. Développer une Application \\\\\\"Livre d\'Or\\\\\\" Full-Stack\\"}" "http://192.168.2.56:8080/api/chat"',
    # 44
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"44. Automatiser des Tâches Basées sur un Fichier YAML\\"}" "http://192.168.2.56:8080/api/chat"',
    # 45
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"45. Écrire un Script de \\\\\\"Benchmark\\\\\\" de Performance\\"}" "http://192.168.2.56:8080/api/chat"',
    # 46
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"46. Générer la Documentation Technique d\'un Projet\\"}" "http://192.168.2.56:8080/api/chat"',
    # 47
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"47. Créer un Workflow Git (Branches et Merge)\\"}" "http://192.168.2.56:8080/api/chat"',
    # 48
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"48. Créer une Micro-Librairie Typescript et l\'Utiliser\\"}" "http://192.168.2.56:8080/api/chat"',
    # 49
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"49. Résoudre un Problème Logique en \\\\\\"Chain-of-Thought\\\\\\"\\"}" "http://192.168.2.56:8080/api/chat"',
    # 50
    'curl -v -X POST -H "Content-Type: application/json" -H "Authorization: Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0" -d "{\\"prompt\\": \\"50. Developpe les test les plus critique d une grosse Biblio comme Fastmcp\\"}" "http://192.168.2.56:8080/api/chat"'
]

def run_command(command_number):
    """
    Exécute une commande cURL en fonction de son numéro.
    """
    try:
        # Les numéros sont de 1 à 50, mais les index de liste sont de 0 à 49
        index = int(command_number) - 1
        if 0 <= index < len(commands):
            print(f"▶️  Exécution de la commande #{command_number}...")
            print(f" commande : {commands[index]}")
            # Exécute la commande dans le shell
            subprocess.run(commands[index], shell=True, check=True)
            print(f"✅ Commande #{command_number} exécutée avec succès.")
        else:
            print(f"❌ Erreur : Le numéro de commande '{command_number}' est invalide. "
                  f"Veuillez choisir un numéro entre 1 et {len(commands)}.")
    except ValueError:
        print("❌ Erreur : Veuillez fournir un numéro de commande valide (ex: '1', '25').")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'exécution de la commande #{command_number}: {e}")
    except Exception as e:
        print(f"Une erreur inattendue est survenue : {e}")

if __name__ == "__main__":
    # Vérifie si un argument a été passé en ligne de commande
    if len(sys.argv) > 1:
        command_to_run = sys.argv[1]
        run_command(command_to_run)
    else:
        print("ℹ️  Veuillez spécifier un numéro de commande à exécuter.")
        print("   Exemple : python3 exec_commande.py 1")