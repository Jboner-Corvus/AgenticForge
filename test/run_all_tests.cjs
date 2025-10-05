#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * AgenticForge Master Test Runner
 * Lance tous les tests spécialisés avec gestion centralisée
 */

class MasterTestRunner {
    constructor() {
        this.testScripts = [
            {
                name: 'Todo List Test',
                file: 'test_todo_list.cjs',
                description: 'Test des fonctionnalités de gestion de tâches',
                icon: '📋',
                priority: 1
            },
            {
                name: 'Playwright Browser Test',
                file: 'test_playwright_browser.cjs',
                description: 'Test d\'automatisation web avec Playwright',
                icon: '🎭',
                priority: 2
            },
            {
                name: 'Canvas Website Test',
                file: 'test_canvas_website.cjs',
                description: 'Test d\'affichage de sites web dans Canvas',
                icon: '🎨',
                priority: 3
            },
            {
                name: 'Game Display Test',
                file: 'test_game_display.cjs',
                description: 'Test d\'affichage de jeux dans Canvas',
                icon: '🎮',
                priority: 4
            },
            {
                name: 'Tesla Stock Price Test',
                file: 'test_tesla_stock.cjs',
                description: 'Test d\'affichage des prix d\'actions Tesla',
                icon: '📈',
                priority: 5
            }
        ];

        this.results = {
            completed: [],
            failed: [],
            skipped: [],
            startTime: Date.now(),
            totalScreenshots: 0
        };
    }

