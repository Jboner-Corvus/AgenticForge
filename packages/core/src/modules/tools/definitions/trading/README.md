# AgenticForge Trading Tools

This module contains specialized tools for automated trading across multiple platforms using Playwright browser automation. The system features intelligent trading modes that adapt to market conditions.

## Architecture

The trading system is built on top of AgenticForge's existing Playwright integration and consists of:

### Core Components

1. **Login Automation Tools** - Automated login to trading platforms
2. **Order Execution Tools** - Place buy/sell orders with various order types
3. **Price Monitoring System** - Real-time price tracking across platforms
4. **Portfolio Management** - Track positions and P&L across platforms
5. **Risk Management** - Position sizing, stop losses, risk limits
6. **Strategy Engine** - Trading strategy implementation and backtesting
7. **Technical Analysis Engine** - Identifies support/resistance levels, trends, and key indices

### Trading Agent Modes

The AgenticForge trading agent operates in multiple specialized modes:

#### **Mode 1: Volume & Volatility Surfing** 🚀
- **Primary Strategy**: Identifies the most volatile assets each day, aiming to capture strong upward movements while avoiding sustained downturns
- **Execution**: Surfs market waves using leverage for amplified returns on the best opportunities, focusing on assets showing strong positive momentum
- **Risk Management**: Dynamic position sizing based on volatility levels with strict stop-losses to avoid capturing sustained downturns
- **Entry Signals**:
  - Volume spikes above 2x average
  - Strong positive momentum (e.g., significant price increase)
  - Volatility expansion (ATR increase > 15%)
- **Exit Strategy**: Profit taking at resistance levels, strict stop losses to avoid sustained downturns

#### **Mode 2: Mean Reversion** 🔄
- **Strategy**: Capitalizes on price deviations from moving averages
- **Execution**: Buys oversold conditions, sells overbought conditions
- **Timeframes**: 5-minute to 4-hour charts
- **Indicators**: RSI, Bollinger Bands, MACD divergence

#### **Mode 3: Breakout Trading** 💥
- **Strategy**: Enters positions on confirmed breakouts
- **Execution**: Uses volume confirmation and retest patterns
- **Risk Management**: Tight stops below breakout levels

#### **Mode 4: Arbitrage** ⚖️
- **Strategy**: Exploits price differences across platforms
- **Execution**: Simultaneous buy/sell orders across exchanges
- **Requirements**: Low latency connections and sufficient liquidity

### Supported Platforms

- **Desjardins** - Banque et services financiers avec trading intégré
- **Disnat** - Plateforme de trading multi-actifs
- **Banque Nationale** - Services bancaires et trading institutionnel
- **Interactive Brokers** - Trading multi-actifs avec types d'ordres avancés

### Security Features

- Encrypted credential storage with AES-256 encryption
- Session management with auto-logout after inactivity
- Rate limiting and API throttling protection
- Audit logging for all trades with tamper-proof records
- Risk limits with automatic position reduction
- Two-factor authentication support for all platforms

## Architecture: Scripts vs Agent

Le système de trading AgenticForge est divisé en deux composants principaux qui travaillent ensemble :

### 🤖 **Parties AGENT (Intelligence Artificielle)**

L'agent LLM prend les décisions stratégiques et d'analyse :

- **Analyse de marché** : Interprétation des tendances, identification des opportunités
- **Choix des stratégies** : Sélection du mode de trading approprié (Volume Surfing, etc.)
- **Décisions de trading** : Quand acheter/vendre, quelle taille de position
- **Adaptation dynamique** : Changement de stratégie selon les conditions de marché
- **Évaluation des risques** : Analyse qualitative des opportunités de trading
- **Planification** : Organisation des trades et gestion du timing

### ⚙️ **Parties SCRIPT (Automatisation)**

Les scripts automatisent l'exécution technique :

