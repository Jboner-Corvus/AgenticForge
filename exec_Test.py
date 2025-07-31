#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# ==============================================================================
# 🧪 PROCÉDURE DE TEST STANDARD POUR L'AGENT
# ==============================================================================
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

import subprocess
import sys
import json
import time
import shlex

# --- CONFIGURATION ---
# Mettez à jour ces variables avec les vôtres
API_URL = "http://192.168.2.56:8080/api"
API_TOKEN = "Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0"
POLL_INTERVAL = 2  # secondes
POLL_TIMEOUT = 60 # secondes

# Liste de tous les prompts à tester. Le script s'occupe de construire la commande curl.
PROMPTS = [
    # 1-10 : Commandes de base (fichiers, shell, web, outils)
    "1. Liste tous les fichiers et dossiers dans le répertoire de travail.",
    "2. Crée un fichier nommé rapport.txt et écris dedans : Ceci est la première ligne.",
    "3. Lis le contenu du fichier rapport.txt.",
    "4. Dans rapport.txt, remplace première par seconde.",
    '5. Exécute ce code Python et donne le résultat : import sys; print(f"Version de Python: {sys.version}")',
    "6. Exécute ls -la et montre la sortie.",
    "7. Fais une recherche web sur : dernières avancées du modèle Llama 3.",
    "8. Navigue sur https://www.lemonde.fr et résume les titres principaux.",
    "9. Quels sont tous les outils que tu peux utiliser ? Liste-les.",
    '10. Crée un nouvel outil nommé dire_bonjour qui ne prend aucun paramètre et retourne la chaîne "Bonjour le monde !".',
    
    # 11-20 : Scénarios de complexité moyenne
    "11. Crée un fichier todo.txt avec trois lignes : - Tâche 1, - Tâche 2, - Tâche 3. Ensuite, lis le contenu de ce fichier pour confirmer.",
    "12. Utilise une commande shell pour obtenir la date actuelle au format AAAA-MM-JJ. Ensuite, écris cette date dans un fichier nommé date_du_jour.txt.",
    "13. Écris un script Python nommé calcul.py qui calcule 125 * 8 et affiche le résultat. Ensuite, exécute ce script et donne-moi la réponse.",
    "14. Utilise une commande shell pour compter le nombre total de fichiers et de dossiers dans le répertoire de travail et annonce le résultat.",
    "15. Navigue sur la page d'accueil de Wikipedia (https://fr.wikipedia.org), extrais tout le texte, puis fournis un résumé concis de ce contenu.",
    '16. Crée un fichier config.json avec le contenu {"user": "admin", "version": "2.1.0", "active": true}. Ensuite, lis ce fichier et dis-moi uniquement la valeur de la clé version.',
    "17. Crée une arborescence de projet dans le workspace : un dossier parent nommé webapp, et à l'intérieur, deux sous-dossiers : src et assets.",
    "18. Lis le fichier todo.txt. Si le fichier contient Tâche 2, remplace cette ligne par - Tâche 2 (Terminée). Sinon, ajoute une nouvelle ligne : - Tâche 4.",
    "19. Écris un script Python word_counter.py qui ouvre et lit le fichier projet_alpha.md, compte le nombre de mots, et affiche le total. Exécute ensuite ce script.",
    "20. Exécute la commande pnpm -v pour vérifier la version du gestionnaire de paquets dans l'environnement de développement.",

    # 21-30 : Débogage et création d'outils
    '21. Crée un fichier bug.py avec le code suivant: print(hello). Exécute-le. Tu devrais obtenir une NameError. Corrige le script pour qu\'il affiche correctement la chaîne de caractères "hello", puis exécute-le à nouveau.',
    '22. Analyse le contenu complet du répertoire de travail. Crée un fichier manifest.json qui liste tous les fichiers présents avec leur taille en octets. Le format doit être un tableau d\'objets, par exemple [{"nom": "fichier1.txt", "taille": 123}].',
    "23. Je veux m'assurer que le code est propre. Exécute la commande de linting du projet et rapporte la sortie complète.",
    '24. Crée un fichier A.txt avec "hello" et un fichier B.txt avec "world". Lis les deux fichiers et dis-moi s\'ils ont le même contenu.',
    "25. Utilise la commande tar pour créer une archive workspace.tar.gz de tout le contenu du répertoire de travail.",
    "26. Crée un outil nommé get-timestamp qui ne prend aucun paramètre et retourne la date et l'heure actuelles au format ISO 8601. La fonction execute doit simplement contenir return new Date().toISOString();.",
    "27. J'ai besoin d'un outil pour générer des UUID. Crée un outil nommé generate-uuid qui utilise la fonction crypto.randomUUID() de Node.js. Après sa création, utilise-le immédiatement pour générer un UUID et l'afficher.",
    "28. Crée un outil log-activity qui prend un paramètre message. Cet outil doit utiliser writeFile pour ajouter le message précédé d'un timestamp dans un fichier activity.log. Crée cet outil.",
    "29. Lis le code de l'outil listFiles. Crée une nouvelle version de cet outil nommée listFiles-recursive qui utilise une commande shell (find . -print) pour lister les fichiers de manière récursive. Enregistre-le comme un nouvel outil.",
    '30. Je dois souvent vérifier si des sites web sont en ligne. Crée un outil check-website-status qui prend une url en paramètre. Cet outil doit utiliser Python et la librairie requests pour faire une requête GET à l\'URL et retourner "En ligne" si le code de statut est 200, et "Hors ligne" sinon. Crée cet outil pour moi.',

    # 31-40 : Projets et développement
    '31. Créer un Site Web Statique "Portfolio"',
    '32. Développer un Outil CLI Node pour Gérer des Tâches',
    '33. Mettre en Place une API Web Minimale avec Javascript pnpm',
    '34. Créer un Composant React pour l\'UI Existante',
    '35. Scraper des Données Cosmologique et les Analyser',
    '36. Créer un Script d\'Initialisation de Projet',
    '37. Convertisseur Markdown vers HTML',
    '38. Créer un Outil pour Interagir avec une API Publique',
    '39. Générer et Exécuter des Tests Unitaires pour un Script',
    '40. Refactoriser un Script pour la Clarté et l\'Efficacité',

    # 41-50 : Tâches avancées
    '41. Conteneuriser l\'API Express/Node avec un Dockerfile',
    '42. Créer une Base de Données SQLite et l\'Intégrer à un Script',
    '43. Développer une Application "Livre d\'Or" Full-Stack',
    '44. Automatiser des Tâches Basées sur un Fichier YAML',
    '45. Écrire un Script de "Benchmark" de Performance',
    '46. Générer la Documentation Technique d\'un Projet',
    '47. Créer un Workflow Git (Branches et Merge)',
    '48. Créer une Micro-Librairie Typescript et l\'Utiliser',
    '49. Résoudre un Problème Logique en "Chain-of-Thought"',
    '50. Developpe les test les plus critique d une grosse Biblio comme Fastmcp',
]

