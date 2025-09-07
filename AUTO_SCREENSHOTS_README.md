# Screenshots Automatiques pour Browser Live View

## Problème Résolu

Auparavant, le Browser Live View ne capturait des screenshots automatiquement que pour quelques actions spécifiques :

- Navigation (`playwright_navigate`)
- Clics (`playwright_click`)
- Saisie de texte (`playwright_type`)

Les autres actions comme `waitForSelector`, `getContent`, `evaluate`, `setViewport` n'avaient **pas de screenshots automatiques**, ce qui rendait difficile le suivi visuel des actions de l'agent.

## Solution Implémentée

### ✅ Screenshots Automatiques pour Tous les Outils

Maintenant, **tous les outils Playwright** capturent automatiquement des screenshots après leur exécution :

- `playwright_navigate` - Après chargement de page
- `playwright_click` - Avant et après le clic
- `playwright_type` - Avant et après la saisie
- `playwright_screenshot` - Capture explicite (existante)
- `playwright_evaluate` - Après exécution JavaScript
- `playwright_wait_for_selector` - Après attente d'élément
- `playwright_get_content` - Après extraction de contenu
- `playwright_set_viewport` - Après changement de viewport

### ⚙️ Configuration Flexible

Un nouveau fichier de configuration `playwrightMcp.config.ts` permet de contrôler :

```typescript
{
  enabled: true,              // Activer/désactiver les screenshots
  frequency: 'all',           // 'all', 'major', 'minimal'
  maxScreenshotsPerMinute: 10, // Limite anti-spam
  screenshotCooldown: 2000,    // Délai minimum entre captures (ms)
  quality: 80,                // Qualité des screenshots
  maxRetries: 2               // Nombre de tentatives
}
```

### 🔧 Variables d'Environnement

Contrôlez la configuration via les variables d'environnement :

```bash
# Désactiver les screenshots automatiques
PLAYWRIGHT_AUTO_SCREENSHOTS=false

# Changer la fréquence
PLAYWRIGHT_SCREENSHOT_FREQUENCY=major  # 'all', 'major', 'minimal'

# Limiter le nombre de screenshots
PLAYWRIGHT_MAX_SCREENSHOTS_PER_MINUTE=5

# Ajuster le délai minimum
PLAYWRIGHT_SCREENSHOT_COOLDOWN=3000
```

### 📊 Protection Anti-Spam

- **Limite par minute** : Maximum 10 screenshots par minute
- **Délai minimum** : 2 secondes entre chaque capture
- **Gestion d'erreurs** : Les échecs de capture n'arrêtent pas l'agent
- **Marquage automatique** : Les événements incluent `automatic: true`

## Avantages

### 👁️ Visibilité Complète

- Suivez visuellement **toutes** les actions de l'agent
- Débogage plus facile des workflows complexes
- Meilleure compréhension du comportement de l'agent

### ⚡ Performance Optimisée

- Screenshots compressés en base64
- Protection contre le spam de captures
- Captures non-bloquantes (ne ralentissent pas l'agent)

### 🔧 Configurable

- Ajustez la fréquence selon vos besoins
- Désactivez complètement si nécessaire
- Contrôle fin via variables d'environnement

## Utilisation

### Test Rapide

```bash
node test_auto_screenshots.js
```

### Avec Variables d'Environnement

```bash
PLAYWRIGHT_SCREENSHOT_FREQUENCY=major PLAYWRIGHT_MAX_SCREENSHOTS_PER_MINUTE=5 node votre_script.js
```

### Configuration Programmatique

```typescript
import {
  getPlaywrightMcpConfig,
  updatePlaywrightMcpConfig,
} from './playwrightMcp.config';

// Obtenir la configuration actuelle
const config = getPlaywrightMcpConfig();

// Modifier dynamiquement (futur enhancement)
updatePlaywrightMcpConfig({
  screenshots: {
    frequency: 'minimal',
    maxScreenshotsPerMinute: 3,
  },
});
```

## Événements Générés

Les screenshots automatiques génèrent des événements Redis avec :

```json
{
  "type": "browser.screenshot.realtime",
  "data": {
    "imageData": "base64...",
    "action": "navigate",
    "selector": "button.submit",
    "automatic": true,
    "timestamp": 1234567890
  }
}
```

## Debugging

### Logs

Les screenshots automatiques sont tracés dans les logs :

```
📸 Automatic screenshot captured: navigate
📊 Size: 245760 chars
🎯 Selector: N/A
⏰ Timestamp: 14:30:25
```

### Erreurs

Les erreurs de capture sont non-bloquantes :

```
⚠️ Non-critical automatic screenshot failed after navigation
```

## Impact sur les Performances

- **Overhead minimal** : Captures asynchrones
- **Compression efficace** : Base64 optimisé
- **Limites intégrées** : Protection anti-spam
- **Récupération d'erreur** : Ne casse pas les workflows

Cette amélioration transforme le Browser Live View en un outil de debugging visuel complet, permettant de suivre en temps réel toutes les actions de l'agent sans intervention manuelle.
