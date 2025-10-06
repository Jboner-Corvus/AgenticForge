const { chromium } = require('playwright');
const { TestUtils } = require('./test_utils.cjs');

/**
 * AgenticForge Canvas Website Test
 * Test spécialisé pour l'affichage de sites web dans Canvas
 */

class CanvasWebsiteTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testUtils = new TestUtils();
        this.testName = 'canvas_website';
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
            await this.page.goto('http://localhost:3002/', {
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

            // Nettoyer le chat avant le nouveau test
            await this.clearChatInterface(chatTextarea);

            await this.takeScreenshot('03_chat_trouve', 'Interface de chat localisée et nettoyée');
            return chatTextarea;
        } else {
            console.log('❌ Interface de chat non trouvée');
            return null;
        }
    }

    async clearChatInterface(chatTextarea) {
        console.log('🧹 Nettoyage de l\'interface de chat...');

        try {
            // Sélectionner tout le texte existant et le supprimer
            await chatTextarea.click();
            await chatTextarea.fill('');

            // Attendre que le champ soit vide
            await this.page.waitForTimeout(500);

            // Vérifier s'il y a des messages précédents à effacer
            const clearButton = this.page.locator('button[aria-label*="clear"], button[title*="clear"], .clear-chat').first();
            if (await clearButton.isVisible()) {
                await clearButton.click();
                console.log('🗑️ Chat history cleared');
                await this.page.waitForTimeout(1000);
            }

            console.log('✅ Chat interface nettoyée');
        } catch (error) {
            console.warn('⚠️ Erreur nettoyage chat:', error.message);
        }
    }

    async createCanvasWebsiteTask() {
        console.log('🎨 Création de tâche d\'affichage Canvas Website...');

        const timestamp = new Date().toISOString();
        const uniqueId = Math.random().toString(36).substring(7);

        const canvasMessage = `🚨 TÂCHE OBLIGATOIRE - ID UNIQUE: ${uniqueId}
        🎨 TÂCHE CANVAS WEBSITE - Timestamp: ${timestamp}

        📋 INSTRUCTIONS PRÉCISES SANS AMBIGUÏTÉ:

        1️⃣ 🌐 Ouvre ton navigateur Playwright et va sur https://github.com
           - Prends un VRAI screenshot avec ton outil browser_screenshot
           - Enregistre-le sous "github_${uniqueId}.png"

        2️⃣ 🎨 Ouvre un nouvel onglet et va sur https://dribbble.com
           - Prends un VRAI screenshot avec ton outil browser_screenshot
           - Enregistre-le sous "dribbble_${uniqueId}.png"

        3️⃣ 💻 Ouvre un nouvel onglet et va sur https://codepen.io
           - Prends un VRAI screenshot avec ton outil browser_screenshot
           - Enregistre-le sous "codepen_${uniqueId}.png"

        4️⃣ 🖼️ Crée un document HTML avec Canvas
           - Affiche les 3 screenshots dans le Canvas
           - Ajoute le timestamp: ${timestamp}
           - Ajoute l'ID unique: ${uniqueId}
           - Sauvegarde le HTML comme "canvas_result_${uniqueId}.html"

        🔍 PREUVES EXIGÉES:
        - Affiche les 3 noms de fichiers screenshots créés
        - Affiche les dimensions de chaque image
        - Affiche l'URL du fichier HTML créé
        - Montre le timestamp et l'ID unique dans ta réponse

        ⚠️ VALIDATION: Je vais vérifier que tu as utilisé les outils browser_* et que les fichiers existent vraiment.
        🚫 INTERDIT: Ne fais PAS semblant, je détecterai si tu n'utilises pas d'outils.`;

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
        this.currentJobId = null;

        // Attendre début du rendu Canvas et identifier le job ID
        await this.page.waitForTimeout(4000);
        await this.takeScreenshot('07_debut_rendu', 'Début du rendu Canvas');

        // Scroll pour voir la réponse de l'agent
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Surveillance intelligente avec timeout adaptatif et monitoring des logs
        const maxWaitTime = 60000; // 1 minute max pour éviter les blocages
        const checkInterval = 3000; // Vérifier toutes les 3 secondes
        let waitTime = 0;
        let jobCompleted = false;
        let lastLogCount = 0;
        let stuckCounter = 0;

        console.log(`🔍 Surveillance active pour ${maxWaitTime/1000}s max...`);

        while (waitTime < maxWaitTime && !jobCompleted) {
            await this.page.waitForTimeout(checkInterval);
            waitTime += checkInterval;

            // Prendre un screenshot TOUTES les 15 secondes (plus fréquent)
            if (waitTime % 15000 === 0) {
                const progressName = `08_progress_${waitTime/1000}s`;
                await this.takeScreenshot(progressName, `Progression à ${waitTime/1000}s - surveillance continue`);
                console.log(`📸 Screenshot progression: ${waitTime/1000}s`);
            }

            // Screenshot supplémentaire si de nouveaux résultats apparaissent
            const currentResults = await this.page.locator('text=/canvas|screenshot|github|dribbble|codepen|error|success|finished|complet/i').count();
            if (currentResults > lastLogCount) {
                const resultName = `08_result_detected_${waitTime/1000}s`;
                await this.takeScreenshot(resultName, `Nouveaux résultats détectés à ${waitTime/1000}s`);
                console.log(`🎯 Nouveaux résultats visuels: ${currentResults} indicateurs`);
                lastLogCount = currentResults;
            }

            // Vérifier les logs pour voir si le job est terminé
            const latestJobId = await this.getLatestJobId();
            if (latestJobId && latestJobId !== this.currentJobId) {
                this.currentJobId = latestJobId;
                console.log(`📋 Job ID détecté: ${latestJobId}`);
                await this.takeScreenshot(`08_job_detected_${waitTime/1000}s`, `Job ${latestJobId} détecté`);
            }

            if (this.currentJobId) {
                const jobStatus = await this.checkJobCompletion(this.currentJobId);
                if (jobStatus.completed) {
                    console.log(`✅ Job ${this.currentJobId} terminé en ${waitTime/1000}s`);
                    await this.takeScreenshot(`08_job_completed_${waitTime/1000}s`, `Job ${this.currentJobId} terminé avec succès`);
                    jobCompleted = true;
                    this.jobResult = jobStatus.result;
                } else if (jobStatus.error) {
                    console.log(`❌ Erreur job ${this.currentJobId}: ${jobStatus.error}`);
                    await this.takeScreenshot(`08_job_error_${waitTime/1000}s`, `Erreur job ${this.currentJobId}`);
                    break;
                } else if (jobStatus.hasErrors) {
                    console.log(`⚠️ Job ${this.currentJobId} a des erreurs: ${jobStatus.errors.length}`);
                    await this.takeScreenshot(`08_job_warnings_${waitTime/1000}s`, `Warnings job ${this.currentJobId}`);
                }
            }

            // Vérifier visuellement si on voit des résultats et documenter
            const hasResults = await this.page.locator('text=/canvas|screenshot|github|dribbble|codepen/i').count() > 2;
            if (hasResults && waitTime > 30000) { // Dès 30s
                console.log('🎨 Résultats visuels détectés, continuation surveillance...');
                stuckCounter = 0; // Reset counter si progression
            } else {
                stuckCounter++;
                if (stuckCounter > 6) { // 30s sans progression (6 x 5s)
                    console.log(`⚠️ Pas de progression depuis ${stuckCounter * 5}s, capture d'écran de debug...`);
                    await this.takeScreenshot(`08_no_progress_${waitTime/1000}s`, `Pas de progression - debug à ${waitTime/1000}s`);
                    stuckCounter = 0;
                }
            }

            // Log régulier pour montrer que le script est actif
            if (waitTime % 20000 === 0) { // Toutes les 20 secondes
                console.log(`⏳ Surveillance active: ${waitTime/1000}s/${maxWaitTime/1000}s - Job: ${this.currentJobId || 'recherche'} - Résultats: ${currentResults} indicateurs`);
            }
        }

        await this.takeScreenshot('08_rendu_complete', `Rendu Canvas final - ${jobCompleted ? 'TERMINÉ' : 'TIMEOUT'}`);

        return {
            completed: jobCompleted,
            jobId: this.currentJobId,
            duration: waitTime,
            result: this.jobResult
        };
    }

    async getLatestJobId() {
        try {
            const logFiles = this.testUtils.logViewer.getLogFiles();
            if (logFiles.length === 0) return null;

            const latestFile = logFiles[0];
            const match = latestFile.filename.match(/worker-(\d+)-/);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    async checkJobCompletion(jobId) {
        try {
            const logs = this.testUtils.logViewer.getLogsForJob(jobId);
            if (logs.length === 0) return { completed: false };

            // Chercher les logs de finalisation
            const finalLog = logs.find(log =>
                log.type === 'finalization' ||
                log.msg?.includes('Job completed successfully') ||
                log.msg?.includes('Worker execution completed')
            );

            // Chercher les erreurs
            const errorLogs = logs.filter(log =>
                log.level === 'error' ||
                log.type === 'error' ||
                log.msg?.includes('error') ||
                log.msg?.includes('failed')
            );

            return {
                completed: !!finalLog,
                hasErrors: errorLogs.length > 0,
                errors: errorLogs,
                result: finalLog?.result || null,
                duration: finalLog?.metrics?.totalDuration || 0
            };
        } catch (error) {
            return { completed: false, error: error.message };
        }
    }

    async verifyCanvasResults() {
        console.log('✅ Vérification des résultats Canvas...');

        // Vérification basée sur les logs réels si disponible
        let logBasedResults = false;
        let errorMessage = null;
        let toolUsageValid = false;

        if (this.currentJobId && this.jobResult) {
            logBasedResults = this.jobResult.success === true;

            // Vérifier l'utilisation des outils
            const jobLogs = this.testUtils.logViewer.getLogsForJob(this.currentJobId);
            const toolUsageLogs = jobLogs.filter(log => log.type === 'tool_use' || log.toolName);
            toolUsageValid = toolUsageLogs.length > 0;

            console.log(`🔧 Utilisation d'outils détectée: ${toolUsageValid ? 'OUI' : 'NON'} (${toolUsageLogs.length} outils)`);

            // Détecter si l'agent a donné une réponse générique/erronée
            const genericResponse = this.jobResult.response?.includes('affiché le contenu demandé') ||
                                 this.jobResult.response?.includes('Y a-t-il autre chose') ||
                                 this.jobResult.response?.includes('réussi') ||
                                 this.jobResult.response?.length < 50;

            if (genericResponse) {
                console.log(`⚠️ Réponse générique détectée - possible réutilisation d'anciens résultats`);
                errorMessage = 'L\'agent a donné une réponse générique au lieu d\'exécuter la tâche';
                logBasedResults = false;
            } else if (!toolUsageValid) {
                console.log(`⚠️ Aucun outil utilisé - l\'agent n\'a pas exécuté la tâche réellement`);
                errorMessage = 'L\'agent prétend avoir fait la tâche mais n\'a utilisé aucun outil';
                logBasedResults = false;
            } else {
                console.log(`📊 Résultat log job ${this.currentJobId}: ${logBasedResults ? 'SUCCÈS' : 'ÉCHEC'}`);
            }
        }

        // Vérification visuelle approfondie
        const canvasIndicators = await this.page.locator('text=/canvas|Canvas|rendu|render|website|site/i').count();
        const websiteIndicators = await this.page.locator('text=/github|dribbble|codepen|steam|shopify/i').count();
        const imageIndicators = await this.page.locator('text=/png|jpg|screenshot|image|visual/i').count();

        // Vérifier les mots-clés spécifiques à notre tâche
        const taskSpecificIndicators = await this.page.locator('text=/github\.com|dribbble\.com|codepen\.io/i').count();
        const currentDateTime = await this.page.locator('text=/2025-10-0[56]|00:[0-5][0-9]/i').count();

        // Vérifier la présence d'IDs uniques (7 caractères aléatoires)
        const uniqueIdPattern = await this.page.locator('text=/[a-z0-9]{7}/i').count();
        const fileCreated = await this.page.locator('text=/github_[a-z0-9]{7}\.png|dribbble_[a-z0-9]{7}\.png|codepen_[a-z0-9]{7}\.png|canvas_result_[a-z0-9]{7}\.html/i').count();

        // Vérifier les erreurs visibles
        const errorElements = await this.page.locator('text=/error|erreur|failed|problème|issue/i').count();
        const warningElements = await this.page.locator('text=/warning|attention|avertissement/i').count();

        console.log(`🎨 Indicateurs Canvas: ${canvasIndicators}`);
        console.log(`🌐 Indicateurs Sites Web: ${websiteIndicators}`);
        console.log(`🖼️ Indicateurs Images: ${imageIndicators}`);
        console.log(`🎯 Indicateurs spécifiques (github/dribbble/codepen): ${taskSpecificIndicators}`);
        console.log(`📅 Date/heure actuelle: ${currentDateTime}`);
        console.log(`🆔 IDs uniques trouvées: ${uniqueIdPattern}`);
        console.log(`📁 Fichiers uniques créés: ${fileCreated}`);
        console.log(`❌ Erreurs: ${errorElements}`);
        console.log(`⚠️ Warnings: ${warningElements}`);

        // Validation très stricte : nécessite outils ET IDs uniques ET indicateurs spécifiques
        const hasValidResults = taskSpecificIndicators > 0 && imageIndicators > 0 && fileCreated > 0;
        const hasCurrentTimestamp = currentDateTime > 0;

        const finalSuccess = logBasedResults && hasValidResults && !errorMessage && toolUsageValid;

        if (errorMessage) {
            console.log(`❌ ERREUR DÉTECTÉE: ${errorMessage}`);
        }

        if (!hasValidResults) {
            console.log(`⚠️ Résultats spécifiques manquants - l'agent n'a pas exécuté la vraie tâche`);
        }

        if (!hasCurrentTimestamp) {
            console.log(`⚠️ Timestamp actuel manquant - possible réutilisation d'anciens résultats`);
        }

        await this.takeScreenshot('09_resultats_', `Résultats Canvas: ${finalSuccess ? 'VALIDÉS' : 'INVALIDES'} - erreurs: ${errorElements}`);

        return {
            canvasIndicators,
            websiteIndicators,
            imageIndicators,
            taskSpecificIndicators,
            currentDateTime,
            errorElements,
            warningElements,
            logBasedSuccess: logBasedResults && hasValidResults && hasCurrentTimestamp,
            errorMessage,
            canvasRendered: finalSuccess,
            jobResult: this.jobResult,
            validationDetails: {
                hasSpecificResults: hasValidResults,
                hasCurrentTimestamp: hasCurrentTimestamp,
                hasErrors: errorElements > 0,
                hasWarnings: warningElements > 0
            }
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
        this.jobStartTime = Date.now();
        this.currentJobId = null;
        this.jobResult = null;

        try {
            console.log('🚀 DÉMARRAGE TEST CANVAS WEBSITE OPTIMISÉ\n');

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

            // Surveillance intelligente avec monitoring des logs
            const monitoringResult = await this.monitorCanvasRendering();
            console.log(`📊 Monitoring résultat: ${JSON.stringify(monitoringResult, null, 2)}`);

            const results = await this.verifyCanvasResults();
            const finalAnalysis = await this.performFinalAnalysis();

            // Afficher les logs worker avec le bon job ID
            console.log('\n📝 RÉCUPÉRATION DES LOGS WORKER...');
            if (this.currentJobId) {
                console.log(`📋 Job ID identifié: ${this.currentJobId}`);
                await this.testUtils.waitForLogsAndDisplay(this.currentJobId, 1000);
            } else {
                console.log('⚠️ Aucun job ID identifié, affichage des logs récents');
                await this.testUtils.waitForLogsAndDisplay('recent', 3000);
            }

            // Analyse finale basée sur les logs réels
            const testSuccess = results.logBasedSuccess || results.canvasRendered;
            const executionTime = Math.round((Date.now() - this.jobStartTime) / 1000);

            console.log('\n' + '='.repeat(60));
            console.log('🎉 TEST CANVAS WEBSITE TERMINÉ');
            console.log('='.repeat(60));
            console.log(`✅ Succès: ${testSuccess ? 'OUI' : 'NON'}`);
            console.log(`⏱️ Durée totale: ${executionTime}s`);
            console.log(`📋 Job ID: ${this.currentJobId || 'Non identifié'}`);
            console.log(`🎨 Rendu Canvas: ${results.canvasRendered ? 'OUI' : 'NON'}`);
            console.log(`📊 Logs success: ${results.logBasedSuccess ? 'OUI' : 'NON'}`);
            console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
            console.log(`🌐 Indicateurs web: ${results.websiteIndicators}`);
            console.log(`🖼️ Indicateurs images: ${results.imageIndicators}`);

            if (this.jobResult) {
                console.log(`🎯 Résultat agent: ${this.jobResult.response}`);
            }

            // Nettoyage intelligent
            await this.performIntelligentCleanup();

            // Afficher le résumé des screenshots
            this.testUtils.displayScreenshotsSummary(this.testName);

            return {
                success: testSuccess,
                executionTime,
                jobId: this.currentJobId,
                jobResult: this.jobResult,
                monitoring: monitoringResult,
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

            // Tenter d'afficher les logs même en cas d'échec
            try {
                console.log('\n📝 Tentative de récupération des logs en cas d\'erreur...');
                await this.testUtils.waitForLogsAndDisplay('recent', 2000);
            } catch (logError) {
                console.error('❌ Impossible de récupérer les logs:', logError.message);
            }

            return {
                success: false,
                error: error.message,
                executionTime: Math.round((Date.now() - this.jobStartTime) / 1000)
            };
        } finally {
            await this.cleanup();
        }
    }

    async performIntelligentCleanup() {
        console.log('🧹 Nettoyage intelligent...');

        try {
            // Nettoyer les anciens screenshots (garder seulement les 20 plus récents)
            this.testUtils.cleanupOldScreenshots();

            // Nettoyer les anciens logs worker (garder 10 plus récents)
            await this.cleanupOldWorkerLogs();

            console.log('✅ Nettoyage intelligent terminé');
        } catch (error) {
            console.error('⚠️ Erreur nettoyage intelligent:', error.message);
        }
    }

    async cleanupOldWorkerLogs() {
        try {
            const logFiles = this.testUtils.logViewer.getLogFiles();
            if (logFiles.length <= 10) return;

            const toDelete = logFiles.slice(10);
            const fs = require('fs');
            const path = require('path');

            toDelete.forEach(file => {
                try {
                    fs.unlinkSync(path.join('../packages/core/logs', file.filename));
                    console.log(`🗑️ Ancien log supprimé: ${file.filename}`);
                } catch (e) {
                    console.warn(`⚠️ Impossible de supprimer ${file.filename}: ${e.message}`);
                }
            });
        } catch (error) {
            console.error('❌ Erreur nettoyage logs worker:', error.message);
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