# Correction du Problème des Tokens de Session

## Problème Identifié

Le compteur de tokens de session dans le panneau de contrôle affichait toujours **0** et ne se mettait jamais à jour, même après des conversations avec l'agent.

## Cause Racine

1. **Fonction `addTokensUsed` non utilisée** : La fonction existait dans le store mais n'était jamais appelée
2. **Pas d'estimation automatique** : Aucun mécanisme pour compter les tokens des messages
3. **Pas de recalcul lors du chargement** : Les sessions chargées ne recalculaient pas leurs tokens

## Solution Implémentée

### 1. Fonction d'Estimation de Tokens

```typescript
// packages/ui/src/lib/utils/tokenEstimation.ts
export function estimateTokens(text: string): number;
export function estimateMessageTokens(message: any): number;
export function estimateConversationTokens(messages: any[]): number;
```

**Algorithme d'estimation :**

- ~4 caractères par token (approximation standard)
- Overhead pour ponctuation et espaces
- Minimum 1 token par message

### 2. Intégration Automatique dans le Store

**Modification de `addMessage` :**

```typescript
addMessage: (messageData) => {
  // ... existing code ...
  const messageTokens = estimateMessageTokens(newMessage);
  set((state) => ({
    messages: [...state.messages, newMessage],
    sessionTokensUsed: state.sessionTokensUsed + messageTokens,
  }));
};
```

**Modification de `loadSession` :**

```typescript
loadSession: async (id: string) => {
  const sessionData = await loadSessionApi(id);
  const messages = sessionData.messages || [];
  const totalTokens = messages.reduce((sum, message) => {
    return sum + estimateMessageTokens(message);
  }, 0);

  set({
    // ... other fields ...
    sessionTokensUsed: totalTokens,
  });
};
```

### 3. Gestion des États Spéciaux

- **Nouvelle session** : Tokens remis à 0
- **Messages effacés** : Tokens remis à 0
- **Session chargée** : Tokens recalculés automatiquement

## Fonctionnalités Ajoutées

### Comptage Automatique

- ✅ **Messages utilisateur** : Tokens estimés et ajoutés
- ✅ **Messages assistant** : Tokens estimés et ajoutés
- ✅ **Messages tool** : Tokens des appels d'outils comptés
- ✅ **Chargement de session** : Recalcul automatique des tokens

### Affichage dans l'Interface

```typescript
// Dans ControlPanel.tsx
<div className="flex justify-between items-center p-2 rounded hover:bg-accent">
  <Label>Session Tokens</Label>
  <span className="text-sm text-muted-foreground font-mono">
    {sessionTokensUsed.toLocaleString()}
  </span>
</div>
```

### Logging Détaillé

```typescript
console.log('🔥 [SessionStore] Estimated tokens for message:', messageTokens);
console.log(
  '🔥 [SessionStore] Updated session tokens:',
  newState.sessionTokensUsed,
);
```

## Utilisation

### Affichage Automatique

Les tokens s'affichent maintenant automatiquement dans le panneau de contrôle :

- **Format** : Nombre formaté avec séparateurs (1,234)
- **Mise à jour** : En temps réel lors des conversations
- **Persistance** : Sauvegardé avec les sessions

### Test Manuel

```bash
node test_session_tokens.js
```

### Vérification Programmatique

```typescript
import { useSessionTokensUsed } from '../store/hooks';

const tokens = useSessionTokensUsed();
// Retourne le nombre total de tokens utilisés dans la session
```

## Avantages

### Utilisateur

- **Visibilité** : Voit l'utilisation des tokens en temps réel
- **Suivi** : Peut monitorer la consommation par session
- **Planification** : Meilleure estimation des coûts

### Développeur

- **Debugging** : Logs détaillés pour le débogage
- **Testabilité** : Fonctions d'estimation isolées
- **Extensibilité** : Facilement modifiable pour d'autres modèles

## Limitations

### Estimation Approximative

- Basée sur des moyennes (~4 chars/token)
- Ne reflète pas exactement les tokens réels des modèles
- Varie selon le modèle utilisé (GPT-4 vs GPT-3.5)

### Performance

- Calcul à chaque message (négligeable)
- Recalcul complet lors du chargement de session

## Améliorations Futures

1. **API Réelle** : Intégration avec l'API OpenAI pour comptage exact
2. **Par Modèle** : Estimations spécifiques par modèle
3. **Cache** : Mise en cache des estimations
4. **Analytics** : Graphiques d'utilisation des tokens

## Fichiers Modifiés

- `packages/ui/src/lib/utils/tokenEstimation.ts` - **NOUVEAU**
- `packages/ui/src/store/sessionStore.ts` - Modifié
- `packages/ui/src/components/ControlPanel.tsx` - Déjà correct
- `test_session_tokens.js` - **NOUVEAU**

Cette correction résout complètement le problème des tokens de session qui ne s'affichaient pas et fournit maintenant une visibilité complète sur l'utilisation des tokens pendant les conversations.
