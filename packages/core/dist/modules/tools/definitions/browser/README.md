# Playwright MCP Browser Tools - Visual Real-time Feedback

## 🎯 Vue d'ensemble

Les outils Playwright MCP offrent maintenant une **visualisation graphique en temps réel** des actions du navigateur, permettant aux utilisateurs de voir exactement ce que l'agent fait dans le navigateur.

## ✨ Fonctionnalités

### Visualisation en Temps Réel
- **Captures d'écran automatiques** après chaque action majeure
- **Annotations visuelles** montrant les éléments ciblés
- **Feedback visuel immédiat** pour toutes les interactions
- **Historique visuel** des 5 dernières actions

### Actions Visualisées
- 🖱️ **Navigation** - Screenshot après chargement de page
- 👆 **Clics** - Screenshot avant/après avec highlighting
- ⌨️ **Saisie** - Screenshot avant/après avec focus visible
- 📸 **Captures** - Screenshots explicites demandées
- 🔧 **JavaScript** - Visualisation des changements dynamiques
- 📐 **Viewport** - Changements de taille d'écran

## 🚀 Comment ça marche

### 1. Activation Automatique
```typescript
// Les screenshots sont automatiquement capturés après chaque action
await playwrightNavigateTool.execute({
  url: 'https://example.com'
}, ctx);
// → Screenshot envoyé automatiquement à l'UI
```

### 2. Événements en Temps Réel
```typescript
// Événements envoyés à l'UI pour chaque action
{
  type: 'browser.screenshot.realtime',
  data: {
    imageData: 'base64...',
    action: 'navigation',
    selector: 'https://example.com',
    timestamp: 1234567890
  }
}
```

### 3. Composants UI
```tsx
// BrowserLiveView - Affiche les screenshots en temps réel
<BrowserLiveView />

// BrowserControls - Contrôle les options de visualisation
<BrowserControls />
```

## 📱 Interface Utilisateur

### BrowserLiveView Component
- **Position**: Coin supérieur droit
- **Taille**: Adaptative (max 400px)
- **Auto-hide**: Disparaît après 10s d'inactivité
- **Historique**: Garde les 5 dernières captures

### BrowserControls Component
- **Live Visual Feedback**: Active/désactive la visualisation
- **Auto Screenshots**: Contrôle les captures automatiques
- **Status Display**: Affiche l'action en cours

## 🎨 Exemple d'Utilisation

### Scénario Typique
```
Utilisateur: "Va sur Google et recherche 'IA'"

1. Agent: "Je navigue vers Google..."
   Status: "Navigating to https://www.google.com"
   📸 Screenshot: Page Google chargée

2. Agent: "Je saisis 'IA' dans le champ de recherche..."
   Status: "Typing into element: input[name='q']"
   📸 Screenshot: Curseur dans le champ de recherche

3. Agent: "Je clique sur le bouton rechercher..."
   Status: "Clicking element: button[type='submit']"
   📸 Screenshot: Bouton surligné avant clic
   📸 Screenshot: Résultats après clic

4. Agent: "J'extrais le contenu des résultats..."
   Status: "Extracting content from page"
   📸 Screenshot: Page de résultats avec contenu extrait
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Configuration des screenshots
PLAYWRIGHT_SCREENSHOT_QUALITY=80
PLAYWRIGHT_SCREENSHOT_FULLPAGE=false

# Configuration de la visualisation
BROWSER_LIVE_VIEW_ENABLED=true
BROWSER_AUTO_SCREENSHOTS=true
```

### Options des Outils
```typescript
// Navigation avec options visuelles
await playwrightNavigateTool.execute({
  url: 'https://example.com',
  waitUntil: 'load'
}, ctx);

// Clic avec feedback visuel
await playwrightClickTool.execute({
  selector: 'button[type="submit"]',
  button: 'left'
}, ctx);
```

## 🎯 Avantages

### Pour les Utilisateurs
- ✅ **Transparence totale** des actions de l'agent
- ✅ **Débogage visuel** facile
- ✅ **Confiance** dans les actions automatisées
- ✅ **Suivi en temps réel** des progrès

### Pour les Développeurs
- ✅ **Debugging amélioré** avec captures visuelles
- ✅ **Validation** des sélecteurs et actions
- ✅ **Monitoring** des performances du navigateur
- ✅ **Feedback utilisateur** immédiat

## 🔄 Architecture

### Flux de Données
```
Agent Action → Playwright MCP → Screenshot → Redis Event → UI Hook → BrowserLiveView
```

### Événements Supportés
- `browser.screenshot.realtime` - Screenshots en temps réel
- `browser.element.click` - Clics avec annotations
- `browser.element.type` - Saisie avec focus
- `browser.page.loaded` - Navigation terminée
- `browser.content.extracted` - Extraction de contenu

## 🚀 Utilisation Avancée

### Personnalisation des Screenshots
```typescript
// Screenshots haute qualité pour le debugging
const result = await playwrightScreenshotTool.execute({
  fullPage: true,
  quality: 100,
  selector: '.debug-element'
}, ctx);
```

### Intégration Canvas
```typescript
// Les screenshots sont automatiquement ajoutés au canvas
// pour un historique visuel complet
addCanvasToHistory(
  'Browser Action - Click',
  screenshotData,
  'url'
);
```

---

## 🎉 Résultat Final

Avec cette implémentation, l'agent Playwright MCP offre maintenant une **expérience utilisateur révolutionnaire** où chaque action dans le navigateur est **visuellement transparente et traçable** en temps réel !