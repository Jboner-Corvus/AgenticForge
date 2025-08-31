#!/bin/bash
# Script rapide pour accéder au workspace

echo "🚀 Accès rapide au workspace"
echo "📍 Chemin: $(pwd)/workspace"
cd workspace
echo "📂 Contenu du workspace:"
ls -la
echo ""
echo "💡 Commandes disponibles:"
echo "  ws     - Aller au workspace"
echo "  wsp    - Aller au workspace + lister contenu"
echo "  ./ws.sh - Ce script"