def run_single_test(command_number_str: str):
    """
    Exécute un test unique basé sur son numéro.
    """
    try:
        command_number = int(command_number_str)
        # Les numéros sont de 1 à 50, mais les index de liste sont de 0 à 49
        index = command_number - 1
        
        if not (0 <= index < len(PROMPTS)):
            print(f"❌ Erreur : Le numéro de commande '{command_number_str}' est invalide. "
                  f"Veuillez choisir un numéro entre 1 et {len(PROMPTS)}.")
            return
            
    except ValueError:
        print(f"❌ Erreur : Veuillez fournir un numéro de commande valide (ex: '1', '25').")
        return

    prompt_text = PROMPTS[index]
    print(f"▶️  Exécution du test #{command_number}: {prompt_text[:70]}...")

    # --- Étape 1: Envoyer la requête POST initiale ---
    try:
        # Création du corps de la requête (payload)
        payload = json.dumps({"prompt": prompt_text, "llmModelName": "gemini-pro"})

        # Construction de la commande curl de manière sécurisée
        curl_command = [
            'curl', '-s', '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-H', f'Authorization: Bearer {API_TOKEN}',
            '-d', payload,
            f'{API_URL}/chat'
        ]
        
        print(f"   Commande: {' '.join(shlex.quote(c) for c in curl_command)}")

        # Exécution de la commande
        process = subprocess.run(
            curl_command, 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            check=True
        )
        
        # Extraction de l'ID du job
        job_info = json.loads(process.stdout)
        job_id = job_info.get('jobId')

        if not job_id:
            print("❌ Erreur: L'ID du job (jobId) n'a pas été trouvé dans la réponse :")
            print(process.stdout)
            return

        print(f"✅ Job démarré avec succès. ID: {job_id}")

    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'exécution de la commande curl initiale.")
        print(f"   Code de retour: {e.returncode}")
        print(f"   Sortie standard (stdout): {e.stdout}")
        print(f"   Sortie d'erreur (stderr): {e.stderr}")
        return
    except json.JSONDecodeError:
        print(f"❌ Erreur: Impossible de décoder la réponse JSON de la requête initiale.")
        print(f"   Réponse reçue: {process.stdout}")
        return
    except Exception as e:
        print(f"❌ Une erreur inattendue est survenue lors de l'envoi du job : {e}")
        return

    # --- Étape 2: Interroger (poll) le statut du job ---
    status_url = f"{API_URL}/status/{job_id}"
    print(f"🔄 Interrogation du statut du job sur {status_url}")
    
    start_time = time.time()
    while time.time() - start_time < POLL_TIMEOUT:
        try:
            status_process = subprocess.run(
                ['curl', '-s', status_url],
                capture_output=True,
                text=True,
                encoding='utf-8',
                check=True
            )
            status_data = json.loads(status_process.stdout)
            job_state = status_data.get('state')
            
            print(f"   Statut actuel : {job_state}...")

            if job_state == 'completed':
                return_value = status_data.get('returnvalue', {})
                print("="*50)
                print(f"✅ SUCCÈS : Le test #{command_number} est terminé.")
                print(f"   Résultat final :")
                # Affiche le résultat joliment formaté
                print(json.dumps(return_value, indent=2, ensure_ascii=False))
                print("="*50)
                return

            if job_state == 'failed':
                error_info = status_data.get('error', 'Aucune information d\'erreur fournie.')
                print("="*50)
                print(f"❌ ÉCHEC : Le test #{command_number} a échoué.")
                print(f"   Raison de l'échec : {error_info}")
                print("="*50)
                return

            time.sleep(POLL_INTERVAL)

        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors de l'interrogation du statut du job : {e.stderr}")
            time.sleep(POLL_INTERVAL) # On attend avant de réessayer
        except json.JSONDecodeError:
            print(f"❌ Erreur: Impossible de décoder la réponse JSON de l'API de statut.")
            print(f"   Réponse reçue : {status_process.stdout}")
            return
        except Exception as e:
            print(f"❌ Une erreur inattendue est survenue pendant l'interrogation : {e}")
            return
    
    # Si la boucle se termine sans réponse
    print(f"⏰ TIMEOUT : Le test #{command_number} n'a pas abouti dans les {POLL_TIMEOUT} secondes imparties.")


if __name__ == "__main__":
    # Configure stdout pour utiliser l'encodage UTF-8, crucial pour Windows
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) > 1:
        run_single_test(sys.argv[1])
    else:
        print("ℹ️  Veuillez spécifier un numéro de commande à exécuter.")
        print(f"   Exemple : python3 {sys.argv[0]} 1")