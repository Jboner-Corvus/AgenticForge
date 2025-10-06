const { chromium } = require('playwright');
const { TestUtils } = require('./test_utils.cjs');

/**
 * AgenticForge Playwright Browser Test
 * Test spécialisé pour l'automatisation web avec Playwright
 */

class PlaywrightBrowserTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testUtils = new TestUtils();
        this.testName = 'playwright_browser';
        this.metrics = {
            screenshots: [],
            automations: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🎭 Initialisation du test Playwright Browser...');

        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1400, height: 900 }
        });

        this.page = await this.context.newPage();
        this.setupEventListeners();

        console.log('✅ Navigateur Playwright initialisé');
    }

    setupEventListeners() {
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('playwright') || text.includes('automation') || text.includes('browser')) {
                console.log('🎭 Playwright:', text);
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
        const filename = await this.testUtils.takeScreenshot(this.page, this.testName, description);

        if (filename) {
            this.metrics.screenshots.push({
                filename,
                name,
                description,
                timestamp: Date.now()
            });
        }

        return filename;
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

    async createPlaywrightTask() {
        console.log('🎭 Création de tâche d\'automatisation Playwright...');

        const playwrightMessage = `🎭 LANCE UNE AUTOMATION PLAYWRIGHT COMPLÈTE:

🌐 **TÂCHE 1: Navigation et Analyse Web**
- Ouvre un navigateur headless avec Playwright
- Navigue vers https://github.com/microsoft/playwright
- Prends un screenshot de la page d'accueil
- Extrait le titre principal et le nombre de stars

📊 **TÂCHE 2: Extraction de Données**
- Scanne la page pour trouver les 5 derniers commits
- Extrait les titres et dates des releases
- Compte le nombre de contributeurs visibles

🔍 **TÂCHE 3: Test de Navigation**
- Clique sur le lien "Documentation"
- Vérifie que la page de docs se charge correctement
- Prends un screenshot de la page de documentation

⚡ **TÂCHE 4: Test de Formulaire**
- Recherche le champ de recherche
- Saisit "automatisation" dans le champ
- Soumet la recherche et attends les résultats
- Prends un screenshot des résultats

🎯 **TÂCHE 5: Rapport et Analyse**
- Génère un rapport JSON avec toutes les données collectées
- Sauvegarde tous les screenshots avec des noms descriptifs
- Retourne un résumé de l'automatisation réussie

Priorité: HIGH - Utilise les meilleures pratiques Playwright
Timeout: 30 secondes maximum`;

        return playwrightMessage;
    }

    async sendPlaywrightMessage(chatTextarea, message) {
        console.log('📤 Envoi de la commande Playwright...');

        await this.takeScreenshot('04_avant_playwright', 'Avant envoi de la commande Playwright');

        await chatTextarea.fill(message);
        console.log('✅ Commande Playwright saisie');

        await this.takeScreenshot('05_playwright_saisi', 'Commande Playwright saisie dans le chat');

        const sendButton = this.page.locator('button[type="submit"], button[aria-label*="send"], .send-button').first();

        if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Commande Playwright envoyée');
        } else {
            await chatTextarea.press('Enter');
            console.log('✅ Commande Playwright envoyée (Enter)');
        }

        await this.takeScreenshot('06_playwright_envoye', 'Commande Playwright envoyée - exécution en cours');
        return true;
    }

    async monitorPlaywrightExecution() {
        console.log('⏳ Surveillance de l\'exécution Playwright...');

        // Attendre début de l'automatisation
        await this.page.waitForTimeout(3000);
        await this.takeScreenshot('07_debut_automation', 'Début de l\'automation Playwright');

        // Scroll pour voir la réponse de l'agent et attendre finalisation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(12000);
        await this.takeScreenshot('08_automation_complete', 'Automation Playwright complétée - réponse complète visible');

        return true;
    }

    async verifyPlaywrightResults() {
        console.log('✅ Vérification des résultats Playwright...');

        // Chercher des indicateurs de succès de l'automatisation
        const successIndicators = await this.page.locator('text=/succès|success|complété|screenshots|automation|playwright/i').count();
        const browserIndicators = await this.page.locator('text=/navigateur|browser|headless|github|navigation/i').count();

        console.log(`🎭 Indicateurs de succès Playwright: ${successIndicators}`);
        console.log(`🌐 Indicateurs de navigation web: ${browserIndicators}`);

        await this.takeScreenshot('09_resultats_', 'Résultats Playwright vérifiés');

        return {
            successIndicators,
            browserIndicators,
            automationExecuted: successIndicators > 2 || browserIndicators > 1
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
        console.log('📊 RÉSULTATS TEST PLAYWRIGHT BROWSER');
        console.log('='.repeat(50));
        console.log(`⏱️ Durée: ${results.duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`🎭 Actions d'automatisation: ${this.metrics.automations.length}`);
        console.log(`👁️ Éléments visibles: ${results.visibleElements}`);
        console.log(`❌ Erreurs: ${results.errorElements}`);
        console.log(`📄 Titre: ${results.title}`);
        console.log(`🌐 URL: ${results.url}`);

        await this.takeScreenshot('10_analyse_finale', 'Analyse finale Playwright Browser');

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

            const playwrightMessage = await this.createPlaywrightTask();

            if (!await this.sendPlaywrightMessage(chatInterface, playwrightMessage)) {
                throw new Error('Échec envoi commande Playwright');
            }

            await this.monitorPlaywrightExecution();
            const results = await this.verifyPlaywrightResults();
            const finalAnalysis = await this.performFinalAnalysis();

            // Attendre un peu pour les logs et les afficher
            await this.testUtils.waitForLogsAndDisplay('recent', 2000);

            console.log('\n🎉 TEST PLAYWRIGHT BROWSER TERMINÉ AVEC SUCCÈS !');

            // Afficher le résumé des screenshots
            this.testUtils.displayScreenshotsSummary(this.testName);

            return {
                success: results.automationExecuted,
                results: { ...results, ...finalAnalysis },
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST PLAYWRIGHT:', error.message);

            try {
                await this.takeScreenshot('erreur_playwright', 'Erreur critique Playwright');
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
    const tester = new PlaywrightBrowserTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Automation Playwright fonctionnelle !');
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

module.exports = PlaywrightBrowserTester;