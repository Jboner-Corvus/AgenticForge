#!/bin/bash

# Script to generate reports from YAML task files

echo "Génération des rapports à partir des fichiers YAML de tâches..."

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Génération du rapport HTML avec Node.js..."
    node generate_report.js
else
    echo "Node.js non trouvé, passage à Python..."
fi

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Génération du rapport avec Python..."
    python3 generate_report.py
elif command -v python &> /dev/null; then
    echo "Génération du rapport avec Python..."
    python generate_report.py
else
    echo "Python non trouvé."
fi

echo "Génération des rapports terminée."