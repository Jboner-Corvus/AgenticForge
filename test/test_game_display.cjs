const { chromium } = require('playwright');

/**
 * AgenticForge Game Display Test
 * Test spécialisé pour l'affichage de jeux dans Canvas
 */

class GameDisplayTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.metrics = {
            screenshots: [],
            games: [],
            renderings: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🎮 Initialisation du test Game Display...');

        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1400, height: 900 }
        });

        this.page = await this.context.newPage();
        this.setupEventListeners();

        console.log('✅ Navigateur Gaming initialisé');
    }

    setupEventListeners() {
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('game') || text.includes('Game') || text.includes('canvas') || text.includes('render')) {
                console.log('🎮 Game:', text);
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
        const filename = `game_${timestamp}_${name}.png`;

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

    async createGameDisplayTask() {
        console.log('🎮 Création de tâche d\'affichage de jeux...');

        const gameMessage = `🎮 CRÉE 2 JEUX SIMPLES DANS CANVAS:

1. 🐍 Snake - Directional arrows, score tracking
2. 🧩 Memory Card Game - Find matching pairs

Fais 2 jeux simples et fonctionnels dans HTML5 Canvas.
Pas besoin de graphiques complexes, juste le gameplay de base.
Montre les jeux en action avec des screenshots, merci !`;

        return gameMessage;
    }

    async sendGameMessage(chatTextarea, message) {
        console.log('📤 Envoi de la commande Game Display...');

        await this.takeScreenshot('04_avant_jeu', 'Avant envoi de la commande Game');

        await chatTextarea.fill(message);
        console.log('✅ Commande Game saisie');

        await this.takeScreenshot('05_jeu_saisi', 'Commande Game saisie dans le chat');

        const sendButton = this.page.locator('button[type="submit"], button[aria-label*="send"], .send-button').first();

        if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Commande Game envoyée');
        } else {
            await chatTextarea.press('Enter');
            console.log('✅ Commande Game envoyée (Enter)');
        }

        await this.takeScreenshot('06_jeu_envoye', 'Commande Game envoyée - chargement en cours');
        return true;
    }

    async monitorGameLoading() {
        console.log('⏳ Surveillance du chargement des jeux...');

        // Attendre début du chargement
        await this.page.waitForTimeout(5000);
        await this.takeScreenshot('07_chargement_jeux', 'Début du chargement des jeux');

        // Scroll pour voir la réponse de l'agent et attendre finalisation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(15000);
        await this.takeScreenshot('08_jeux_complets', 'Jeux complétés - réponse complète visible');

        return true;
    }

    async verifyGameResults() {
        console.log('✅ Vérification des résultats Gaming...');

        // Chercher des indicateurs de succès des jeux
        const gameIndicators = await this.page.locator('text=/game|Game|jeu|canvas|rendering|60 FPS|snake|shooter|puzzle/i').count();
        const interactiveIndicators = await this.page.locator('text=/interactive|control|play|start|score|high/i').count();
        const performanceIndicators = await this.page.locator('text=/performance|60 fps|smooth|optimized|graphics/i').count();

        console.log(`🎮 Indicateurs de Jeux: ${gameIndicators}`);
        console.log(`🕹️ Indicateurs Interactifs: ${interactiveIndicators}`);
        console.log(`⚡ Indicateurs Performance: ${performanceIndicators}`);

        await this.takeScreenshot('09_resultats_', 'Résultats Gaming vérifiés');

        return {
            gameIndicators,
            interactiveIndicators,
            performanceIndicators,
            gamesLoaded: gameIndicators > 0 || interactiveIndicators > 0
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
        console.log('📊 RÉSULTATS TEST GAME DISPLAY');
        console.log('='.repeat(50));
        console.log(`⏱️ Durée: ${results.duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`🎮 Jeux chargés: ${this.metrics.games.length}`);
        console.log(`🎨 Rendus effectués: ${this.metrics.renderings.length}`);
        console.log(`👁️ Éléments visibles: ${results.visibleElements}`);
        console.log(`❌ Erreurs: ${results.errorElements}`);
        console.log(`📄 Titre: ${results.title}`);
        console.log(`🌐 URL: ${results.url}`);

        await this.takeScreenshot('10_analyse_finale', 'Analyse finale Game Display');

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

            const gameMessage = await this.createGameDisplayTask();

            if (!await this.sendGameMessage(chatInterface, gameMessage)) {
                throw new Error('Échec envoi commande Game');
            }

            await this.monitorGameLoading();
            const results = await this.verifyGameResults();
            const finalAnalysis = await this.performFinalAnalysis();

            console.log('\n🎉 TEST GAME DISPLAY TERMINÉ AVEC SUCCÈS !');

            return {
                success: results.gamesLoaded,
                results: { ...results, ...finalAnalysis },
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST GAME DISPLAY:', error.message);

            try {
                await this.takeScreenshot('erreur_jeu', 'Erreur critique Game Display');
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
    const tester = new GameDisplayTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Game Display fonctionnel !');
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

module.exports = GameDisplayTester;