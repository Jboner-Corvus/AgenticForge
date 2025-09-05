# Alpha Vantage Tools for AgenticForge

Ce module fournit une collection complète d'outils MCP (Model Context Protocol) pour accéder aux données financières via l'API Alpha Vantage.

## 🚀 Installation et Configuration

### Prérequis

1. **Clé API Alpha Vantage** : Obtenez votre clé gratuite sur [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. **AgenticForge** configuré et fonctionnel

### Utilisation

Tous les outils nécessitent une clé API Alpha Vantage. Passez-la via le paramètre `apikey` :

```typescript
// Exemple d'utilisation
const result = await globalQuoteTool.execute({
  symbol: 'AAPL',
  apikey: 'VOTRE_CLE_API'
}, context);
```

## 📊 Outils Disponibles

### Données Boursières de Base

#### `time_series_intraday`
- **Description** : Données OHLCV intrajournalières courantes et historiques (20+ ans)
- **Paramètres** :
  - `symbol` : Symbole boursier (ex: AAPL, IBM)
  - `interval` : Intervalle de temps (1min, 5min, 15min, 30min, 60min)
  - `adjusted` : Données ajustées (défaut: true)
  - `extended_hours` : Inclure les heures étendues (défaut: true)
  - `month` : Mois spécifique au format YYYY-MM (optionnel)
  - `outputsize` : "compact" (100 points) ou "full" (complet)
  - `datatype` : "json" ou "csv"
  - `entitlement` : "delayed" ou "realtime" (optionnel)

#### `time_series_daily`
- **Description** : Données OHLCV quotidiennes historiques (20+ ans)
- **Paramètres** :
  - `symbol` : Symbole boursier
  - `outputsize` : "compact" ou "full"
  - `datatype` : "json" ou "csv"
  - `entitlement` : "delayed" ou "realtime" (optionnel)

#### `global_quote`
- **Description** : Prix et volume actuels pour un titre
- **Paramètres** :
  - `symbol` : Symbole boursier
  - `entitlement` : "delayed" ou "realtime" (optionnel)

#### `symbol_search`
- **Description** : Recherche de symboles par mots-clés
- **Paramètres** :
  - `keywords` : Mots-clés de recherche (ex: "microsoft", "tech")

### Données Fondamentales

#### `company_overview`
- **Description** : Informations complètes sur l'entreprise, ratios financiers et métriques clés
- **Paramètres** :
  - `symbol` : Symbole boursier

### Actualités et Intelligence

#### `news_sentiment`
- **Description** : Actualités et sentiment du marché en temps réel avec scores d'IA
- **Paramètres** :
  - `tickers` : Symboles séparés par virgules (optionnel)
  - `topics` : Sujets séparés par virgules (optionnel)
  - `time_from` : Date de début YYYYMMDDTHHMM (optionnel)
  - `time_to` : Date de fin YYYYMMDDTHHMM (optionnel)
  - `sort` : Tri ("LATEST", "EARLIEST", "RELEVANCE")
  - `limit` : Nombre max d'articles (1-1000)

### Analyse Technique

#### `sma`
- **Description** : Moyenne mobile simple (SMA)
- **Paramètres** :
  - `symbol` : Symbole boursier
  - `interval` : Intervalle de temps
  - `time_period` : Période de calcul (1-200)
  - `series_type` : Type de série ("close", "open", "high", "low")
  - `datatype` : "json" ou "csv"
  - `entitlement` : "delayed" ou "realtime" (optionnel)

#### `rsi`
- **Description** : Indice de Force Relative (RSI)
- **Paramètres** :
  - `symbol` : Symbole boursier
  - `interval` : Intervalle de temps
  - `time_period` : Période de calcul (défaut: 14)
  - `series_type` : Type de série ("close", "open", "high", "low")
  - `datatype` : "json" ou "csv"
  - `entitlement` : "delayed" ou "realtime" (optionnel)

### Devises (Forex)

#### `fx_daily`
- **Description** : Taux de change quotidiens
- **Paramètres** :
  - `from_symbol` : Devise source (code ISO 3 lettres)
  - `to_symbol` : Devise cible (code ISO 3 lettres)
  - `outputsize` : "compact" ou "full"
  - `datatype` : "json" ou "csv"

### Cryptomonnaies

#### `digital_currency_daily`
- **Description** : Données quotidiennes des cryptomonnaies
- **Paramètres** :
  - `symbol` : Symbole crypto (ex: BTC, ETH)
  - `market` : Devise du marché (code ISO 3 lettres)

### Matières Premières

#### `wti`
- **Description** : Prix du pétrole West Texas Intermediate (WTI)
- **Paramètres** :
  - `interval` : Intervalle de temps

### Indicateurs Économiques

#### `inflation`
- **Description** : Données d'inflation des États-Unis
- **Paramètres** : Aucun paramètre requis (sauf apikey)

### Utilitaires

#### `alpha_vantage_ping`
- **Description** : Outil de vérification de santé
- **Paramètres** : Aucun

## 🔧 Exemples d'Utilisation

```typescript
import { globalQuoteTool, timeSeriesIntradayTool, newsSentimentTool } from './alpha-vantage';

// Obtenir le prix actuel d'une action
const quote = await globalQuoteTool.execute({
  symbol: 'AAPL',
  apikey: process.env.ALPHA_VANTAGE_API_KEY
}, context);

// Obtenir des données intrajournalières
const intraday = await timeSeriesIntradayTool.execute({
  symbol: 'TSLA',
  interval: '5min',
  apikey: process.env.ALPHA_VANTAGE_API_KEY
}, context);

// Analyser le sentiment des actualités
const sentiment = await newsSentimentTool.execute({
  tickers: 'AAPL,MSFT',
  limit: 10,
  apikey: process.env.ALPHA_VANTAGE_API_KEY
}, context);
```

## 📋 Catégories d'Outils

Les outils sont organisés en catégories :

- **CORE_STOCK** : Données boursières de base
- **FUNDAMENTAL** : Données fondamentales
- **NEWS_INTELLIGENCE** : Actualités et intelligence
- **TECHNICAL_ANALYSIS** : Analyse technique
- **FOREX** : Devises
- **CRYPTOCURRENCY** : Cryptomonnaies
- **COMMODITIES** : Matières premières
- **ECONOMIC_INDICATORS** : Indicateurs économiques
- **UTILITIES** : Outils utilitaires

## 🧪 Tests

Exécutez les tests avec :

```bash
npm test alpha-vantage
```

## 🔒 Sécurité

- **Ne jamais exposer** votre clé API dans le code source
- Utilisez des variables d'environnement pour stocker la clé API
- Respectez les limites de taux d'Alpha Vantage (25 requêtes/minute pour la version gratuite)

## 📖 Documentation API

Pour plus de détails sur les paramètres et réponses, consultez la [documentation officielle Alpha Vantage](https://www.alphavantage.co/documentation/).

## 🚨 Limitations

- Version gratuite : 25 requêtes par minute
- Certaines données peuvent être retardées de 15 minutes
- L'option `entitlement` nécessite un abonnement premium pour les données temps réel

## 🤝 Contribution

Pour ajouter de nouveaux outils Alpha Vantage :

1. Créez un nouveau fichier `.tool.ts` dans ce répertoire
2. Suivez la structure et conventions établies
3. Ajoutez des tests appropriés
4. Mettez à jour l'index.ts et le README