    async runTest(testScript) {
        return new Promise((resolve, reject) => {
            console.log(`\n${testScript.icon} Lancement: ${testScript.name}`);
            console.log(`📁 Script: ${testScript.file}`);
            console.log(`📝 Description: ${testScript.description}`);

            const startTime = Date.now();
            const child = spawn('node', [testScript.file], {
                stdio: 'pipe',
                cwd: __dirname
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                console.log(output.trim());
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                console.error('❌', output.trim());
            });

            child.on('close', (code) => {
                const duration = Math.round((Date.now() - startTime) / 1000);
                const screenshots = this.extractScreenshotCount(stdout);

                const result = {
                    ...testScript,
                    exitCode: code,
                    duration,
                    screenshots,
                    stdout,
                    stderr,
                    success: code === 0
                };

                if (code === 0) {
                    console.log(`\n✅ ${testScript.icon} SUCCÈS: ${testScript.name} (${duration}s, ${screenshots} screenshots)`);
                    this.results.completed.push(result);
                } else {
                    console.log(`\n❌ ${testScript.icon} ÉCHEC: ${testScript.name} (${duration}s)`);
                    this.results.failed.push(result);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                console.error(`\n💥 ${testScript.icon} ERREUR CRITIQUE: ${testScript.name} - ${error.message}`);
                const result = {
                    ...testScript,
                    error: error.message,
                    success: false
                };
                this.results.failed.push(result);
                resolve(result);
            });
        });
    }

    extractScreenshotCount(output) {
        const matches = output.match(/📸 Screenshot:.*\.png/g);
        return matches ? matches.length : 0;
    }

    createReport() {
        const totalDuration = Math.round((Date.now() - this.results.startTime) / 1000);
        const successCount = this.results.completed.length;
        const failCount = this.results.failed.length;
        const totalScreenshots = this.results.completed.reduce((sum, test) => sum + test.screenshots, 0);

        const report = {
            summary: {
                totalTests: this.testScripts.length,
                success: successCount,
                failed: failCount,
                skipped: this.results.skipped.length,
                totalDuration,
                totalScreenshots,
                successRate: Math.round((successCount / this.testScripts.length) * 100)
            },
            tests: {
                completed: this.results.completed,
                failed: this.results.failed,
                skipped: this.results.skipped
            }
        };

        return report;
    }

    displayFinalReport(report) {
        console.log('\n' + '='.repeat(80));
        console.log('🎊 AGENTICFORGE TEST SUITE - RAPPORT FINAL');
        console.log('='.repeat(80));

        console.log(`\n📊 RÉSUMÉ GLOBAL:`);
        console.log(`✅ Tests réussis: ${report.summary.success}/${report.summary.totalTests}`);
        console.log(`❌ Tests échoués: ${report.summary.failed}/${report.summary.totalTests}`);
        console.log(`⏭️ Tests ignorés: ${report.summary.skipped}/${report.summary.totalTests}`);
        console.log(`📈 Taux de succès: ${report.summary.successRate}%`);
        console.log(`⏱️ Durée totale: ${report.summary.totalDuration}s`);
        console.log(`📸 Screenshots générés: ${report.summary.totalScreenshots}`);

        if (report.summary.success === report.summary.totalTests) {
            console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! 🎉');
        } else {
            console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ - VOIR LES DÉTAILS CI-DESSOUS');
        }

        console.log('\n📋 DÉTAILS DES TESTS:');
        console.log('-'.repeat(80));

        // Tests réussis
        if (report.tests.completed.length > 0) {
            console.log('\n✅ TESTS RÉUSSIS:');
            report.tests.completed.forEach(test => {
                console.log(`  ${test.icon} ${test.name} (${test.duration}s, ${test.screenshots} screenshots)`);
            });
        }

        // Tests échoués
        if (report.tests.failed.length > 0) {
            console.log('\n❌ TESTS ÉCHOUÉS:');
            report.tests.failed.forEach(test => {
                console.log(`  ${test.icon} ${test.name} (Exit code: ${test.exitCode || 'ERROR'})`);
                if (test.error) {
                    console.log(`     Erreur: ${test.error}`);
                }
            });
        }

        // Screenshots générés
        if (report.summary.totalScreenshots > 0) {
            console.log('\n📸 SCREENSHOTS GÉNÉRÉS:');
            console.log(`   Total: ${report.summary.totalScreenshots} fichiers PNG`);
            console.log('   Format timestampé: test_YYYY-MM-DDTHHMMSS_nom.png');
        }

        console.log('\n' + '='.repeat(80));
        console.log('🏁 FIN DES TESTS AGENTICFORGE');
        console.log('='.repeat(80));
    }

    saveReportToFile(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = `test_report_${timestamp}.json`;

        try {
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            console.log(`\n📄 Rapport sauvegardé: ${reportFile}`);
        } catch (error) {
            console.error(`❌ Erreur sauvegarde rapport: ${error.message}`);
        }
    }

    async runTests(selectedTests = null) {
        console.log('🚀 Lancement de la suite de tests AgenticForge...');
        console.log(`📁 Répertoire: ${__dirname}`);
        console.log(`⏰ Heure de début: ${new Date().toLocaleString()}`);

        // Vérifier les scripts existent
        const testsToRun = selectedTests || this.testScripts;
        const availableTests = testsToRun.filter(test => fs.existsSync(test.file));

        if (availableTests.length === 0) {
            console.error('❌ Aucun script de test trouvé !');
            return;
        }

        if (availableTests.length < testsToRun.length) {
            console.log(`⚠️ ${testsToRun.length - availableTests.length} script(s) non trouvé(s)`);
        }

        console.log(`\n📋 ${availableTests.length} test(s) à exécuter:`);
        availableTests.forEach(test => {
            console.log(`  ${test.icon} ${test.name}`);
        });

        // Lancer les tests séquentiellement
        for (const test of availableTests) {
            await this.runTest(test);

            // Pause entre tests pour éviter la surcharge
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Générer et afficher le rapport
        const report = this.createReport();
        this.displayFinalReport(report);
        this.saveReportToFile(report);

        return report;
    }

    // Méthode pour lancer un test spécifique
    async runSpecificTest(testName) {
        const test = this.testScripts.find(t =>
            t.name.toLowerCase().includes(testName.toLowerCase()) ||
            t.file.toLowerCase().includes(testName.toLowerCase())
        );

        if (!test) {
            console.error(`❌ Test "${testName}" non trouvé`);
            console.log('\nTests disponibles:');
            this.testScripts.forEach(t => {
                console.log(`  - ${t.name} (${t.file})`);
            });
            return;
        }

        console.log(`🎯 Lancement du test spécifique: ${test.name}`);
        return await this.runTest(test);
    }

    // Méthode pour lister les tests disponibles
    listTests() {
        console.log('\n📋 TESTS AGENTICFORGE DISPONIBLES:');
        console.log('='.repeat(50));

        this.testScripts.forEach((test, index) => {
            console.log(`${index + 1}. ${test.icon} ${test.name}`);
            console.log(`   📁 ${test.file}`);
            console.log(`   📝 ${test.description}`);
            console.log('');
        });
    }
}

// Gestion des arguments en ligne de commande
async function main() {
    const runner = new MasterTestRunner();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Lancer tous les tests
        const report = await runner.runTests();
        process.exit(report.summary.failed.length > 0 ? 1 : 0);
    } else if (args[0] === 'list') {
        // Lister les tests
        runner.listTests();
        process.exit(0);
    } else if (args[0] === 'run') {
        // Lancer des tests spécifiques
        const selectedTests = args.slice(1).map(testName => {
            const test = runner.testScripts.find(t =>
                t.name.toLowerCase().includes(testName.toLowerCase())
            );
            return test;
        }).filter(Boolean);

        if (selectedTests.length === 0) {
            console.error('❌ Aucun test correspondant trouvé');
            runner.listTests();
            process.exit(1);
        }

        const report = await runner.runTests(selectedTests);
        process.exit(report.summary.failed.length > 0 ? 1 : 0);
    } else {
        // Lancer un test spécifique
        const report = await runner.runSpecificTest(args[0]);
        process.exit(report.success ? 0 : 1);
    }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Erreur non gérée:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
    process.exit(1);
});

// Point d'entrée
if (require.main === module) {
    main();
}

module.exports = MasterTestRunner;