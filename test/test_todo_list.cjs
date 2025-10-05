const { chromium } = require('playwright');

/**
 * AgenticForge Todo List Test - Version Optimisée
 * Test spécialisé pour les fonctionnalités de gestion de tâches avec screenshots optimisés
 */

class TodoListTester {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.metrics = {
            screenshots: [],
            todos: [],
            errors: [],
            startTime: Date.now()
        };
    }

    async initialize() {
        console.log('📋 Initialisation du test Todo List...');

        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1400, height: 900 }
        });

        this.page = await this.context.newPage();
        this.setupEventListeners();

        console.log('✅ Navigateur initialisé');
    }

    setupEventListeners() {
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('todo') || text.includes('Todo') || text.includes('tâche') || text.includes('task')) {
                console.log('📋 Todo:', text);
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
        const filename = `todo_${timestamp}_${name}.png`;

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

    async createTodoTask() {
        console.log('📝 Création d\'une liste de tâches...');

        const todoMessage = `🛠️ FAIS DES TÂCHES RÉELLES avec tes outils MCP:

1. 🕐 DONNE L'HEURE ACTUELLE exacte avec secondes
2. 📁 LIS le fichier README.md du projet et montre les 3 premières lignes
3. 🔍 LISTE les fichiers dans le répertoire courant
4. 💾 CRÉE un petit fichier test.txt avec "Hello World" dedans
5. 🌐 VÉRIFIE si google.com est accessible
6. 📊 AFFICHE l'utilisation mémoire/RAM du système
7. 📝 LIS le fichier package.json et montre la version
8. ⚡ EXÉCUTE une commande simple comme "echo test"

Utilise tes vrais outils MCP pour faire ces tâches concrètes. Montre les résultats réels !`;

        return todoMessage;
    }

    async sendTodoMessage(chatTextarea, message) {
        console.log('📤 Envoi du message Todo...');

        await this.takeScreenshot('04_avant_todo', 'Avant envoi de la Todo List');

        await chatTextarea.fill(message);
        console.log('✅ Message Todo saisi');

        await this.takeScreenshot('05_todo_saisi', 'Todo List saisie dans le chat');

        const sendButton = this.page.locator('button[type="submit"], button[aria-label*="send"], .send-button').first();

        if (await sendButton.isVisible()) {
            await sendButton.click();
            console.log('✅ Message Todo envoyé');
        } else {
            await chatTextarea.press('Enter');
            console.log('✅ Message Todo envoyé (Enter)');
        }

        await this.takeScreenshot('06_todo_envoye', 'Todo List envoyée - traitement en cours');
        return true;
    }

    async monitorTodoProcessing() {
        console.log('⏳ Surveillance du traitement Todo...');

        // Attendre début de traitement
        await this.page.waitForTimeout(5000);
        await this.takeScreenshot('07_debut_traitement', 'Début du traitement Todo');

        // Scroll pour voir la réponse de l'agent et attendre finalisation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(12000);
        await this.takeScreenshot('08_todo_complete', 'Todo List traitée - réponse complète visible');

        return true;
    }

    async verifyTodoResults() {
        console.log('✅ Vérification des résultats Todo...');

        // Chercher des indicateurs de succès
        const successIndicators = await this.page.locator('text=/succès|terminé|complété|validé|ok|✅/i').count();
        const todoElements = await this.page.locator('text=/tâche|todo|task|à faire|priorité|échéance/i').count();

        console.log(`📊 Indicateurs de succès: ${successIndicators}`);
        console.log(`📝 Éléments Todo trouvés: ${todoElements}`);

        await this.takeScreenshot('09_resultats_todo', 'Résultats Todo vérifiés');

        return {
            successIndicators,
            todoElements,
            processed: successIndicators > 1 || todoElements > 5
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
        console.log('📊 RÉSULTATS TEST TODO LIST');
        console.log('='.repeat(50));
        console.log(`⏱️ Durée: ${results.duration}s`);
        console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
        console.log(`📋 Todos créés: ${this.metrics.todos.length}`);
        console.log(`👁️ Éléments visibles: ${results.visibleElements}`);
        console.log(`❌ Erreurs: ${results.errorElements}`);
        console.log(`📄 Titre: ${results.title}`);
        console.log(`🌐 URL: ${results.url}`);

        await this.takeScreenshot('10_analyse_finale', 'Analyse finale Todo List');

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

            const todoMessage = await this.createTodoTask();

            if (!await this.sendTodoMessage(chatInterface, todoMessage)) {
                throw new Error('Échec envoi message Todo');
            }

            await this.monitorTodoProcessing();
            const results = await this.verifyTodoResults();
            const finalAnalysis = await this.performFinalAnalysis();

            console.log('\n🎉 TEST TODO LIST TERMINÉ AVEC SUCCÈS !');

            return {
                success: results.processed,
                results: { ...results, ...finalAnalysis },
                screenshots: this.metrics.screenshots.map(s => s.filename)
            };

        } catch (error) {
            console.error('\n❌ ÉCHEC TEST TODO:', error.message);

            try {
                await this.takeScreenshot('erreur_todo', 'Erreur critique Todo List');
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
    const tester = new TodoListTester();
    const results = await tester.run();

    if (results.success) {
        console.log('\n✅ SUCCÈS: Todo List fonctionnelle !');
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

module.exports = TodoListTester;