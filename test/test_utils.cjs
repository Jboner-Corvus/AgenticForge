const { LogViewer } = require('../packages/core/dist/logViewer.js');
const fs = require('fs');
const path = require('path');

/**
 * Classe utilitaire pour les tests avec logs et screenshots
 */
class TestUtils {
    constructor() {
        this.logViewer = new LogViewer('../packages/core/logs');
        this.screenshotsDir = path.join(__dirname, 'screenshots');
        this.ensureScreenshotsDir();
    }

    /**
     * S'assure que le dossier screenshots existe
     */
    ensureScreenshotsDir() {
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
    }

    /**
     * Prend un screenshot avec un nom descriptif
     */
    async takeScreenshot(page, testName, description) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${testName}_${timestamp}_${description.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        const fullPath = path.join(this.screenshotsDir, filename);

        try {
            await page.screenshot({
                path: fullPath,
                fullPage: true
            });
            console.log(`📸 Screenshot sauvegardé: ${filename}`);
            return filename;
        } catch (error) {
            console.error(`❌ Erreur screenshot ${description}:`, error.message);
            return null;
        }
    }

    /**
     * Affiche les logs les plus récents pour un job spécifique
     */
    displayWorkerLogs(jobId, maxLogs = 10) {
        try {
            let logs;

            if (jobId === 'recent') {
                // Récupérer le job le plus récent
                const logFiles = this.logViewer.getLogFiles();
                if (logFiles.length === 0) {
                    console.log('📝 Aucun fichier de log trouvé');
                    return;
                }

                const latestFile = logFiles[0];
                const match = latestFile.filename.match(/worker-(.+?)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.log/);

                if (!match) {
                    console.log('📝 Impossible d\'extraire le job ID du fichier le plus récent');
                    return;
                }

                jobId = match[1];
                console.log(`📝 Analyse du job le plus récent: ${jobId}`);
            }

            logs = this.logViewer.getLogsForJob(jobId);

            if (logs.length === 0) {
                console.log(`📝 Aucun log trouvé pour le job ${jobId}`);
                return;
            }

            console.log(`\n📝 LOGS WORKER - Job ${jobId} (${logs.length} logs au total)`);
            console.log('='.repeat(60));

            // Afficher les logs les plus récents
            const recentLogs = logs.slice(-maxLogs);
            this.logViewer.displayLogs(recentLogs, {
                showMetrics: true,
                colorize: true
            });

            // Afficher un résumé si disponible
            const finalLog = logs.find(log => log.type === 'finalization');
            if (finalLog && finalLog.result) {
                console.log(`🎯 RÉSULTAT AGENT:`);
                console.log(`${JSON.stringify(finalLog.result, null, 2)}`);
            }

            console.log('='.repeat(60));
        } catch (error) {
            console.error(`❌ Erreur lecture des logs:`, error.message);
        }
    }

    /**
     * Attend et affiche les logs récents
     */
    async waitForLogsAndDisplay(jobId, waitTime = 3000) {
        console.log(`⏳ Attente des logs worker (${waitTime}ms)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.displayWorkerLogs(jobId);
    }

    /**
     * Nettoie les anciens screenshots (garde les 50 plus récents)
     */
    cleanupOldScreenshots() {
        try {
            const files = fs.readdirSync(this.screenshotsDir)
                .filter(file => file.endsWith('.png'))
                .map(file => ({
                    name: file,
                    path: path.join(this.screenshotsDir, file),
                    mtime: fs.statSync(path.join(this.screenshotsDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            if (files.length > 50) {
                const filesToDelete = files.slice(50);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Ancien screenshot supprimé: ${file.name}`);
                });
            }
        } catch (error) {
            console.error('❌ Erreur nettoyage screenshots:', error.message);
        }
    }

    /**
     * Affiche un résumé des screenshots générés
     */
    displayScreenshotsSummary(testName) {
        try {
            const files = fs.readdirSync(this.screenshotsDir)
                .filter(file => file.startsWith(testName) && file.endsWith('.png'))
                .sort();

            if (files.length > 0) {
                console.log(`\n📸 SCREENSHOTS GÉNÉRÉS - ${testName}:`);
                files.forEach((file, index) => {
                    console.log(`  ${index + 1}. ${file}`);
                });
                console.log(`📂 Dossier: ${this.screenshotsDir}`);
            }
        } catch (error) {
            console.error('❌ Erreur résumé screenshots:', error.message);
        }
    }
}

module.exports = { TestUtils };