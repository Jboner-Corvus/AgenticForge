#!/bin/bash
# Test script pour vérifier le workspace système

echo "🧪 Test du workspace système AgenticForge"
echo "========================================"

# Vérifier les variables d'environnement
echo "📋 Configuration actuelle:"
echo "   WORKSPACE_PATH: $WORKSPACE_PATH"
echo "   Chemin système: $HOME/agenticforge-workspace"
echo ""

# Vérifier que le workspace existe
if [[ -d "$HOME/agenticforge-workspace" ]]; then
    echo "✅ Workspace système trouvé"
    echo "📁 Structure:"
    ls -la $HOME/agenticforge-workspace
    echo ""

    # Tester l'écriture dans le workspace
    echo "🖊️ Test d'écriture dans le workspace..."
    echo "Test file created at $(date)" > $HOME/agenticforge-workspace/test.txt
    if [[ -f "$HOME/agenticforge-workspace/test.txt" ]]; then
        echo "✅ Écriture réussie dans le workspace"
        rm $HOME/agenticforge-workspace/test.txt
    else
        echo "❌ Échec de l'écriture dans le workspace"
    fi
    echo ""

    # Vérifier les permissions
    echo "🔐 Permissions du workspace:"
    ls -ld $HOME/agenticforge-workspace
    echo ""

else
    echo "❌ Workspace système non trouvé"
    echo "💡 Exécutez: mkdir -p ~/agenticforge-workspace"
fi

echo "🎉 Test terminé!"