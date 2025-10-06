const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Test Canvas Optimisé - Version simplifiée et robuste
 * Focus sur le diagnostic et la résilience
 */

class OptimizedCanvasTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testName = 'canvas_optimized';
        this.screenshotsDir = path.join(__dirname, 'screenshots');
        this.metrics = {
            screenshots: [],
            startTime: Date.now(),
            errors: [],
            networkRequests: [],
            apiResponses: []
        };
        this.ensureScreenshotsDir();
    }

    ensureScreenshotsDir() {
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
    }

    async takeScreenshot(name, description) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${this.testName}_${timestamp}_${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const fullPath = path.join(this.screenshotsDir, filename);

        try {
            if (this.page) {
                await this.page.screenshot({
                    path: fullPath,
                    fullPage: true
                });
                console.log(`📸 Screenshot: ${filename}`);
                this.metrics.screenshots.push({ filename, name, description, timestamp: Date.now() });
                return filename;
            }
        } catch (error) {
            console.error(`❌ Erreur screenshot ${description}:`, error.message);
            this.metrics.errors.push({ type: 'screenshot_error', message: error.message, timestamp: Date.now() });
        }
        return null;
    }

    async initialize() {
        console.log('🚀 Initialisation test optimisé...');

        try {
            this.browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });

            this.context = await this.browser.newContext({
                viewport: { width: 1400, height: 900 },
                ignoreHTTPSErrors: true
            });

            this.page = await this.context.newPage();

            // Monitoring réseau
            this.page.on('response', response => {
                this.metrics.networkRequests.push({
                    url: response.url(),
                    status: response.status(),
                    timestamp: Date.now()
                });

                if (response.url().includes('/api/')) {
                    this.metrics.apiResponses.push({
                        url: response.url(),
                        status: response.status(),
                        timestamp: Date.now()
                    });

                    if (response.status() >= 400) {
                        console.log(`⚠️ API Error: ${response.status()} - ${response.url()}`);
                        this.metrics.errors.push({
                            type: 'api_error',
                            url: response.url(),
                            status: response.status(),
                            timestamp: Date.now()
                        });
                    }
                }
            });

            this.page.on('console', msg => {
                const text = msg.text();
                if (text.includes('error') || text.includes('Error')) {
                    console.log(`🔍 Browser Console: ${text}`);
                    this.metrics.errors.push({
                        type: 'browser_console_error',
                        message: text,
                        timestamp: Date.now()
                    });
                }
            });

            console.log('✅ Navigateur initialisé');
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation:', error.message);
            this.metrics.errors.push({ type: 'init_error', message: error.message, timestamp: Date.now() });
            return false;
        }
    }

    async checkApiConnectivity() {
        console.log('🔍 Vérification connectivité API...');

        const apiTests = [
            { name: 'Health Check', url: 'http://localhost:3001/api/health' },
            { name: 'Tools API', url: 'http://localhost:3001/api/tools' },
            { name: 'Version API', url: 'http://localhost:3001/api/version/current' }
        ];

        const results = [];

        for (const test of apiTests) {
            try {
                const response = await fetch(test.url, {
                    headers: {
                        'Authorization': 'Bearer Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpG77JU0'
                    }
                });

                const result = {
                    name: test.name,
                    url: test.url,
                    status: response.status,
                    success: response.ok
                };

                results.push(result);
                console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${response.status}`);

                if (!response.ok) {
                    this.metrics.errors.push({
                        type: 'api_connectivity_error',
                        ...result,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                const result = {
                    name: test.name,
                    url: test.url,
                    error: error.message,
                    success: false
                };
                results.push(result);
                console.log(`❌ ${test.name}: ${error.message}`);
                this.metrics.errors.push({
                    type: 'api_connectivity_error',
                    ...result,
                    timestamp: Date.now()
                });
            }
        }

        return results;
    }

    async navigateToApp() {
        console.log('🌐 Navigation vers l\'application...');

        try {
            // Test plusieurs ports au cas où
            const possiblePorts = [3001, 3002, 3006];
            let connected = false;
            let workingPort = null;

            for (const port of possiblePorts) {
                try {
                    const url = `http://localhost:${port}/`;
                    console.log(`🔍 Test port ${port}...`);

                    await this.page.goto(url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 10000
                    });

                    const title = await this.page.title();
                    if (title && title.includes('Vite')) {
                        workingPort = port;
                        connected = true;
                        console.log(`✅ Connecté au port ${port}`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Port ${port} non disponible: ${error.message}`);
                }
            }

            if (!connected) {
                throw new Error('Aucun port disponible trouvé');
            }

            await this.takeScreenshot('01_app_loaded', `Application chargée - port ${workingPort}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur navigation:', error.message);
            this.metrics.errors.push({ type: 'navigation_error', message: error.message, timestamp: Date.now() });
            return false;
        }
    }

    async testSimpleTask() {
        console.log('🧪 Test tâche simple...');

        try {
            // Attendre que l'interface soit prête
            await this.page.waitForTimeout(2000);

            // Chercher le textarea
            const chatTextarea = this.page.locator('textarea').first();

            if (!(await chatTextarea.isVisible())) {
                throw new Error('Interface de chat non trouvée');
            }

            await this.takeScreenshot('02_chat_found', 'Interface de chat trouvée');

            // Envoyer un message simple
            const simpleMessage = 'Test simple: affiche "HELLO WORLD" dans le canvas';

            await chatTextarea.click();
            await chatTextarea.fill(simpleMessage);
            await this.takeScreenshot('03_message_entered', 'Message simple saisi');

            // Envoyer
            await chatTextarea.press('Enter');
            await this.takeScreenshot('04_message_sent', 'Message simple envoyé');

            // Attendre la réponse
            await this.page.waitForTimeout(10000);

            // Vérifier s'il y a une réponse
            const responseElements = await this.page.locator('*:visible').count();
            console.log(`📊 Éléments visibles après message: ${responseElements}`);

            await this.takeScreenshot('05_final_state', 'État final après test simple');

            return true;
        } catch (error) {
            console.error('❌ Erreur test simple:', error.message);
            this.metrics.errors.push({ type: 'simple_task_error', message: error.message, timestamp: Date.now() });
            return false;
        }
    }

    async analyzeResults() {
        console.log('📊 Analyse des résultats...');

        const duration = Math.round((Date.now() - this.metrics.startTime) / 1000);
        const apiErrorCount = this.metrics.errors.filter(e => e.type.includes('api')).length;
        const networkErrorCount = this.metrics.errors.filter(e => e.type.includes('network')).length;

        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSULTATS TEST OPTIMISÉ');
        console.log('='.repeat(60));
        console.log(`⏱️ Durée: ${duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`🌐 Requêtes réseau: ${this.metrics.networkRequests.length}`);
        console.log(`📡 Réponses API: ${this.metrics.apiResponses.length}`);
        console.log(`❌ Erreurs API: ${apiErrorCount}`);
        console.log(`❌ Erreurs réseau: ${networkErrorCount}`);
        console.log(`❌ Total erreurs: ${this.metrics.errors.length}`);

        if (this.metrics.errors.length > 0) {
            console.log('\n🔍 Détail des erreurs:');
            this.metrics.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.type}: ${error.message || error.url || error.status}`);
            });
        }

        if (this.metrics.apiResponses.length > 0) {
            console.log('\n📡 Réponses API:');
            this.metrics.apiResponses.forEach(response => {
                console.log(`  ${response.status} - ${response.url}`);
            });
        }

        return {
            duration,
            screenshots: this.metrics.screenshots.length,
            networkRequests: this.metrics.networkRequests.length,
            apiResponses: this.metrics.apiResponses.length,
            errors: this.metrics.errors.length,
            apiErrorCount,
            networkErrorCount,
            success: this.metrics.errors.length === 0 && this.metrics.apiResponses.length > 0
        };
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
            console.log('🚀 DÉMARRAGE TEST CANVAS OPTIMISÉ\n');

            // 1. Initialisation
            if (!(await this.initialize())) {
                throw new Error('Échec initialisation');
            }

            // 2. Test connectivité API
            const apiResults = await this.checkApiConnectivity();
            const apiHealthy = apiResults.some(r => r.success);

            if (!apiHealthy) {
                console.log('⚠️ API non accessible - test UI seulement');
            }

            // 3. Navigation
            if (!(await this.navigateToApp())) {
                throw new Error('Échec navigation');
            }

            // 4. Test simple
            const simpleTaskSuccess = await this.testSimpleTask();

            // 5. Analyse
            const results = await this.analyzeResults();

            // 6. Résumé
            console.log('\n' + '='.repeat(60));
            console.log('🎉 TEST TERMINÉ');
            console.log('='.repeat(60));
            console.log(`✅ Succès global: ${results.success ? 'OUI' : 'NON'}`);
            console.log(`🔌 API fonctionnelle: ${apiHealthy ? 'OUI' : 'NON'}`);
            console.log(`🧪 Tâche simple: ${simpleTaskSuccess ? 'RÉUSSIE' : 'ÉCHOUÉE'}`);

            // Afficher les screenshots
            if (results.screenshots > 0) {
                console.log('\n📸 Screenshots générés:');
                this.metrics.screenshots.forEach((screenshot, index) => {
                    console.log(`  ${index + 1}. ${screenshot.filename} - ${screenshot.description}`);
                });
            }

            return {
                success: results.success,
                apiHealthy,
                simpleTaskSuccess,
                results,
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST:', error.message);

            try {
                await this.takeScreenshot('ERROR_STATE', 'Erreur critique');
            } catch (e) {
                // Ignorer les erreurs de screenshot en cas d'échec
            }

            return {
                success: false,
                error: error.message,
                duration: Math.round((Date.now() - this.metrics.startTime) / 1000)
            };
        } finally {
            await this.cleanup();
        }
    }
}

// Point d'entrée
async function main() {
    const tester = new OptimizedCanvasTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Test optimisé réussi !');
        process.exit(0);
    } else {
        console.log('\n❌ ÉCHEC: Problèmes détectés');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = OptimizedCanvasTester;