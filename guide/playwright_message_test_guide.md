# Guide d'utilisation de Playwright pour tester un champ de message

## Vue d'ensemble

Ce guide explique comment utiliser l'outil MCP Playwright pour naviguer sur un site web et tester un champ de message en mode headless.

## Configuration requise

- Serveur MCP Playwright installé et configuré
- Accès au site web à tester (dans cet exemple : http://192.168.40.28:3002/)

## Étapes détaillées

### 1. Navigation vers le site web

```javascript
// Outil utilisé : playwright_navigate
{
  "url": "http://192.168.40.28:3002/",
  "headless": true,        // Mode sans interface graphique
  "width": 1280,           // Largeur de la fenêtre
  "height": 720            // Hauteur de la fenêtre
}
```

### 2. Capture d'écran initiale

```javascript
// Outil utilisé : playwright_screenshot
{
  "name": "page_initiale",
  "fullPage": true,        // Capture toute la page
  "width": 1280,
  "height": 720
}
```

### 3. Identification des éléments de formulaire

```javascript
// Outil utilisé : playwright_evaluate
// Script pour trouver tous les inputs, textareas et éléments éditables
Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]'))
  .map(el => ({
    tag: el.tagName,
    type: el.type,
    placeholder: el.placeholder,
    id: el.id,
    className: el.className,
    name: el.name
  }))
```

**Résultat obtenu :**
- Champ de message trouvé : `textarea[name="enhanced-chat-input"]`
- Placeholder : "Type your message..."

### 4. Remplissage du champ de message

```javascript
// Outil utilisé : playwright_fill
{
  "selector": "textarea[name=\"enhanced-chat-input\"]",
  "value": "Bonjour, ceci est un message de test envoyé via Playwright pour vérifier que le système de messagerie fonctionne correctement."
}
```

### 5. Identification du bouton d'envoi

```javascript
// Outil utilisé : playwright_evaluate
// Recherche des boutons autour de la zone de chat
const textarea = document.querySelector('textarea[name="enhanced-chat-input"]');
const parent = textarea?.closest('div');
const buttons = parent?.querySelectorAll('button') || [];
Array.from(buttons).map(el => ({
  text: el.textContent?.trim(),
  className: el.className,
  innerHTML: el.innerHTML.substring(0, 100)
}))
```

**Résultat obtenu :**
- Bouton d'envoi identifié par sa classe : `bg-primary text-primary-foreground rounded-full`

### 6. Envoi du message

```javascript
// Outil utilisé : playwright_click
{
  "selector": "button[class*=\"bg-primary\"][class*=\"text-primary-foreground\"][class*=\"rounded-full\"]"
}
```

### 7. Vérification finale

```javascript
// Outil utilisé : playwright_screenshot
{
  "name": "message_envoye",
  "fullPage": true,
  "width": 1280,
  "height": 720
}
```

## Outils Playwright utilisés

| Outil | Fonction | Paramètres clés |
|-------|----------|-----------------|
| `playwright_navigate` | Navigation vers une URL | url, headless, width, height |
| `playwright_screenshot` | Capture d'écran | name, fullPage, width, height |
| `playwright_evaluate` | Exécution JavaScript | script |
| `playwright_fill` | Remplir un champ | selector, value |
| `playwright_click` | Cliquer sur un élément | selector |

## Bonnes pratiques

1. **Mode headless** : Utiliser `headless: true` pour les tests automatisés
2. **Sélecteurs CSS** : Utiliser des sélecteurs spécifiques mais robustes
3. **Captures d'écran** : Prendre des captures avant et après les actions pour vérification
4. **JavaScript** : Utiliser `playwright_evaluate` pour inspecter le DOM dynamiquement
5. **Gestion des erreurs** : Vérifier que les éléments existent avant d'interagir avec eux

## Résultat du test

✅ **Navigation réussie** vers http://192.168.40.28:3002/  
✅ **Champ de message identifié** et rempli  
✅ **Message envoyé** avec succès  
✅ **Captures d'écran** générées pour vérification  

Le système de messagerie fonctionne correctement et le message a été transmis sans erreur.

## Vérification des logs du job

Après l'exécution du test, il est important de vérifier les logs pour s'assurer que tout s'est déroulé correctement.

### 1. Lister les jobs disponibles

```bash
# Lister tous les jobs avec des logs disponibles
npx tsx packages/core/src/simpleLogViewer.ts list
```

### 2. Voir un résumé du job

```bash
# Afficher un résumé rapide du job le plus récent
npx tsx packages/core/src/simpleLogViewer.ts summary <jobId>
```

### 3. Consulter les logs détaillés

```bash
# Afficher les logs complets du job
npx tsx packages/core/src/simpleLogViewer.ts job <jobId>

# Afficher uniquement les erreurs s'il y en a
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --error

# Afficher les logs avec une limite pour éviter la surcharge
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --limit 20
```

### 4. Rechercher des informations spécifiques

```bash
# Rechercher des messages liés à Playwright
npx tsx packages/core/src/simpleLogViewer.ts search "playwright" --job <jobId>

# Rechercher les erreurs ou avertissements
npx tsx packages/core/src/simpleLogViewer.ts search "error\|warn" --job <jobId>
```

### 5. Vérifier les métriques de performance

```bash
# Afficher les métriques du job
npx tsx packages/core/src/simpleLogViewer.ts metrics <jobId>

# Voir uniquement les logs de performance
npx tsx packages/core/src/simpleLogViewer.ts job <jobId> --type perf
```

### 6. Lecture directe des fichiers de logs

```bash
# Lister les fichiers de logs disponibles
ls -la ./logs/

# Lire directement le fichier de log du job
cat ./logs/worker-<jobId>-<timestamp>.log

# Utiliser jq pour filtrer les logs JSON
cat ./logs/worker-<jobId>-*.log | jq 'select(.level == "error")'
```

### Points à vérifier dans les logs

1. **Navigation réussie** : Vérifier les logs indiquant que la navigation vers l'URL a réussi
2. **Exécution des outils** : Confirmer que chaque outil Playwright s'est exécuté sans erreur
3. **Performance** : Vérifier les temps de réponse des différentes actions
4. **Erreurs** : Rechercher d'éventuels messages d'erreur ou d'avertissement
5. **Métriques** : Consulter l'utilisation mémoire et CPU pendant le test

### Exemple de sortie attendue

```
✅ Job ID: job-12345
✅ Navigation: http://192.168.40.28:3002/ - Succès
✅ Screenshot: page_initiale.png - Généré
✅ Element found: textarea[name="enhanced-chat-input"]
✅ Fill: Message rempli avec succès
✅ Button found: Bouton d'envoi identifié
✅ Click: Message envoyé
✅ Screenshot: message_envoye.png - Généré
⏱️  Durée totale: 15.2s
🔧 Outils utilisés: 6
❌ Erreurs: 0
⚠️  Avertissements: 0
```

## Fichiers générés

- `page_initiale-*.png` : Capture d'écran avant l'envoi du message
- `message_envoye-*.png` : Capture d'écran après l'envoi du message
- `./logs/worker-<jobId>-<timestamp>.log` : Fichier de logs détaillé du job
