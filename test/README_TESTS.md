# AgenticForge Test Suite

🚀 **Suite de tests E2E spécialisés pour AgenticForge avec captures d'écran stratégiques**

## 📋 Vue d'ensemble

Cette suite de tests couvre toutes les fonctionnalités principales d'AgenticForge avec des scripts optimisés, modulaires et généreant des preuves visuelles complètes.

## 🎯 Tests Disponibles

### 1. 📋 Todo List Test (`test_todo_list.cjs`)
- **Objectif**: Tester les fonctionnalités de gestion de tâches
- **Fonctionnalités**: Création, modification, suivi de Todo Lists
- **Screenshots**: 11 captures stratégiques
- **Durée estimée**: ~45 secondes

### 2. 🎭 Playwright Browser Test (`test_playwright_browser.cjs`)
- **Objectif**: Tester l'automatisation web avec Playwright
- **Fonctionnalités**: Navigation, extraction de données, automatisation complète
- **Screenshots**: 12 captures stratégiques
- **Durée estimée**: ~50 secondes

### 3. 🎨 Canvas Website Test (`test_canvas_website.cjs`)
- **Objectif**: Tester l'affichage de sites web dans Canvas
- **Fonctionnalités**: Rendu interactif, multi-sites, contrôles avancés
- **Screenshots**: 12 captures stratégiques
- **Durée estimée**: ~60 secondes

### 4. 🎮 Game Display Test (`test_game_display.cjs`)
- **Objectif**: Tester l'affichage de jeux dans Canvas
- **Fonctionnalités**: 6 jeux interactifs, performance 60 FPS, contrôles tactiles
- **Screenshots**: 12 captures stratégiques
- **Durée estimée**: ~70 secondes

### 5. 📈 Tesla Stock Price Test (`test_tesla_stock.cjs`)
- **Objectif**: Tester l'affichage de données boursières en temps réel
- **Fonctionnalités**: Dashboard financier, graphiques interactifs, IA de prédiction
- **Screenshots**: 12 captures stratégiques
- **Durée estimée**: ~55 secondes

## 🚀 Utilisation

### Lancer tous les tests
```bash
node run_all_tests.cjs
```

### Lancer un test spécifique
```bash
# Todo List
node run_all_tests.cjs todo

# Playwright
node run_all_tests.cjs playwright

# Canvas
node run_all_tests.cjs canvas

# Game
node run_all_tests.cjs game

# Tesla Stock
node run_all_tests.cjs tesla
```

### Lancer plusieurs tests spécifiques
```bash
node run_all_tests.cjs run todo playwright canvas
```

### Lister tous les tests disponibles
```bash
node run_all_tests.cjs list
```

### Lancer un test individuellement
```bash
# Todo List
node test_todo_list.cjs

# Playwright Browser
node test_playwright_browser.cjs

# Canvas Website
node test_canvas_website.cjs

# Game Display
node test_game_display.cjs

# Tesla Stock
node test_tesla_stock.cjs
```

## 📸 Screenshots

Tous les scripts génèrent des captures d'écran avec :
- **Nommage chronologique**: `type_YYYY-MM-DDTHHMMSS_nom.png`
- **Description contextuelle**: Chaque screenshot a un but précis
- **Qualité optimisée**: PNG haute qualité
- **Couverture complète**: Screenshots full-page

## 📊 Rapports

Le master runner génère :
- **Rapport JSON**: `test_report_YYYY-MM-DDTHHMMSS.json`
- **Rapport console**: Résumé détaillé des résultats
- **Métriques**: Durée, nombre de screenshots, taux de succès

## 🔧 Configuration

### Prérequis
- Node.js 16+
- Playwright installé
- Accès à l'application AgenticForge sur `http://192.168.40.28:3002/`

### Installation Playwright
```bash
npm install playwright
```

### Variables d'environnement
Les scripts utilisent les variables configurées dans `.env.local` :
- `VITE_AUTH_TOKEN`: Token d'authentification
- `VITE_MCP_PROXY_ADDRESS`: Proxy MCP
- `VITE_MCP_PROXY_AUTH_TOKEN`: Token proxy MCP

## 🎯 Caractéristiques Techniques

### Architecture modulaire
- Chaque script est indépendant
- Code réutilisable et maintenable
- Gestion d'erreurs robuste
- Nettoyage automatique des ressources

### Optimisations
- Parallélisation possible
- Cache intelligent des ressources
- Timeout configurables
- Gestion mémoire optimisée

### Surveillance intégrée
- Logs détaillés en temps réel
- Capture d'erreurs complètes
- Métriques de performance
- Validation des résultats

## 📋 Checklist de Test

### Avant de lancer les tests
- [ ] Serveur AgenticForge démarré
- [ ] Port 3002 accessible
- [ ] Variables d'environnement configurées
- [ ] Playwright installé

### Pendant les tests
- [ ] Surveillance des logs console
- [ ] Vérification des screenshots générés
- [ ] Validation des métriques

### Après les tests
- [ ] Analyse du rapport final
- [ ] Vérification des screenshots
- [ ] Nettoyage des fichiers temporaires si nécessaire

## 🐛 Dépannage

### Erreurs courantes
- **ECONNREFUSED**: Vérifier que le serveur est démarré
- **Timeout**: Augmenter les timeouts dans les scripts
- **Playwright non trouvé**: Installer les dépendances

### Logs de debug
Les scripts affichent des logs détaillés pour :
- Navigation et chargement
- Actions effectuées
- Erreurs rencontrées
- Métriques de performance

## 📈 Évolution

Les scripts sont conçus pour être :
- **Extensibles**: Facile à ajouter de nouveaux tests
- **Maintenables**: Code clair et documenté
- **Scalables**: Supporte tests parallèles
- **Robustes**: Gestion complète des erreurs

## 🤝 Contribution

Pour ajouter un nouveau test :
1. Copier un script existant comme template
2. Adapter la logique métier
3. Personnaliser les captures d'écran
4. Ajouter au master runner
5. Documenter dans ce README

---

**Made with ❤️ for AgenticForge Testing**