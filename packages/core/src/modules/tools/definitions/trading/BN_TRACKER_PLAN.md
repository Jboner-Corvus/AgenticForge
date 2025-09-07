# Plan de Développement - Tracker Banque Nationale

## 🎯 Objectif

Créer un tracker spécialisé pour Banque Nationale qui utilise Playwright pour l'automatisation, avec une séparation claire entre l'IA (Agent) et les scripts techniques.

## 🧠 Séparation Agent vs Script

### 🤖 PARTIE AGENT (Intelligence Artificielle)

L'agent prend les décisions stratégiques et comprend le contexte :

- **Analyse des besoins** : "Je veux tracker mes positions BN"
- **Planification** : Déterminer quoi tracker (solde, positions, transactions)
- **Décisions** : Quand rafraîchir les données, quelles actions effectuer
- **Adaptation** : S'adapter aux changements du site web
- **Résolution de problèmes** : Diagnostiquer les erreurs et proposer des solutions

### ⚙️ PARTIE SCRIPT (Automatisation Technique)

Les scripts exécutent les tâches techniques de manière déterministe :

- **Connexion automatique** : Login sécurisé au site BN
- **Navigation** : Aller aux bonnes pages (comptes, positions, historique)
- **Extraction de données** : Récupérer soldes, positions, transactions
- **Actions répétitives** : Rafraîchir, vérifier les changements
- **Gestion d'erreurs techniques** : Retry, timeouts, sélecteurs

## 🔄 Interaction Agent ↔ Scripts

```
Utilisateur: "Track mes positions BN"
           ↓
🤖 Agent IA: Analyse la demande
   - Comprend qu'il faut aller sur BN
   - Sait qu'il faut se connecter d'abord
   - Détermine les données à récupérer
           ↓
⚙️ Script: Exécute l'automatisation
   - Lance Playwright
   - Se connecte avec les credentials
   - Navigue vers la page des positions
   - Extrait les données
           ↓
🤖 Agent IA: Traite les résultats
   - Analyse les données extraites
   - Détecte les changements/anomalies
   - Propose des actions suivantes
```

## 📋 Plan de Développement - Tracker BN

### Phase 1: Infrastructure de Base (1-2 jours)

#### 1.1 Créer la Structure du Tracker

```
trading/trackers/
├── bn/
│   ├── BNTracker.ts          # Classe principale du tracker
│   ├── BNLogin.script.ts     # Script de connexion
│   ├── BNDataExtractor.script.ts  # Script d'extraction
│   ├── BNConfig.ts           # Configuration BN
│   └── types.ts              # Types spécifiques BN
```

#### 1.2 Configuration BN

```typescript
export const BN_CONFIG = {
  name: 'Banque Nationale',
  baseUrl: 'https://www.bnc.ca',
  loginUrl: 'https://www.bnc.ca/auth/login',
  accountsUrl: 'https://www.bnc.ca/accounts',
  selectors: {
    username: '#username',
    password: '#password',
    submit: 'button[type="submit"]',
    balance: '.account-balance',
    positions: '.positions-table',
  },
};
```

### Phase 2: Scripts Techniques (3-5 jours)

#### 2.1 Script de Connexion

**Rôle** : Automatiser le login BN
**Agent peut aider** : Analyser le DOM, suggérer les sélecteurs, gérer les erreurs

```typescript
export class BNLoginScript {
  async execute(credentials: Credentials, ctx: Ctx) {
    // 🤖 Agent suggère: "Utilise ces sélecteurs pour le login"
    // ⚙️ Script exécute: Navigation et remplissage automatique
  }
}
```

#### 2.2 Script d'Extraction de Données

**Rôle** : Récupérer soldes, positions, transactions
**Agent peut aider** : Identifier les patterns de données, valider l'extraction

```typescript
export class BNDataExtractorScript {
  async extractBalances(page: Page): Promise<Balance[]> {
    // 🤖 Agent analyse: "Les soldes sont dans .balance-amount"
    // ⚙️ Script extrait: Utilise les sélecteurs suggérés
  }
}
```

### Phase 3: Intelligence Agent (6-8 jours)

#### 3.1 Analyseur de Données

**Rôle** : Comprendre et interpréter les données extraites

```typescript
export class BNAnalyzer {
  analyzeBalances(balances: Balance[]) {
    // Détecte les changements significatifs
    // Identifie les tendances
    // Propose des actions
  }
}
```

#### 3.2 Gestionnaire d'Erreurs

**Rôle** : Diagnostiquer et résoudre les problèmes

```typescript
export class BNErrorHandler {
  handleError(error: Error, context: string) {
    // 🤖 Agent diagnostique: "Le sélecteur a changé"
    // 🤖 Agent propose: "Utilise ce nouveau sélecteur"
    // ⚙️ Script applique: La correction suggérée
  }
}
```

### Phase 4: Intégration et Test (9-10 jours)

#### 4.1 Outil Tracker Principal

```typescript
export const bnTrackerTool: Tool = {
  name: 'bn_tracker',
  description: 'Tracker spécialisé pour Banque Nationale',
  execute: async (params, ctx) => {
    const tracker = new BNTracker();

    // 🤖 Agent décide de la stratégie
    // ⚙️ Scripts exécutent les actions
    // 🤖 Agent analyse les résultats
  },
};
```

## 🔧 Comment l'Agent Aide à Écrire les Scripts

### 1. Analyse du DOM

```
Utilisateur: "Le login ne fonctionne pas"
🤖 Agent: Analyse la page web
   - "Je vois que le sélecteur #username n'existe plus"
   - "Il y a maintenant un input[name='user']"
   - "Proposition: Change le sélecteur"
⚙️ Script: Applique la correction
```

### 2. Génération de Code

````
🤖 Agent: "Pour extraire les soldes, utilise ce code:"
```typescript
const balances = await page.$$eval('.balance-item', items =>
  items.map(item => ({
    account: item.querySelector('.account-name')?.textContent,
    amount: item.querySelector('.amount')?.textContent
  }))
);
````

```

### 3. Debugging Interactif
```

🤖 Agent: "Testons ce sélecteur..."
⚙️ Script: Exécute le test
🤖 Agent: "Ça marche! Maintenant testons l'extraction..."

```

## 🚀 Démarrage Rapide

1. **Créer la structure de base**
2. **Implémenter le script de login simple**
3. **Tester avec les credentials fournis**
4. **Ajouter l'extraction de données de base**
5. **Intégrer l'analyseur agent**

## 📊 Métriques de Succès

- ✅ Connexion automatique réussie
- ✅ Extraction de soldes fonctionnelle
- ✅ Détection de changements en temps réel
- ✅ Gestion d'erreurs robuste
- ✅ Adaptation aux changements du site

Voulez-vous commencer par la Phase 1 et créer la structure de base du tracker BN ?
```
