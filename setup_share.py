#!/usr/bin/env python3
import os
import sys
import subprocess
import getpass

# --- Configuration ---
# Le nom du partage sera le nom du dossier où le script est exécuté.
# Vous pouvez le forcer à une autre valeur si vous le souhaitez.
# SHARE_NAME = "MonPartagePerso" 
SHARE_NAME = os.path.basename(os.getcwd())
# ---------------------


def run_command(command, interactive=False):
    """Exécute une commande shell et gère les erreurs."""
    print(f"[*] Exécution : '{' '.join(command)}'")
    try:
        if interactive:
            # Pour les commandes qui nécessitent une interaction utilisateur comme smbpasswd
            subprocess.run(command, check=True)
        else:
            # Pour les commandes non-interactives
            result = subprocess.run(
                command, 
                check=True, 
                capture_output=True, 
                text=True,
                # L'option -y est généralement passée pour éviter les prompts
            )
            if result.stdout:
                print(f"    -> {result.stdout.strip()}")
            if result.stderr:
                print(f"    -> [ERREUR] {result.stderr.strip()}")

        return True
    except FileNotFoundError:
        print(f"[ERREUR] La commande '{command[0]}' n'a pas été trouvée. Votre système est-il à jour ?")
        return False
    except subprocess.CalledProcessError as e:
        print(f"[ERREUR] La commande a échoué avec le code de sortie {e.returncode}.")
        print(f"    -> Sortie d'erreur : {e.stderr}")
        return False

def main():
    """Fonction principale du script."""
    print("--- Script de configuration automatique du partage Samba ---")

    # --- Étape 0: Vérification des privilèges ---
    if os.geteuid() != 0:
        print("[ERREUR] Ce script doit être exécuté avec des privilèges root.")
        print("Veuillez l'exécuter avec : sudo python3 setup_share.py")
        sys.exit(1)

    # Détecte l'utilisateur qui a lancé sudo, pas 'root'
    try:
        username = os.environ['SUDO_USER']
    except KeyError:
        print("[ERREUR] Impossible de déterminer l'utilisateur. Exécutez bien avec 'sudo'.")
        sys.exit(1)
        
    share_path = os.getcwd()
    smb_conf_path = "/etc/samba/smb.conf"

    print(f"\n[INFO] Configuration détectée :")
    print(f"  - Utilisateur       : {username}")
    print(f"  - Dossier à partager: {share_path}")
    print(f"  - Nom du partage    : [{SHARE_NAME}]")
    input("\nAppuyez sur Entrée pour commencer la configuration...")

    # --- Étape 1: Installation de Samba ---
    print("\n--- Étape 1: Installation de Samba (apt) ---")
    if not run_command(["apt-get", "update", "-y"]):
        sys.exit(1)
    if not run_command(["apt-get", "install", "samba", "-y"]):
        sys.exit(1)

    # --- Étape 2: Configuration du partage dans smb.conf ---
    print(f"\n--- Étape 2: Configuration du fichier {smb_conf_path} ---")
    
    # Création du bloc de configuration
    config_block = f"""
[{SHARE_NAME}]
    comment = Partage pour {SHARE_NAME}
    path = {share_path}
    valid users = {username}
    read only = no
    browsable = yes
"""
    
    # Vérifie si le partage existe déjà pour ne pas le dupliquer
    try:
        with open(smb_conf_path, 'r') as f:
            if f"[{SHARE_NAME}]" in f.read():
                print(f"[*] Le partage '[{SHARE_NAME}]' existe déjà. On ne le modifie pas.")
            else:
                print(f"[*] Ajout de la configuration du partage à {smb_conf_path}...")
                with open(smb_conf_path, 'a') as f_append:
                    f_append.write(config_block)
                print("[*] Configuration ajoutée.")
    except FileNotFoundError:
        print(f"[ERREUR] Le fichier {smb_conf_path} n'existe pas. L'installation de Samba a-t-elle échoué ?")
        sys.exit(1)

    # --- Étape 3: Définition du mot de passe Samba ---
    print("\n--- Étape 3: Définition de votre mot de passe Samba ---")
    print("\n[ATTENTION] Vous allez maintenant devoir entrer un mot de passe.")
    print("Ce mot de passe sera utilisé pour vous connecter au partage depuis Windows.")
    
    if not run_command(["smbpasswd", "-a", username], interactive=True):
        print("[ERREUR] La création du mot de passe Samba a échoué.")
        sys.exit(1)

    # --- Étape 4: Redémarrage des services Samba ---
    print("\n--- Étape 4: Redémarrage des services Samba ---")
    if not run_command(["systemctl", "restart", "smbd", "nmbd"]):
        sys.exit(1)
    print("[*] Services redémarrés.")

    # --- Étape 5: Configuration du pare-feu ---
    print("\n--- Étape 5: Configuration du pare-feu (UFW) ---")
    print("[*] Autorisation du trafic 'Samba' dans UFW...")
    run_command(["ufw", "allow", "Samba"])
    run_command(["ufw", "status"]) # Affiche le statut pour confirmation

    # --- Fin ---
    print("\n---------------------------------------------------------")
    print("✅ Configuration terminée avec succès !")
    print("---------------------------------------------------------")
    print("\nVous pouvez maintenant vous connecter depuis votre PC Windows :")
    print(f"1. Ouvrez l'Explorateur de fichiers.")
    print(f"2. Dans la barre d'adresse, tapez : \\\\{os.uname().nodename}")
    print(f"   (Le nom du partage sera '{SHARE_NAME}')")
    print(f"3. Utilisez les identifiants suivants :")
    print(f"   - Nom d'utilisateur : {username}")
    print(f"   - Mot de passe      : Celui que vous venez de définir.")
    print("\nPour un accès permanent, faites un clic droit sur le partage et 'Connecter un lecteur réseau'.")

if __name__ == "__main__":
    main()