#!/bin/bash
echo "🔧 RÉPARATION GIT APRÈS MISE À JOUR D'IDE"
echo "========================================"
echo ""

echo "📋 PROBLÈME IDENTIFIÉ :"
echo "La mise à jour de votre IDE a probablement :"
echo "- Supprimé les credentials Git stockées"
echo "- Réinitialisé la configuration d'authentification"
echo "- Modifié les paramètres de sécurité intégrés"
echo ""

echo "🛠️  SOLUTION SYSTÉMATIQUE :"
echo "=========================="
echo ""

echo "ÉTAPE 1 : Nettoyer l'authentification actuelle"
echo "---------------------------------------------"
rm -f ~/.git-credentials
git config --global --unset credential.helper
echo "✅ Credentials et helper supprimés"
echo ""

echo "ÉTAPE 2 : Reconfigurer l'utilisateur Git"
echo "---------------------------------------"
echo "Utilisateur actuel : $(git config --global user.name)"
echo "Email actuel : $(git config --global user.email)"
echo ""

echo "ÉTAPE 3 : Configurer le nouveau token"
echo "-------------------------------------"
echo "Pour configurer votre Personal Access Token :"
echo "1. Générez un nouveau token sur https://github.com/settings/tokens"
echo "2. Scopes recommandés : repo, workflow, delete_repo"
echo "3. Collez le token ci-dessous quand vous l'avez"
echo ""

# Demander le token
read -s -p "Collez votre Personal Access Token GitHub : " token
echo ""

if [ -n "$token" ]; then
    # Configurer les credentials
    echo "https://Jboner-Corvus:$token@github.com" > ~/.git-credentials
    git config --global credential.helper store

    echo "✅ Token configuré avec succès !"
    echo ""
    echo "🧪 TEST DE L'AUTHENTIFICATION :"
    echo "=============================="

    # Tester l'authentification
    if git ls-remote https://github.com/Jboner-Corvus/AgenticForge.git > /dev/null 2>&1; then
        echo "✅ Authentification réussie !"
        echo ""
        echo "🚀 PROCHAINES ÉTAPES :"
        echo "===================="
        echo "Vous pouvez maintenant :"
        echo "- Pousser vos branches : git push origin nom-de-branche"
        echo "- Créer des Pull Requests sur GitHub"
        echo "- Continuer votre développement normalement"
    else
        echo "❌ Échec de l'authentification"
        echo "Vérifiez que votre token a bien les permissions 'repo'"
    fi
else
    echo "❌ Aucun token fourni"
    echo "Veuillez générer un token et relancer le script"
fi