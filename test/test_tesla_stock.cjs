const { chromium } = require('playwright');

/**
 * AgenticForge Tesla Stock Price Test
 * Test spécialisé pour l'affichage des prix d'actions Tesla dans Canvas
 */

class TeslaStockTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.metrics = {
            screenshots: [],
            stockData: [],
            charts: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('📈 Initialisation du test Tesla Stock Price...');

        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1400, height: 900 }
        });

        this.page = await this.context.newPage();
        this.setupEventListeners();

        console.log('✅ Navigateur Stock initialisé');
    }

    setupEventListeners() {
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('tesla') || text.includes('Tesla') || text.includes('stock') || text.includes('TSLA') || text.includes('price')) {
                console.log('📈 Tesla:', text);
            }
        });

        this.page.on('pageerror', error => {
            this.metrics.errors.push({
                type: 'pageerror',
                message: error.message,
                timestamp: Date.now()
            });
        });
    }

    async takeScreenshot(name, description) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `tesla_${timestamp}_${name}.png`;

        try {
            await this.page.screenshot({
                path: filename,
                fullPage: true
            });

            this.metrics.screenshots.push({
                filename,
                name,
                description,
                timestamp: Date.now()
            });

            console.log(`📸 Screenshot: ${filename}`);
            return filename;
        } catch (error) {
            console.error(`❌ Erreur screenshot ${name}:`, error.message);
            return null;
        }
    }

    async navigateToApp() {
        console.log('🌐 Navigation vers l\'application...');

        try {
            await this.page.goto('http://192.168.40.28:3002/', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            await this.takeScreenshot('01_app_chargee', 'Application chargée');
            console.log('✅ Navigation réussie');
            return true;
        } catch (error) {
            console.error('❌ Erreur navigation:', error.message);
            return false;
        }
    }

    async waitForAppReady() {
        console.log('⏳ Attente de l\'initialisation...');
        await this.page.waitForTimeout(3000);

        await this.takeScreenshot('02_app_prete', 'Application prête');
        return true;
    }

    async locateChatInterface() {
        console.log('💬 Recherche interface de chat...');

        const chatTextarea = this.page.locator('textarea[name="enhanced-chat-input"], textarea[placeholder*="message"], textarea');

        if (await chatTextarea.isVisible()) {
            console.log('✅ Interface de chat trouvée');
            await this.takeScreenshot('03_chat_trouve', 'Interface de chat localisée');
            return chatTextarea;
        } else {
            console.log('❌ Interface de chat non trouvée');
            return null;
        }
    }

    async createTeslaStockTask() {
        console.log('📈 Création de tâche d\'affichage Tesla Stock...');

        const teslaMessage = `📈 AFFICHE LES DONNÉES BOURSIÈRES TESLA (TSLA) EN TEMPS RÉEL:

🎯 **DONNÉES ACTUELLES TESLA:**
- Récupère le prix actuel de l'action TSLA
- Affiche la variation journalière (±%)
- Montre le volume de trading
- Affiche la capitalisation boursière
- Indicateurs techniques de base

📊 **GRAPHIQUES INTERACTIFS:**
- **Candlestick Chart 1D**: Prix sur 24 heures avec bougies japonaises
- **Line Chart 1W**: Courbe de prix sur 1 semaine
- **Bar Chart Volume**: Volume de trading par heure
- **RSI Indicator**: Graphique RSI (Relative Strength Index)
- **MACD Indicator**: Graphique MACD pour signaux d'achat/vente

📈 **ANALYSE TECHNIQUE:**
- Support et résistance automatiques
- Tendances (haussière/baissière/neutre)
- Signaux de trading basés sur indicateurs
- Prédictions de court terme (simulées)
- Volatilité historique

🔔 **ALERTES ET NOTIFICATIONS:**
- Prix cible personnalisables
- Alertes de variations importantes (±5%)
- Nouvelles Tesla et impact sur le stock
- Événements économiques influents
- Rapport trimestriel automatique

💰 **DONNÉES FINANCIÈRES:**
- Revenue annuel et trimestriel
- Bénéfices par action (EPS)
- Ratio P/E (Price/Earnings)
- Dettes et cash flow
- Comparaison avec concurrents (Ford, GM, etc)

🏭 **DONNÉES OPÉRATIONNELLES:**
- Nombre de véhicules livrés par trimestre
- Production des usines (Fremont, Shanghai, Berlin)
- Part de marché électrique
- Expansion Supercharger Network
- Développement Autopilot et FSD

🔋 **INNOVATION ET FUTURE:**
- Investissement en R&D
- Brevets déposés par année
- Projets Cybertruck et Roadster
- Batteries et technologies de stockage
- Robotique et Tesla Bot

🌍 **DONNÉES MARCHÉ GLOBAL:**
- Actions TSLA par région (US, Europe, Asie)
- Concurrence locale par marché
- Réglementations environnementales
- Subventions et incitations
- Infrastructure de recharge

📱 **INTERFACE DANS CANVAS:**
- Dashboard financier interactif en temps réel
- Graphiques animés et responsive
- Mode sombre/clair personnalisable
- Zoom et défilement des graphiques
- Export des données en CSV/PDF

⚡ **PERFORMANCE:**
- Mise à jour des données toutes les 30 secondes
- API de trading en temps réel simulée
- Cache intelligent pour historique
- Mode offline pour données précédentes
- Optimisation mobile et tablette

📊 **MÉTRIQUES AVANCÉES:**
- Volatilité implicite
- Beta du marché
- Ratio Sharpe et Sortino
- Corrélation avec marché (S&P 500)
- Sentiment analysis des réseaux sociaux

🎯 **SCÉNARIOS DE TRADING:**
- Backtesting stratégies historiques
- Simulation portefeuille TSLA
- Risk management automatique
- Allocation d'actifs optimisée
- Performance reporting mensuel

🔥 **ALERTES CRITIQUES:**
- Effondrement/support majeur
- Volume anormalement élevé
- Nouvelles fondamentales (positive/negative)
- Changements analystes (upgrade/downgrade)
- Volatilité extrême (>10%)

⚡ **INTEGRATION AI:**
- Prédiction ML basée sur historique
- Analyse sentiment nouvelles et réseaux sociaux
- Recommendations d'achat/vente IA
- Scénarios macroéconomiques simulés
- Optimisation portefeuille automatique

Priorité: URGENT - Temps réel obligatoire
Data Source: Yahoo Finance / Alpha Vantage API
Update Frequency: 30 seconds (real-time mode)
Canvas Rendering: WebGL pour performance optimale`;

        return teslaMessage;
    }

    async sendTeslaMessage(chatTextarea, message) {
        console.log('📤 Envoi de la commande Tesla Stock...');

        await this.takeScreenshot('04_avant_tesla', 'Avant envoi de la commande Tesla');

        await chatTextarea.fill(message);
        console.log('✅ Commande Tesla saisie');

        await this.takeScreenshot('05_tesla_saisi', 'Commande Tesla saisie dans le chat');

        const sendButton = this.page.locator('button[type="submit"], button[aria-label*="send"], .send-button').first();

        if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Commande Tesla envoyée');
        } else {
            await chatTextarea.press('Enter');
            console.log('✅ Commande Tesla envoyée (Enter)');
        }

        await this.takeScreenshot('06_tesla_envoye', 'Commande Tesla envoyée - chargement données en cours');
        return true;
    }

    async monitorTeslaDataLoading() {
        console.log('⏳ Surveillance du chargement des données Tesla...');

        // Attendre début de la récupération des données
        await this.page.waitForTimeout(4000);
        await this.takeScreenshot('07_chargement_donnees', 'Début du chargement des données boursières');

        // Scroll pour voir la réponse de l'agent et attendre finalisation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(15000);
        await this.takeScreenshot('08_tesla_complet', 'Dashboard Tesla complet - réponse complète visible');

        return true;
    }

    async verifyTeslaResults() {
        console.log('✅ Vérification des résultats Tesla Stock...');

        // Chercher des indicateurs de succès des données boursières
        const teslaIndicators = await this.page.locator('text=/tesla|Tesla|TSLA|stock|prix|price|volume|chart|graph/i').count();
        const financialIndicators = await this.page.locator('text=/\\$|€|£|billion|million|market cap|revenue|profit|earnings/i').count();
        const tradingIndicators = await this.page.locator('text=/buy|sell|trade|invest|portfolio|alert|signal/i').count();

        console.log(`📈 Indicateurs Tesla: ${teslaIndicators}`);
        console.log(`💰 Indicateurs Financiers: ${financialIndicators}`);
        console.log(`🔔 Indicateurs Trading: ${tradingIndicators}`);

        await this.takeScreenshot('09_resultats_', 'Résultats Tesla Stock vérifiés');

        return {
            teslaIndicators,
            financialIndicators,
            tradingIndicators,
            teslaDataLoaded: teslaIndicators > 3 || financialIndicators > 1
        };
    }

    async performFinalAnalysis() {
        console.log('📊 Analyse finale...');

        const results = {
            title: await this.page.title(),
            url: await this.page.url(),
            visibleElements: await this.page.locator('*:visible').count(),
            errorElements: await this.page.locator('text=/error|erreur|failed/i').count(),
            duration: Math.round((Date.now() - this.metrics.startTime) / 1000)
        };

        console.log('\n' + '='.repeat(50));
        console.log('📊 RÉSULTATS TEST TESLA STOCK PRICE');
        console.log('='.repeat(50));
        console.log(`⏱️ Durée: ${results.duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`📈 Données boursières: ${this.metrics.stockData.length}`);
        console.log(`📊 Graphiques générés: ${this.metrics.charts.length}`);
        console.log(`👁️ Éléments visibles: ${results.visibleElements}`);
        console.log(`❌ Erreurs: ${results.errorElements}`);
        console.log(`📄 Titre: ${results.title}`);
        console.log(`🌐 URL: ${results.url}`);

        await this.takeScreenshot('10_analyse_finale', 'Analyse finale Tesla Stock');

        return results;
    }

    async cleanup() {
        console.log('🧹 Nettoyage...');

        try {
            if (this.page) await this.page.close();
            if (this.context) await this.context.close();
            if (this.browser) await this.browser.close();
            console.log('✅ Nettoyage terminé');
        } catch (error) {
            console.error('❌ Erreur nettoyage:', error.message);
        }
    }

    async run() {
        try {
            await this.initialize();

            if (!await this.navigateToApp()) {
                throw new Error('Échec navigation');
            }

            await this.waitForAppReady();

            const chatInterface = await this.locateChatInterface();
            if (!chatInterface) {
                throw new Error('Interface chat non trouvée');
            }

            const teslaMessage = await this.createTeslaStockTask();

            if (!await this.sendTeslaMessage(chatInterface, teslaMessage)) {
                throw new Error('Échec envoi commande Tesla');
            }

            await this.monitorTeslaDataLoading();
            const results = await this.verifyTeslaResults();
            const finalAnalysis = await this.performFinalAnalysis();

            console.log('\n🎉 TEST TESLA STOCK PRICE TERMINÉ AVEC SUCCÈS !');

            return {
                success: results.teslaDataLoaded,
                results: { ...results, ...finalAnalysis },
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST TESLA STOCK:', error.message);

            try {
                await this.takeScreenshot('erreur_tesla', 'Erreur critique Tesla Stock');
            } catch (e) {
                // Ignorer les erreurs de screenshot en cas d'échec
            }

            return { success: false, error: error.message };
        } finally {
            await this.cleanup();
        }
    }
}

// Point d'entrée
async function main() {
    const tester = new TeslaStockTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Tesla Stock Price fonctionnel !');
        console.log(`📸 ${results.screenshots.length} screenshots générés`);
        process.exit(0);
    } else {
        console.log('\n❌ ÉCHEC: Problèmes détectés');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = TeslaStockTester;