- **Connexion automatique** : Login sécurisé aux plateformes de trading
- **Surveillance des prix** : Monitoring en temps réel des cours et volumes
- **Exécution des ordres** : Placement automatique des buy/sell orders
- **Calculs techniques** : Position sizing, stop losses, risk management mathématique
- **Gestion de portefeuille** : Suivi automatique des positions et P&L
- **Alertes et notifications** : Déclenchement automatique des signaux

### 🔄 **Interaction Agent ↔ Scripts**

```
Agent IA (LLM)                  Scripts d'Automatisation
├── Analyse la tendance        ├── Surveille les prix
├── Décide d'acheter           ├── Place l'ordre automatiquement
├── Calcule la taille          ├── Gère le risque technique
├── Choisit le timing          ├── Exécute au moment optimal
└── Adapte la stratégie        └── Suit les positions en temps réel
```

## Technical Analysis Capabilities

### Support and Resistance Identification

The trading agent utilizes advanced technical analysis to identify key support and resistance levels:

#### **Automated Detection Methods**
- **Pivot Point Analysis**: Calculates daily, weekly, and monthly pivot points with associated support/resistance levels
- **Moving Average Confluence**: Identifies areas where multiple moving averages intersect to create dynamic support/resistance
- **Volume Profile Analysis**: Uses volume distribution to find significant price levels where large amounts of trading occurred
- **Fibonacci Retracement**: Applies Fibonacci ratios to recent price swings to predict potential reversal zones
- **Trendline Analysis**: Automatically draws and validates trendlines connecting significant highs and lows
- **Chart Pattern Recognition**: Identifies classical patterns (double tops/bottoms, triangles, flags) that imply future price behavior

#### **Key Index Monitoring**
The system continuously monitors major market indices to gauge overall market sentiment:
- **S&P 500 (SPX)** - Broad US market health indicator
- **Dow Jones (DJI)** - Industrial sector performance
- **Nasdaq (IXIC)** - Technology sector trends
- **TSX Composite** - Canadian market benchmark
- **VIX (Volatility Index)** - Market fear gauge for risk assessment
- **Sector ETFs** - Monitors leading sectors (XLK, XLF, XLE, etc.)

#### **Integration with Trading Decisions**
- **Confirmation Signals**: Support/resistance levels are used to confirm entry and exit points
- **Risk Management**: Stop losses are placed below key support levels, take profit targets near resistance
- **Market Context**: Index performance helps determine if market conditions favor bullish or bearish strategies
- **Dynamic Adjustment**: Levels are continuously updated as new price data becomes available

## Usage

Trading tools are automatically registered with the AgenticForge tool registry and can be used by the LLM agent for:

- **Market Analysis**: Real-time scanning for volume and volatility opportunities
- **Automated Order Execution**: Instant trade placement with leverage management
- **Portfolio Rebalancing**: Dynamic asset allocation based on market conditions
- **Risk Management**: Continuous monitoring and position adjustment
- **Performance Tracking**: Detailed P&L analysis and strategy optimization

## Configuration

Trading platform credentials and settings are stored securely using AgenticForge's configuration system:

```typescript
// Example configuration
{
  trading: {
    platforms: {
      binance: {
        apiKey: "encrypted_key",
        secret: "encrypted_secret",
        leverage: 5,
        maxPositionSize: 1000
      }
    },
    modes: {
      volumeSurfing: {
        minVolumeMultiplier: 2.0,
        volatilityThreshold: 15,
        leverageMultiplier: 3
      }
    },
    riskManagement: {
      maxDrawdown: 5,
      maxLeverage: 10,
      emergencyStopLoss: 10
    }
  }
}
```

## Quick Start

1. **Configure Platforms**: Set up API credentials for trading platforms
2. **Set Risk Parameters**: Define position sizes and leverage limits
3. **Choose Trading Mode**: Select appropriate mode based on market conditions
4. **Start Monitoring**: Let the agent scan for opportunities
5. **Automated Execution**: Watch as the agent places trades automatically

The system continuously adapts to market conditions and switches between modes for optimal performance.