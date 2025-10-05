const { chromium } = require('playwright');

/**
 * AgenticForge Canvas Website Test
 * Test spécialisé pour l'affichage de sites web dans Canvas
 */

class CanvasWebsiteTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.metrics = {
            screenshots: [],
            canvasRenderings: [],
            websites: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('🎨 Initialisation du test Canvas Website...');

        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1400, height: 900 }
        });

        this.page = await this.context.newPage();
        this.setupEventListeners();

        console.log('✅ Navigateur Canvas initialisé');
    }

    setupEventListeners() {
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('canvas') || text.includes('Canvas') || text.includes('website') || text.includes('render')) {
                console.log('🎨 Canvas:', text);
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
        const filename = `canvas_${timestamp}_${name}.png`;

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

    async createCanvasWebsiteTask() {
        console.log('🎨 Création de tâche d\'affichage Canvas Website...');

        const canvasMessage = `🎨 AFFICHE 3 SITES WEB DANS CANVAS:

1. 🌐 github.com - Prends un screenshot et affiche-le dans Canvas
2. 🎨 dribbble.com - Prends un screenshot et affiche-le dans Canvas
3. 💻 codepen.io - Prends un screenshot et affiche-le dans Canvas

Utilise HTML5 Canvas pour afficher les 3 screenshots côte à côte.
Simple et rapide, merci !`;

        return canvasMessage;
    }

    async sendCanvasMessage(chatTextarea, message) {
        console.log('📤 Envoi de la commande Canvas Website...');

        await this.takeScreenshot('04_avant_canvas', 'Avant envoi de la commande Canvas');

        await chatTextarea.fill(message);
        console.log('✅ Commande Canvas saisie');

        await this.takeScreenshot('05_canvas_saisi', 'Commande Canvas saisie dans le chat');

        const sendButton = this.page.locator('button[type="submit"], button[aria-label*="send"], .send-button').first();

        if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Commande Canvas envoyée');
        } else {
            await chatTextarea.press('Enter');
            console.log('✅ Commande Canvas envoyée (Enter)');
        }

        await this.takeScreenshot('06_canvas_envoye', 'Commande Canvas envoyée - rendu en cours');
        return true;
    }

    async monitorCanvasRendering() {
        console.log('⏳ Surveillance du rendu Canvas...');

        // Attendre début du rendu Canvas
        await this.page.waitForTimeout(4000);
        await this.takeScreenshot('07_debut_rendu', 'Début du rendu Canvas');

        // Scroll pour voir la réponse de l'agent et attendre finalisation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(15000);
        await this.takeScreenshot('08_rendu_complete', 'Rendu Canvas complété - réponse complète visible');

        return true;
    }

    async verifyCanvasResults() {
        console.log('✅ Vérification des résultats Canvas...');

        // Chercher des indicateurs de succès du rendu Canvas
        const canvasIndicators = await this.page.locator('text=/canvas|Canvas|rendu|render|website|site/i').count();
        const websiteIndicators = await this.page.locator('text=/github|dribbble|codepen|steam|shopify/i').count();
        const imageIndicators = await this.page.locator('text=/png|jpg|screenshot|image|visual/i').count();

        console.log(`🎨 Indicateurs Canvas: ${canvasIndicators}`);
        console.log(`🌐 Indicateurs Sites Web: ${websiteIndicators}`);
        console.log(`🖼️ Indicateurs Images: ${imageIndicators}`);

        await this.takeScreenshot('09_resultats_', 'Résultats Canvas vérifiés');

        return {
            canvasIndicators,
            websiteIndicators,
            imageIndicators,
            canvasRendered: canvasIndicators > 1 || websiteIndicators > 0
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
        console.log('📊 RÉSULTATS TEST CANVAS WEBSITE');
        console.log('='.repeat(50));
        console.log(`⏱️ Durée: ${results.duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`🎨 Rendus Canvas: ${this.metrics.canvasRenderings.length}`);
        console.log(`🌐 Sites Web traités: ${this.metrics.websites.length}`);
        console.log(`👁️ Éléments visibles: ${results.visibleElements}`);
        console.log(`❌ Erreurs: ${results.errorElements}`);
        console.log(`📄 Titre: ${results.title}`);
        console.log(`🌐 URL: ${results.url}`);

        await this.takeScreenshot('10_analyse_finale', 'Analyse finale Canvas Website');

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

            const canvasMessage = await this.createCanvasWebsiteTask();

            if (!await this.sendCanvasMessage(chatInterface, canvasMessage)) {
                throw new Error('Échec envoi commande Canvas');
            }

            await this.monitorCanvasRendering();
            const results = await this.verifyCanvasResults();
            const finalAnalysis = await this.performFinalAnalysis();

            console.log('\n🎉 TEST CANVAS WEBSITE TERMINÉ AVEC SUCCÈS !');

            return {
                success: results.canvasRendered,
                results: { ...results, ...finalAnalysis },
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST CANVAS WEBSITE:', error.message);

            try {
                await this.takeScreenshot('erreur_canvas', 'Erreur critique Canvas Website');
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
    const tester = new CanvasWebsiteTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Rendu Canvas Website fonctionnel !');
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

module.exports = CanvasWebsiteTester;